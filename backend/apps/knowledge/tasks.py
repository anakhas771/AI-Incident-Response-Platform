"""
Celery background tasks for asynchronous document parsing, chunking,
embedding generation, re-indexing, deletion, and retry workflows.

Every pipeline stage is recorded to DocumentProcessingLog for audit trail.
"""

import logging
from typing import Any, Dict, cast

from celery import shared_task
from django.db import transaction

from apps.knowledge.models import (
    DocumentChunk,
    DocumentProcessingLog,
    DocumentStatus,
    KnowledgeDocument,
    ProcessingStage,
)
from apps.knowledge.services.document_chunking_service import DocumentChunkingService
from apps.knowledge.services.document_parser_service import DocumentParserService
from apps.knowledge.services.embedding_service import EmbeddingService

logger = logging.getLogger(__name__)


def _log(document: KnowledgeDocument, stage: str, message: str) -> None:
    """Create an immutable DocumentProcessingLog entry (best-effort, never raises)."""
    try:
        DocumentProcessingLog.objects.create(
            document=document,
            stage=stage,
            message=message,
        )
    except Exception as exc:  # pragma: no cover
        logger.warning(
            "Failed to write processing log for %s [%s]: %s", document.id, stage, exc
        )


@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_kwargs={"max_retries": 3, "countdown": 5},
)
def process_document_task(self, document_id: str) -> Dict[str, Any]:
    """
    Asynchronous Celery task that parses an uploaded document, generates overlapping chunks,
    creates vector embeddings, and transitions status to INDEXED.
    """
    try:
        document = KnowledgeDocument.objects.get(id=document_id)
    except KnowledgeDocument.DoesNotExist:
        logger.error("KnowledgeDocument %s not found for processing", document_id)
        return {"status": "error", "message": "Document not found"}

    try:
        document.status = DocumentStatus.PROCESSING
        document.processing_error = ""
        document.save(update_fields=["status", "processing_error", "updated_at"])
        _log(
            document,
            ProcessingStage.UPLOAD,
            "Document received and processing started.",
        )

        # 1. Parse document text & structure
        _log(document, ProcessingStage.PARSING, "Parsing document text and structure.")
        parse_result = DocumentParserService.parse(
            file_obj=document.file,
            file_type=document.file_type,
        )

        document.page_count = parse_result.get("page_count", 1)
        document.word_count = parse_result.get("word_count", 0)
        document.save(update_fields=["page_count", "word_count", "updated_at"])
        _log(
            document,
            ProcessingStage.PARSING,
            f"Parsing complete: {document.page_count} page(s), {document.word_count} words.",
        )

        # 2. Chunk document
        _log(
            document,
            ProcessingStage.CHUNKING,
            "Splitting document into overlapping chunks.",
        )
        chunks_data = DocumentChunkingService.chunk_document(document, parse_result)

        # 3. Replace existing chunks and persist new chunks
        with transaction.atomic():
            DocumentChunk.objects.filter(document=document).delete()

            chunk_objs = []
            for item in chunks_data:
                chunk_objs.append(
                    DocumentChunk(
                        document=document,
                        chunk_index=item["chunk_index"],
                        content=item["content"],
                        token_count=item["token_count"],
                        metadata=item["metadata"],
                    )
                )
            created_chunks = DocumentChunk.objects.bulk_create(chunk_objs)

        _log(
            document,
            ProcessingStage.CHUNKING,
            f"Chunking complete: {len(created_chunks)} chunk(s) created.",
        )

        # 4. Generate embeddings
        _log(
            document,
            ProcessingStage.EMBEDDING,
            "Generating vector embeddings for all chunks.",
        )
        embedding_service = EmbeddingService()
        created_embeddings = embedding_service.embed_document_chunks(created_chunks)
        _log(
            document,
            ProcessingStage.EMBEDDING,
            f"Embedding complete: {len(created_embeddings)} embedding(s) generated "
            f"using {embedding_service.provider.model_name}.",
        )

        # 5. Update final indexed state
        document.chunk_count = len(created_chunks)
        document.embedding_count = len(created_embeddings)
        document.status = DocumentStatus.INDEXED
        document.save(
            update_fields=[
                "chunk_count",
                "embedding_count",
                "status",
                "updated_at",
            ]
        )
        _log(
            document,
            ProcessingStage.INDEXING,
            f"Indexing complete: {document.chunk_count} chunks, "
            f"{document.embedding_count} embeddings. Status → INDEXED.",
        )

        logger.info(
            "Successfully indexed document %s ('%s'): %s chunks, %s embeddings",
            document.id,
            document.title,
            document.chunk_count,
            document.embedding_count,
        )
        return {
            "status": "success",
            "document_id": str(document.id),
            "chunks": document.chunk_count,
            "embeddings": document.embedding_count,
        }

    except Exception as exc:
        logger.exception("Error processing document %s: %s", document_id, exc)
        document.status = DocumentStatus.FAILED
        document.processing_error = str(exc)
        document.save(update_fields=["status", "processing_error", "updated_at"])
        _log(document, ProcessingStage.FAILED, f"Processing failed: {exc}")
        raise exc


@shared_task(bind=True)
def reindex_document_task(self, document_id: str) -> Dict[str, Any]:
    """
    Clear existing chunks and embeddings for a document and re-run indexing.
    """
    try:
        document = KnowledgeDocument.objects.get(id=document_id)
    except KnowledgeDocument.DoesNotExist:
        logger.error("KnowledgeDocument %s not found for re-indexing", document_id)
        return {"status": "error", "message": "Document not found"}

    DocumentChunk.objects.filter(document=document).delete()
    return cast(Dict[str, Any], process_document_task(str(document.id)))


@shared_task(bind=True)
def delete_document_embeddings_task(self, document_id: str) -> Dict[str, Any]:
    """
    Asynchronously delete all chunks and embeddings for a document.
    """
    deleted_count, _ = DocumentChunk.objects.filter(document_id=document_id).delete()
    logger.info(
        "Deleted %s chunks/embeddings for document %s", deleted_count, document_id
    )
    return {"status": "success", "deleted_chunks": deleted_count}


@shared_task(bind=True)
def retry_failed_documents_task(self) -> Dict[str, Any]:
    """
    Scan for failed documents and enqueue processing tasks for retry.
    """
    failed_docs = KnowledgeDocument.objects.filter(status=DocumentStatus.FAILED)
    count = 0
    for doc in failed_docs:
        process_document_task.delay(str(doc.id))
        count += 1

    logger.info("Enqueued %s failed documents for retry", count)
    return {"status": "success", "retried_count": count}
