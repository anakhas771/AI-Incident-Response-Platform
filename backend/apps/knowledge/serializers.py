"""
DRF serializers for Enterprise RAG Knowledge Base documents, chunks, search, and chat API endpoints.
"""

from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from apps.knowledge.models import (
    DocumentChunk,
    DocumentTag,
    DocumentType,
    KnowledgeDocument,
)

@extend_schema_field(OpenApiTypes.BINARY)
class BinaryFileField(serializers.FileField):
    """FileField annotated so drf-spectacular emits type: string, format: binary."""
    pass


class KnowledgeDocumentUploadSerializer(serializers.Serializer):

    title = serializers.CharField(
        max_length=255
    )



    description = serializers.CharField(
        required=False,
        allow_blank=True
    )

    file = BinaryFileField(
        required=True,
        write_only=True
    )

    file_type = serializers.ChoiceField(
        choices=DocumentType.choices
    )

    tags = serializers.ListField(
        child=serializers.CharField(max_length=50),
        required=False,
        default=list,
        help_text="Optional list of tag names to attach to the document.",
    )


    def validate_title(self, value: str) -> str:
        value = value.strip()
        placeholder_titles = {
            "string",
            "test",
            "example",
            "demo",
            "placeholder",
            "untitled",
            "document",
            "sample",
            "test document",
        }
        if value.lower() in placeholder_titles:
            raise serializers.ValidationError(
                f"Placeholder titles like '{value}' are not allowed. Please provide a meaningful document title."
            )

        if len(value) < 5:
            raise serializers.ValidationError(
                "Document title must be at least 5 characters long."
            )

        return value

    def validate_file_type(self, value):
        value = value.upper().strip()

        if value not in DocumentType.values:
            raise serializers.ValidationError(
                f"Unsupported file type '{value}'"
            )

        return value

    def create(self, validated_data):
        """
        Create and return a new KnowledgeDocument instance.

        The view calls serializer.save(organization=..., uploaded_by=..., status=...)
        which merges those keyword arguments into validated_data before calling
        this method, so all required model fields are present here.
        """
        return KnowledgeDocument.objects.create(**validated_data)

class KnowledgeDocumentListSerializer(serializers.ModelSerializer):
    """
    Serializer for listing organization knowledge documents.
    """

    uploaded_by_name = serializers.CharField(
        source="uploaded_by.full_name", read_only=True, default="Unknown"
    )
    tags = serializers.SerializerMethodField()

    def get_tags(self, obj) -> list:
        return list(obj.tags.values_list("name", flat=True))

    class Meta:
        model = KnowledgeDocument
        fields = [
            "id",
            "title",
            "description",
            "file",
            "file_type",
            "tags",
            "status",
            "processing_error",
            "page_count",
            "word_count",
            "chunk_count",
            "embedding_count",
            "uploaded_by_name",
            "created_at",
            "updated_at",
        ]


class KnowledgeDocumentDetailSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for a knowledge document including indexing stats.
    """

    uploaded_by_name = serializers.CharField(
        source="uploaded_by.full_name", read_only=True, default="Unknown"
    )
    tags = serializers.SerializerMethodField()

    def get_tags(self, obj) -> list:
        return list(obj.tags.values_list("name", flat=True))

    class Meta:
        model = KnowledgeDocument
        fields = [
            "id",
            "title",
            "description",
            "file",
            "file_type",
            "tags",
            "status",
            "processing_error",
            "page_count",
            "word_count",
            "chunk_count",
            "embedding_count",
            "uploaded_by_name",
            "created_at",
            "updated_at",
        ]


class DocumentChunkSerializer(serializers.ModelSerializer):
    """
    Serializer for document chunk metadata and content.
    """

    class Meta:
        model = DocumentChunk
        fields = [
            "id",
            "document",
            "chunk_index",
            "content",
            "token_count",
            "metadata",
            "created_at",
        ]


class KnowledgeSearchRequestSerializer(serializers.Serializer):
    """
    Request serializer for vector similarity search.
    """

    query = serializers.CharField(required=True, max_length=1000)
    top_k = serializers.IntegerField(
        required=False, default=5, min_value=1, max_value=50
    )
    document_id = serializers.UUIDField(required=False, allow_null=True)
    date_from = serializers.DateTimeField(required=False, allow_null=True)
    date_to = serializers.DateTimeField(required=False, allow_null=True)
    tags = serializers.ListField(
        child=serializers.CharField(max_length=50), required=False, default=list
    )
    min_similarity = serializers.FloatField(
        required=False, default=0.65, min_value=0.0, max_value=1.0
    )



class KnowledgeSearchResponseItemSerializer(serializers.Serializer):
    """
    Serializer for a single retrieved chunk in similarity search results.
    """

    chunk_id = serializers.CharField()
    document_id = serializers.CharField()
    document_title = serializers.CharField()
    chunk_index = serializers.IntegerField()
    content = serializers.CharField()
    similarity_score = serializers.FloatField()
    page_number = serializers.IntegerField(default=1)
    metadata = serializers.JSONField()


class KnowledgeSearchResponseSerializer(serializers.Serializer):
    """
    Response serializer for vector similarity search.
    """

    query = serializers.CharField()
    total_results = serializers.IntegerField()
    results = KnowledgeSearchResponseItemSerializer(many=True)


class KnowledgeChatRequestSerializer(serializers.Serializer):
    """
    Request serializer for enterprise RAG chat.
    """

    question = serializers.CharField(required=True, max_length=2000)
    document_id = serializers.UUIDField(required=False, allow_null=True)
    tags = serializers.ListField(
        child=serializers.CharField(max_length=50), required=False, default=list
    )


class CitationSerializer(serializers.Serializer):
    """
    Serializer for a single source citation reference.
    """

    document_id = serializers.CharField()
    document = serializers.CharField()
    page = serializers.IntegerField()
    chunk = serializers.IntegerField()
    similarity = serializers.FloatField()
    snippet = serializers.CharField()


class RelatedDocumentSerializer(serializers.Serializer):
    """
    Serializer for a related knowledge document reference.
    """

    id = serializers.CharField()
    title = serializers.CharField()
    highest_similarity = serializers.FloatField()


class KnowledgeChatResponseSerializer(serializers.Serializer):
    """
    Response serializer for enterprise RAG chat answer with citations and evidence.
    """

    answer = serializers.CharField()
    summary = serializers.CharField()
    key_points = serializers.ListField(
        child=serializers.CharField(), required=False, default=list
    )
    recommendations = serializers.ListField(
        child=serializers.CharField(), required=False, default=list
    )
    citations = CitationSerializer(many=True, required=False)
    supporting_evidence = serializers.ListField(child=serializers.CharField())
    source_citations = CitationSerializer(many=True)
    confidence_score = serializers.IntegerField(
        min_value=0,
        max_value=100,
        help_text="Confidence score as a percentage from 0 to 100.",
    )
    related_documents = RelatedDocumentSerializer(many=True)
    sources = CitationSerializer(many=True)
    similarity_scores = serializers.ListField(child=serializers.FloatField())



class DocumentStatusSerializer(serializers.ModelSerializer):
    """
    Serializer for polling document processing and vector indexing status.
    """

    class Meta:
        model = KnowledgeDocument
        fields = [
            "id",
            "status",
            "processing_error",
            "page_count",
            "word_count",
            "chunk_count",
            "embedding_count",
            "updated_at",
        ]
