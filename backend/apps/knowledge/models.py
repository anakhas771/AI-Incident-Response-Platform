"""
Database models for Enterprise RAG Knowledge Base, document chunks, and vector embeddings.
"""

from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from apps.accounts.models import Organization, User
from apps.common.models import TimeStampedUUIDModel

try:
    from pgvector.django import VectorField as PgVectorField  # type: ignore[import]

    class VectorField(PgVectorField):
        pass

except ImportError:

    class VectorField(models.JSONField):  # type: ignore[no-redef]
        """
        Fallback vector storage using JSONField when pgvector extension is not loaded (e.g. SQLite tests).
        """

        def __init__(self, *args, dimensions: int = 1536, **kwargs):
            self.dimensions = dimensions
            super().__init__(*args, **kwargs)


class DocumentType(models.TextChoices):
    PDF = "PDF", _("PDF")
    DOCX = "DOCX", _("DOCX")
    TXT = "TXT", _("TXT")
    MD = "MD", _("Markdown")


class DocumentStatus(models.TextChoices):
    UPLOADED = "UPLOADED", _("Uploaded")
    PROCESSING = "PROCESSING", _("Processing")
    INDEXED = "INDEXED", _("Indexed")
    FAILED = "FAILED", _("Failed")


class ProcessingStage(models.TextChoices):
    UPLOAD = "UPLOAD", _("Upload")
    PARSING = "PARSING", _("Parsing")
    CHUNKING = "CHUNKING", _("Chunking")
    EMBEDDING = "EMBEDDING", _("Embedding")
    INDEXING = "INDEXING", _("Indexing")
    FAILED = "FAILED", _("Failed")


class KnowledgeDocument(TimeStampedUUIDModel):
    """
    Enterprise knowledge base document uploaded by an organization user for RAG indexing.
    """

    organization: models.ForeignKey = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="knowledge_documents",
        db_index=True,
    )
    uploaded_by: models.ForeignKey = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="uploaded_documents",
    )
    title: models.CharField = models.CharField(max_length=255)
    description: models.TextField = models.TextField(blank=True, default="")
    file: models.FileField = models.FileField(upload_to="knowledge_docs/%Y/%m/")
    file_type: models.CharField = models.CharField(
        max_length=20,
        choices=DocumentType.choices,
        db_index=True,
    )
    file_hash: models.CharField = models.CharField(
        max_length=64,
        blank=True,
        db_index=True,
        help_text=_("SHA-256 hash of the uploaded file for duplicate detection."),
    )
    status: models.CharField = models.CharField(
        max_length=20,
        choices=DocumentStatus.choices,
        default=DocumentStatus.UPLOADED,
        db_index=True,
    )
    processing_error: models.TextField = models.TextField(blank=True, default="")
    page_count: models.IntegerField = models.IntegerField(default=0)
    word_count: models.IntegerField = models.IntegerField(default=0)
    chunk_count: models.IntegerField = models.IntegerField(default=0)
    embedding_count: models.IntegerField = models.IntegerField(default=0)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = _("Knowledge Document")
        verbose_name_plural = _("Knowledge Documents")
        constraints = [
            models.UniqueConstraint(
                fields=["organization", "file_hash"],
                name="unique_document_hash_per_org",
                condition=models.Q(file_hash__gt=""),
            )
        ]

    def __str__(self) -> str:
        return f"{self.title} [{self.organization.name}] ({self.status})"


class DocumentTag(TimeStampedUUIDModel):
    """
    Flexible tag attached to a KnowledgeDocument for categorisation and filtered search.
    """

    document: models.ForeignKey = models.ForeignKey(
        KnowledgeDocument,
        on_delete=models.CASCADE,
        related_name="tags",
        db_index=True,
    )
    name: models.CharField = models.CharField(max_length=50, db_index=True)

    class Meta:
        ordering = ["name"]
        verbose_name = _("Document Tag")
        verbose_name_plural = _("Document Tags")
        unique_together = [("document", "name")]

    def __str__(self) -> str:
        return f"{self.name} → {self.document.title}"


class DocumentChunk(TimeStampedUUIDModel):
    """
    Structured text segment extracted from a KnowledgeDocument for semantic search and AI context.
    """

    document: models.ForeignKey = models.ForeignKey(
        KnowledgeDocument,
        on_delete=models.CASCADE,
        related_name="chunks",
        db_index=True,
    )
    chunk_index: models.IntegerField = models.IntegerField(db_index=True)
    content: models.TextField = models.TextField()
    token_count: models.IntegerField = models.IntegerField(default=0)
    metadata: models.JSONField = models.JSONField(
        default=dict,
        help_text=_(
            "Metadata including chunk index, document ID, page number, headings, tags."
        ),
    )

    class Meta:
        ordering = ["document", "chunk_index"]
        verbose_name = _("Document Chunk")
        verbose_name_plural = _("Document Chunks")
        unique_together = [("document", "chunk_index")]

    def __str__(self) -> str:
        return f"Chunk #{self.chunk_index} - {self.document.title}"


