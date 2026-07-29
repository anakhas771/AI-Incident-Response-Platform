from typing import Any

from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import OpenApiResponse, extend_schema, extend_schema_view
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from apps.accounts.models import User

from .filters import IncidentFilter
from .models import Incident
from .permissions import IncidentPermission, IsIncidentOrganizationMember
from .serializers import (
    CommentSerializer,
    IncidentAssignSerializer,
    IncidentCreateUpdateSerializer,
    IncidentDetailSerializer,
    IncidentEventSerializer,
    IncidentListSerializer,
    IncidentStatusSerializer,
)
from .services import IncidentService


@extend_schema_view(
    list=extend_schema(
        tags=["Incidents"],
        summary="List organization incidents",
        description="Retrieves a paginated list of incidents belonging exclusively to the authenticated user's organization.",
    ),
    create=extend_schema(
        tags=["Incidents"],
        summary="Create a new incident",
        description="Creates an incident within the authenticated user's organization and logs a timeline creation event.",
    ),
    retrieve=extend_schema(
        tags=["Incidents"],
        summary="Retrieve incident details",
        description="Retrieves comprehensive details of a specific incident including comments and event history.",
    ),
    update=extend_schema(
        tags=["Incidents"],
        summary="Update incident",
        description="Updates an existing incident.",
    ),
    partial_update=extend_schema(
        tags=["Incidents"],
        summary="Partially update incident",
        description="Partially updates an existing incident.",
    ),
    destroy=extend_schema(
        tags=["Incidents"],
        summary="Delete incident",
        description="Deletes an incident (ADMIN access required).",
    ),
)
class IncidentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing enterprise incidents, custom status/assignment transitions, comments, and timeline events.
    """

    permission_classes = [IsAuthenticated, IncidentPermission, IsIncidentOrganizationMember]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_class = IncidentFilter
    search_fields = ["title", "description"]
    ordering_fields = ["created_at", "updated_at", "severity", "status"]
    ordering = ["-created_at"]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Incident.objects.none()
        if user.is_superuser:
            return Incident.objects.all().select_related(
                "organization", "created_by", "assigned_to"
            )
        if not user.organization:
            return Incident.objects.none()
        return Incident.objects.filter(organization=user.organization).select_related(
            "organization", "created_by", "assigned_to"
        )

    def get_serializer_class(self):
        if self.action == "list":
            return IncidentListSerializer
        if self.action in ["create", "update", "partial_update"]:
            return IncidentCreateUpdateSerializer
        if self.action == "assign":
            return IncidentAssignSerializer
        if self.action in ["status", "change_status"]:
            return IncidentStatusSerializer
        if self.action == "comments":
            return CommentSerializer
        return IncidentDetailSerializer

    def perform_create(self, serializer):
        user = self.request.user
        if not user.organization:
            raise PermissionDenied("User does not belong to an organization.")
        assigned_to_id = serializer.validated_data.pop("assigned_to_id", None)
        assigned_to_user = None
        if assigned_to_id:
            assigned_to_user = User.objects.get(id=assigned_to_id)

        data = serializer.validated_data
        if assigned_to_user:
            data["assigned_to"] = assigned_to_user

        incident = IncidentService.create_incident(
            user=user, organization=user.organization, data=data
        )
        return incident

    def create(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        incident = self.perform_create(serializer)
        output_serializer = IncidentDetailSerializer(incident)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

    @extend_schema(
        tags=["Incidents"],
        summary="Assign incident to a team member",
        description="Assigns or reassigns an incident to an organization user.",
        request=IncidentAssignSerializer,
        responses={200: IncidentDetailSerializer, 400: OpenApiResponse(description="Invalid user ID")},
    )
    @action(detail=True, methods=["post"], url_path="assign")
    def assign(self, request: Request, pk: str = None) -> Response:
        incident = self.get_object()
        serializer = self.get_serializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        assigned_to_id = serializer.validated_data.get("assigned_to_id")

        assigned_to_user = None
        if assigned_to_id:
            assigned_to_user = User.objects.get(id=assigned_to_id)

        updated_incident = IncidentService.assign_incident(
            incident=incident,
            assigned_to_user=assigned_to_user,
            performing_user=request.user,
        )
        return Response(
            IncidentDetailSerializer(updated_incident).data, status=status.HTTP_200_OK
        )

    @extend_schema(
        tags=["Incidents"],
        summary="Change incident status",
        description="Transitions an incident to a new status (e.g. OPEN -> INVESTIGATING -> RESOLVED -> CLOSED).",
        request=IncidentStatusSerializer,
        responses={200: IncidentDetailSerializer, 400: OpenApiResponse(description="Invalid status transition")},
    )
    @action(detail=True, methods=["post"], url_path="status")
    def change_status(self, request: Request, pk: str = None) -> Response:
        incident = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_status = serializer.validated_data["status"]

        updated_incident = IncidentService.change_status(
            incident=incident,
            new_status=new_status,
            performing_user=request.user,
        )
        return Response(
            IncidentDetailSerializer(updated_incident).data, status=status.HTTP_200_OK
        )

    @extend_schema(
        tags=["Comments"],
        summary="List or add incident comments",
        description="GET lists all comments for the incident. POST posts a new comment.",
        responses={
            200: CommentSerializer(many=True),
            201: CommentSerializer,
            400: OpenApiResponse(description="Invalid comment message"),
        },
    )
    @action(detail=True, methods=["get", "post"], url_path="comments")
    def comments(self, request: Request, pk: str = None) -> Response:
        incident = self.get_object()

        if request.method == "GET":
            comments_qs = incident.comments.select_related("author").all()
            serializer = CommentSerializer(comments_qs, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        # POST comment
        serializer = CommentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        message = serializer.validated_data["message"]

        comment = IncidentService.add_comment(
            incident=incident, author=request.user, message=message
        )
        return Response(CommentSerializer(comment).data, status=status.HTTP_201_CREATED)

    @extend_schema(
        tags=["Timeline"],
        summary="Retrieve incident event timeline",
        description="Returns full audit timeline history of events logged for this incident.",
        responses={200: IncidentEventSerializer(many=True)},
    )
    @action(detail=True, methods=["get"], url_path="timeline")
    def timeline(self, request: Request, pk: str = None) -> Response:
        incident = self.get_object()
        events = incident.events.select_related("user").all()
        serializer = IncidentEventSerializer(events, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
