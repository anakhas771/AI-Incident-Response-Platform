"""
REST API views for Enterprise AI Copilot conversation sessions and chat messages.
"""

import asyncio
import json
import logging
from typing import Any, AsyncIterator, Iterator, cast

from asgiref.sync import sync_to_async
from django.db.models import QuerySet
from django.http import StreamingHttpResponse
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.renderers import JSONRenderer
from rest_framework.request import Request
from rest_framework.response import Response

from apps.accounts.models import User
from apps.common.renderers import ServerSentEventRenderer
from apps.knowledge.models import ChatMessage, ChatSession
from apps.knowledge.permissions import (
    IsCopilotSessionOwner,
    IsKnowledgeOrganizationMember,
)
from apps.knowledge.serializers import (
    ChatMessageCreateSerializer,
    ChatMessageSerializer,
    ChatSessionCreateSerializer,
    ChatSessionSerializer,
    ChatSessionUpdateSerializer,
    CopilotChatRequestSerializer,
    CopilotResponseSerializer,
)
from apps.knowledge.services.dtos import StreamEventDTO
from apps.knowledge.services.exceptions import LLMException, ValidationException
from apps.knowledge.services.orchestration.copilot_orchestrator import (
    CopilotOrchestrator,
)

logger = logging.getLogger(__name__)


@extend_schema_view(
    get=extend_schema(
        summary="List chat sessions",
        description="Retrieve all Enterprise AI Copilot conversation sessions for the authenticated user.",
        responses={200: ChatSessionSerializer(many=True)},
    ),
    post=extend_schema(
        summary="Create a chat session",
        description="Create a new Enterprise AI Copilot conversation session.",
        request=ChatSessionCreateSerializer,
        responses={201: ChatSessionSerializer},
    ),
)
class ChatSessionListCreateView(generics.ListCreateAPIView):
    """
    List conversation sessions or create a new chat session for the current user.
    """

    permission_classes = [
        IsAuthenticated,
        IsKnowledgeOrganizationMember,
        IsCopilotSessionOwner,
    ]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ChatSessionCreateSerializer
        return ChatSessionSerializer

    def get_queryset(self) -> QuerySet[ChatSession]:
        user = cast(User, self.request.user)
        if not user or not user.is_authenticated or not user.organization:
            return ChatSession.objects.none()

        queryset = ChatSession.objects.filter(
            organization=user.organization,
            user=user,
        )

        is_archived_param = self.request.query_params.get("is_archived")
        if is_archived_param is not None:
            is_archived = is_archived_param.lower() in ("true", "1", "yes")
            queryset = queryset.filter(is_archived=is_archived)

        return queryset

    def create(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        session = serializer.save(
            organization=cast(User, request.user).organization,
            user=cast(User, request.user),
        )
        output_serializer = ChatSessionSerializer(session)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)