class DocumentEmbedding(TimeStampedUUIDModel):
    """
    Vector embedding generated for a DocumentChunk to support Top K cosine similarity search.
    """

    chunk: models.OneToOneField = models.OneToOneField(
        DocumentChunk,
        on_delete=models.CASCADE,
        related_name="embedding",
        db_index=True,
    )
    embedding: VectorField = VectorField(dimensions=1536, default=list)
    embedding_model: models.CharField = models.CharField(
        max_length=100,
        default="mock-embed-v1",
    )
    vector_dimension: models.IntegerField = models.IntegerField(default=1536)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = _("Document Embedding")
        verbose_name_plural = _("Document Embeddings")

    def __str__(self) -> str:
        return f"Embedding for {self.chunk}"


class DocumentProcessingLog(TimeStampedUUIDModel):
    """
    Immutable audit log entry recording each stage of document processing.
    """

    document: models.ForeignKey = models.ForeignKey(
        KnowledgeDocument,
        on_delete=models.CASCADE,
        related_name="processing_logs",
        db_index=True,
    )
    stage: models.CharField = models.CharField(
        max_length=20,
        choices=ProcessingStage.choices,
        db_index=True,
    )
    message: models.TextField = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["created_at"]
        verbose_name = _("Document Processing Log")
        verbose_name_plural = _("Document Processing Logs")

    def __str__(self) -> str:
        return f"[{self.stage}] {self.document.title} @ {self.created_at}"


class RAGQueryLog(TimeStampedUUIDModel):
    """
    Evaluation and audit log entry recording each RAG chat question, retrieved documents,
    similarity scores, generated answer, and confidence score.
    """

    organization: models.ForeignKey = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="rag_query_logs",
        db_index=True,
    )
    user: models.ForeignKey = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="rag_query_logs",
        db_index=True,
    )
    question: models.TextField = models.TextField()
    retrieved_documents: models.JSONField = models.JSONField(default=list)
    similarity_scores: models.JSONField = models.JSONField(default=list)
    answer: models.TextField = models.TextField()
    confidence_score: models.IntegerField = models.IntegerField(default=0)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = _("RAG Query Log")
        verbose_name_plural = _("RAG Query Logs")

    def __str__(self) -> str:
        return f"RAGQueryLog [{self.organization}] @ {self.created_at}"


class MessageRole(models.TextChoices):
    USER = "user", _("User")
    ASSISTANT = "assistant", _("Assistant")
    SYSTEM = "system", _("System")
    TOOL = "tool", _("Tool")


class ConfidenceLevel(models.TextChoices):
    HIGH = "high", _("High")
    MEDIUM = "medium", _("Medium")
    LOW = "low", _("Low")


class ChatSession(TimeStampedUUIDModel):
    """
    Enterprise AI Copilot conversation session scoped to an organization and user.
    """

    organization: models.ForeignKey = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="copilot_sessions",
        db_index=True,
    )
    user: models.ForeignKey = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="copilot_sessions",
        db_index=True,
    )
    title: models.CharField = models.CharField(max_length=255, default="New Chat")
    is_pinned: models.BooleanField = models.BooleanField(default=False)
    is_archived: models.BooleanField = models.BooleanField(
        default=False,
        db_index=True,
    )
    last_message_preview: models.CharField = models.CharField(
        max_length=255,
        blank=True,
        default="",
    )
    last_message_at: models.DateTimeField = models.DateTimeField(
        default=timezone.now,
        db_index=True,
    )
    token_count: models.IntegerField = models.IntegerField(
        default=0,
        help_text=_("Total tokens consumed in this session."),
    )

    class Meta:
        ordering = ["-last_message_at", "-updated_at"]
        verbose_name = _("Chat Session")
        verbose_name_plural = _("Chat Sessions")
        indexes = [
            models.Index(
                fields=["organization", "user", "is_archived", "-last_message_at"],
                name="copilot_sess_org_user_idx",
            )
        ]

    def __str__(self) -> str:
        return f"{self.title} ({self.user.email})"


class ChatMessage(TimeStampedUUIDModel):
    """
    Individual chat turn within an Enterprise AI Copilot session.
    """

    session: models.ForeignKey = models.ForeignKey(
        ChatSession,
        on_delete=models.CASCADE,
        related_name="messages",
        db_index=True,
    )
    role: models.CharField = models.CharField(
        max_length=20,
        choices=MessageRole.choices,
        db_index=True,
    )
    content: models.TextField = models.TextField()
    tokens: models.IntegerField = models.IntegerField(
        default=0,
        help_text=_("Total tokens for this message."),
    )
    prompt_tokens: models.IntegerField = models.IntegerField(
        default=0,
        help_text=_("Prompt tokens used."),
    )
    completion_tokens: models.IntegerField = models.IntegerField(
        default=0,
        help_text=_("Completion tokens used."),
    )
    metadata: models.JSONField = models.JSONField(
        default=dict,
        blank=True,
        help_text=_("Extensible metadata dictionary."),
    )

    class Meta:
        ordering = ["created_at"]
        verbose_name = _("Chat Message")
        verbose_name_plural = _("Chat Messages")
        indexes = [
            models.Index(
                fields=["session", "created_at"],
                name="copilot_msg_sess_time_idx",
            )
        ]

    def __str__(self) -> str:
        return f"[{self.role}] {self.content[:30]}"
