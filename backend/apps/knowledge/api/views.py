"""
REST API views for Enterprise RAG Knowledge Base upload, listing, detail,
deletion, semantic search, AI chat, and status polling.
"""

import logging
from typing import Any, cast

from django.db.models import QuerySet
from drf_spectacular.utils import extend_schema
from rest_framework import generics, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User
from apps.knowledge.models import DocumentStatus, DocumentTag, KnowledgeDocument
from apps.knowledge.permissions import IsKnowledgeOrganizationMember
from apps.knowledge.serializers import (
    DocumentChunkSerializer,
    DocumentStatusSerializer,
    KnowledgeChatRequestSerializer,
    KnowledgeChatResponseSerializer,
    KnowledgeDocumentDetailSerializer,
    KnowledgeDocumentListSerializer,
    KnowledgeDocumentUploadSerializer,
    KnowledgeSearchRequestSerializer,
    KnowledgeSearchResponseSerializer,
)
from apps.knowledge.services.file_hash_service import FileHashService
from apps.knowledge.services.knowledge_chat_service import KnowledgeChatService
from apps.knowledge.services.vector_search_service import VectorSearchService
from apps.knowledge.tasks import (
    process_document_task,
    reindex_document_task,
)

logger = logging.getLogger(__name__)


class KnowledgeDocumentUploadView(APIView):
    """
    Endpoint for uploading PDF, DOCX, TXT, or MD documents
    to the organization's RAG knowledge base.

    Duplicate detection: documents are hashed (SHA-256) on upload; re-uploading
    the same file within the same organization returns HTTP 400.
    """

    permission_classes = [
        IsAuthenticated,
        IsKnowledgeOrganizationMember,
    ]

    parser_classes = [
        MultiPartParser,
        FormParser,
    ]

    @extend_schema(
        request={
            "multipart/form-data": KnowledgeDocumentUploadSerializer,
        },
        responses={
            201: KnowledgeDocumentDetailSerializer,
        },
        summary="Upload RAG knowledge base document",
    )
    def post(
        self,
        request: Request,
        *args: Any,
        **kwargs: Any,
    ) -> Response:

        user = cast(User, request.user)
        serializer = KnowledgeDocumentUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # --- Duplicate detection via SHA-256 file hash (FileHashService) ---
        uploaded_file = serializer.validated_data["file"]
        file_hash, is_duplicate = FileHashService.check_and_hash(
            uploaded_file, user.organization
        )

        if is_duplicate:
            return Response(
                {
                    "error": "This document already exists in your organization's knowledge base."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Pop tags before save (not a model field on KnowledgeDocument)
        tags: list[str] = serializer.validated_data.pop("tags", [])

        doc = serializer.save(
            organization=user.organization,
            uploaded_by=user,
            status=DocumentStatus.UPLOADED,
            file_hash=file_hash,
        )

        # --- T4: Create DocumentTag instances ---
        if tags:
            DocumentTag.objects.bulk_create(
                [
                    DocumentTag(document=doc, name=tag.strip().lower())
                    for tag in tags
                    if tag.strip()
                ],
                ignore_conflicts=True,
            )

        try:
            process_document_task.delay(str(doc.id))

        except Exception as exc:
            logger.exception(
                "Failed to enqueue processing task for document %s: %s",
                doc.id,
                exc,
            )
            doc.status = DocumentStatus.FAILED
            doc.processing_error = (
                f"Failed to enqueue background processing task: {exc}"
            )
            doc.save(update_fields=["status", "processing_error", "updated_at"])

        response_serializer = KnowledgeDocumentDetailSerializer(doc)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class KnowledgeDocumentListView(generics.ListAPIView):
    """
    List all knowledge documents within the authenticated user's organization.
    """

    permission_classes = [IsAuthenticated, IsKnowledgeOrganizationMember]
    serializer_class = KnowledgeDocumentListSerializer

    def get_queryset(self) -> QuerySet[KnowledgeDocument]:
        if getattr(self, "swagger_fake_view", False):
            return KnowledgeDocument.objects.none()

        user = cast(User, self.request.user)
        qs = KnowledgeDocument.objects.filter(
            organization=user.organization
        ).prefetch_related("tags")
        status_param = self.request.query_params.get("status")
        file_type_param = self.request.query_params.get("file_type")
        search_param = self.request.query_params.get("search")

        if status_param:
            qs = qs.filter(status=status_param.upper())
        if file_type_param:
            qs = qs.filter(file_type=file_type_param.upper())
        if search_param:
            qs = qs.filter(title__icontains=search_param)

        return qs


class KnowledgeDocumentDetailView(generics.RetrieveDestroyAPIView):
    """
    Retrieve or delete a specific knowledge document in the organization.
    """

    permission_classes = [IsAuthenticated, IsKnowledgeOrganizationMember]
    serializer_class = KnowledgeDocumentDetailSerializer
    lookup_field = "pk"

    def get_queryset(self) -> QuerySet[KnowledgeDocument]:
        if getattr(self, "swagger_fake_view", False):
            return KnowledgeDocument.objects.none()
        user = cast(User, self.request.user)
        return KnowledgeDocument.objects.filter(
            organization=user.organization
        ).prefetch_related("tags")


class KnowledgeSearchView(APIView):
    """
    Perform Top-K semantic similarity search across the organization's knowledge base.
    """

    permission_classes = [IsAuthenticated, IsKnowledgeOrganizationMember]

    @extend_schema(
        request=KnowledgeSearchRequestSerializer,
        responses={200: KnowledgeSearchResponseSerializer},
        summary="Search organization RAG knowledge base",
    )
    def post(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        user = cast(User, request.user)
        serializer = KnowledgeSearchRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        query = serializer.validated_data["query"]
        top_k = serializer.validated_data.get("top_k", 5)
        document_id = serializer.validated_data.get("document_id")
        date_from = serializer.validated_data.get("date_from")
        date_to = serializer.validated_data.get("date_to")
        tags = serializer.validated_data.get("tags")
        min_similarity = serializer.validated_data.get("min_similarity", 0.65)

        search_service = VectorSearchService()
        results = search_service.search(
            query=query,
            organization=user.organization,
            top_k=top_k,
            document_id=str(document_id) if document_id else None,
            date_from=date_from,
            date_to=date_to,
            tags=tags,
            min_similarity=min_similarity,
        )

        response_data = {
            "query": query,
            "total_results": len(results),
            "results": results,
        }
        return Response(response_data, status=status.HTTP_200_OK)


class KnowledgeChatView(APIView):
    """
    Execute enterprise RAG AI chat answering user questions with citations and evidence.
    """

    permission_classes = [IsAuthenticated, IsKnowledgeOrganizationMember]

    @extend_schema(
        request=KnowledgeChatRequestSerializer,
        responses={200: KnowledgeChatResponseSerializer},
        summary="Chat with organization RAG knowledge base",
    )
    def post(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        user = cast(User, request.user)
        serializer = KnowledgeChatRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        question = serializer.validated_data["question"]
        document_id = serializer.validated_data.get("document_id")
        tags = serializer.validated_data.get("tags")

        filters = {}
        if document_id:
            filters["document_id"] = str(document_id)
        if tags:
            filters["tags"] = tags

        chat_service = KnowledgeChatService()
        result = chat_service.chat(
            question=question,
            organization=user.organization,
            filters=filters,
            user=user,
        )

        return Response(result, status=status.HTTP_200_OK)


class KnowledgeDocumentStatusView(generics.RetrieveAPIView):
    """
    Retrieve document processing status, chunk count, and embedding count.
    """

    permission_classes = [IsAuthenticated, IsKnowledgeOrganizationMember]
    serializer_class = DocumentStatusSerializer
    lookup_field = "pk"

    def get_queryset(self) -> QuerySet[KnowledgeDocument]:
        if getattr(self, "swagger_fake_view", False):
            return KnowledgeDocument.objects.none()
        user = cast(User, self.request.user)
        return KnowledgeDocument.objects.filter(organization=user.organization)


class KnowledgeDocumentChunksView(generics.ListAPIView):
    """
    Retrieve document chunks for a given document with organization isolation.
    """

    permission_classes = [IsAuthenticated, IsKnowledgeOrganizationMember]
    serializer_class = DocumentChunkSerializer
    pagination_class = None

    def get_queryset(self) -> QuerySet:
        if getattr(self, "swagger_fake_view", False):
            return KnowledgeDocument.objects.none()

        user = cast(User, self.request.user)
        document_id = self.kwargs.get("pk")

        # Verify organization ownership of the document
        try:
            doc = KnowledgeDocument.objects.get(
                id=document_id, organization=user.organization
            )
        except KnowledgeDocument.DoesNotExist:
            return KnowledgeDocument.objects.none()

        return doc.chunks.all().order_by("chunk_index")


class KnowledgeDocumentRetryView(APIView):
    """
    Trigger retry of processing for a failed document.
    """

    permission_classes = [IsAuthenticated, IsKnowledgeOrganizationMember]

    def post(self, request: Request, pk: str, *args: Any, **kwargs: Any) -> Response:
        user = cast(User, request.user)
        try:
            doc = KnowledgeDocument.objects.get(id=pk, organization=user.organization)
        except KnowledgeDocument.DoesNotExist:
            return Response(
                {"error": "Document not found."}, status=status.HTTP_404_NOT_FOUND
            )

        if doc.status != DocumentStatus.FAILED:
            return Response(
                {"error": "Only failed documents can be retried."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        doc.status = DocumentStatus.PROCESSING
        doc.processing_error = ""
        doc.save(update_fields=["status", "processing_error", "updated_at"])

        process_document_task.delay(str(doc.id))

        return Response({"status": "Retry task queued."}, status=status.HTTP_200_OK)


class KnowledgeDocumentReindexView(APIView):
    """
    Trigger full re-indexing of a document.
    """

    permission_classes = [IsAuthenticated, IsKnowledgeOrganizationMember]

    def post(self, request: Request, pk: str, *args: Any, **kwargs: Any) -> Response:
        user = cast(User, request.user)
        try:
            doc = KnowledgeDocument.objects.get(id=pk, organization=user.organization)
        except KnowledgeDocument.DoesNotExist:
            return Response(
                {"error": "Document not found."}, status=status.HTTP_404_NOT_FOUND
            )

        doc.status = DocumentStatus.PROCESSING
        doc.processing_error = ""
        doc.save(update_fields=["status", "processing_error", "updated_at"])

        reindex_document_task.delay(str(doc.id))

        return Response({"status": "Re-index task queued."}, status=status.HTTP_200_OK)