@extend_schema_view(
    get=extend_schema(
        summary="Get chat session detail",
        description="Retrieve details of a specific Enterprise AI Copilot conversation session.",
        responses={200: ChatSessionSerializer},
    ),
    put=extend_schema(
        summary="Update chat session",
        description="Update the title or archive status of a conversation session.",
        request=ChatSessionUpdateSerializer,
        responses={200: ChatSessionSerializer},
    ),
    patch=extend_schema(
        summary="Partially update chat session",
        description="Partially update the title or archive status of a conversation session.",
        request=ChatSessionUpdateSerializer,
        responses={200: ChatSessionSerializer},
    ),
    delete=extend_schema(
        summary="Delete chat session",
        description="Permanently delete a conversation session and all its messages.",
        responses={204: None},
    ),
)
class ChatSessionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update (rename/archive), or delete a specific conversation session.
    """

    permission_classes = [
        IsAuthenticated,
        IsKnowledgeOrganizationMember,
        IsCopilotSessionOwner,
    ]
    lookup_field = "id"

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return ChatSessionUpdateSerializer
        return ChatSessionSerializer

    def get_queryset(self) -> QuerySet[ChatSession]:
        user = cast(User, self.request.user)
        if not user or not user.is_authenticated or not user.organization:
            return ChatSession.objects.none()

        return ChatSession.objects.filter(
            organization=user.organization,
            user=user,
        )

    def update(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        output_serializer = ChatSessionSerializer(instance)
        return Response(output_serializer.data, status=status.HTTP_200_OK)


@extend_schema_view(
    get=extend_schema(
        summary="List messages for a chat session",
        description="Retrieve chronological message history for a specific conversation session.",
        responses={200: ChatMessageSerializer(many=True)},
    ),
    post=extend_schema(
        summary="Send a chat message",
        description="Submit a new message to the conversation session and trigger a Copilot response.",
        request=ChatMessageCreateSerializer,
        responses={200: CopilotResponseSerializer},
    ),
)
class ChatMessageListView(generics.ListCreateAPIView):
    """
    List all chat turns (messages) for a specific session in chronological order or send a new message.
    """

    permission_classes = [
        IsAuthenticated,
        IsKnowledgeOrganizationMember,
        IsCopilotSessionOwner,
    ]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ChatMessageCreateSerializer
        return ChatMessageSerializer

    def get_queryset(self) -> QuerySet[ChatMessage]:
        user = cast(User, self.request.user)
        if not user or not user.is_authenticated or not user.organization:
            return ChatMessage.objects.none()

        session_id = self.kwargs.get("id")
        session = get_object_or_404(
            ChatSession.objects.select_related("organization", "user"),
            id=session_id,
            organization=user.organization,
            user=user,
        )
        return ChatMessage.objects.filter(session=session).order_by("created_at")

    def create(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        user = cast(User, request.user)
        session_id = self.kwargs.get("id")
        session = get_object_or_404(
            ChatSession.objects.select_related("organization", "user"),
            id=session_id,
            organization=user.organization,
            user=user,
        )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user_message = serializer.validated_data["content"]

        # Delegate execution exclusively to CopilotOrchestrator
        orchestrator = CopilotOrchestrator()
        response_dto = orchestrator.execute_turn(session, user_message)

        output_serializer = CopilotResponseSerializer(response_dto)
        return Response(output_serializer.data, status=status.HTTP_200_OK)


def format_sse_event(event: StreamEventDTO) -> str:
    """
    Format a StreamEventDTO into Server-Sent Events (SSE) protocol text format.
    """
    if event.event_type == "heartbeat":
        return ": heartbeat\n\n"
    data_str = (
        json.dumps(event.payload)
        if not isinstance(event.payload, str)
        else json.dumps(event.payload)
    )
    return f"id: {event.event_id}\nevent: {event.event_type}\ndata: {data_str}\n\n"


@extend_schema(
    summary="Execute Copilot chat turn",
    description="Submit a prompt message to an existing conversation session and receive an AI response.",
    request=CopilotChatRequestSerializer,
    responses={200: CopilotResponseSerializer},
)
class CopilotChatView(generics.GenericAPIView):
    """
    Production Chat REST API endpoint.
    Delegates all execution to CopilotOrchestrator and returns CopilotResponseDTO.
    """

    permission_classes = [
        IsAuthenticated,
        IsKnowledgeOrganizationMember,
        IsCopilotSessionOwner,
    ]
    serializer_class = CopilotChatRequestSerializer

    def post(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        session_id = serializer.validated_data["session_id"]
        message = serializer.validated_data["message"]

        user = cast(User, request.user)
        session = get_object_or_404(
            ChatSession.objects.select_related("organization", "user"),
            id=session_id,
            organization=user.organization,
            user=user,
        )
        self.check_object_permissions(request, session)

        orchestrator = CopilotOrchestrator()
        try:
            response_dto = orchestrator.execute(session=session, message=message)
        except (ValidationException, LLMException) as exc:
            return Response(exc.to_dict(), status=exc.status_code)

        output_serializer = CopilotResponseSerializer(response_dto)
        return Response(output_serializer.data, status=status.HTTP_200_OK)


_STREAM_END = object()


def _next_stream_event(iterator: Iterator[StreamEventDTO]) -> object:
    """
    Advance a synchronous orchestrator stream by one event.

    StopIteration is converted into a sentinel because asyncio futures
    cannot propagate StopIteration directly.
    """
    try:
        return next(iterator)
    except StopIteration:
        return _STREAM_END


@extend_schema(
    summary="Stream Copilot chat turn via SSE",
    description=(
        "Submit a prompt message to an existing conversation session "
        "and stream AI response via Server-Sent Events."
    ),
    request=CopilotChatRequestSerializer,
    responses={200: str},
)
class CopilotStreamView(generics.GenericAPIView):
    """
    Server-Sent Events (SSE) streaming endpoint.
    Streams tokens, citations, confidence, suggested questions, and usage.
    """

    permission_classes = [
        IsAuthenticated,
        IsKnowledgeOrganizationMember,
        IsCopilotSessionOwner,
    ]
    serializer_class = CopilotChatRequestSerializer
    renderer_classes = [ServerSentEventRenderer, JSONRenderer]

    def post(
        self, request: Request, *args: Any, **kwargs: Any
    ) -> StreamingHttpResponse:
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        session_id = serializer.validated_data["session_id"]
        message = serializer.validated_data["message"]

        user = cast(User, request.user)

        session = get_object_or_404(
            ChatSession.objects.select_related("organization", "user"),
            id=session_id,
            organization=user.organization,
            user=user,
        )

        self.check_object_permissions(request, session)

        async def event_stream() -> AsyncIterator[str]:
            """
            Adapt the synchronous CopilotOrchestrator stream to an async iterator
            suitable for Django's ASGI/Uvicorn streaming response.
            """
            orchestrator = CopilotOrchestrator()
            stream_iterator: Iterator[StreamEventDTO] = orchestrator.stream(
                session=session,
                message=message,
            )

            try:
                while True:
                    event_dto = await sync_to_async(
                        _next_stream_event,
                        thread_sensitive=True,
                    )(stream_iterator)

                    if event_dto is _STREAM_END:
                        break

                    if not isinstance(event_dto, StreamEventDTO):
                        raise TypeError(
                            f"Unexpected SSE event type: {type(event_dto).__name__}"
                        )

                    yield format_sse_event(event_dto)

            except asyncio.CancelledError:
                logger.warning("SSE stream cancelled by client.")
                raise

            except Exception as exc:
                logger.exception("Copilot SSE stream failed")

                if hasattr(exc, "to_dict"):
                    err_payload = exc.to_dict()
                else:
                    err_payload = {
                        "error": str(exc),
                        "code": getattr(
                            exc,
                            "code",
                            "INTERNAL_SERVER_ERROR",
                        ),
                    }

                yield f"id: 0\nevent: error\ndata: {json.dumps(err_payload)}\n\n"

        response = StreamingHttpResponse(
            event_stream(),
            content_type="text/event-stream",
        )

        response["Cache-Control"] = "no-cache"
        response["X-Accel-Buffering"] = "no"

        return response
