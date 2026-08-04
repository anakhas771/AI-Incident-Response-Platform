"""
EmbeddingService: orchestrates embedding generation and persistent storage.

Provider selection is driven by the EMBEDDING_PROVIDER environment variable
(default: 'mock').  See apps/knowledge/services/embeddings/factory.py.
"""

import logging
from typing import List, Optional

from apps.knowledge.models import DocumentChunk, DocumentEmbedding
from apps.knowledge.services.embeddings import (
    EmbeddingProvider,
    MockEmbeddingProvider,
    OpenAIEmbeddingProvider,
    get_embedding_provider,
)

logger = logging.getLogger(__name__)

# Re-export for backwards compatibility with existing imports.
__all__ = [
    "EmbeddingProvider",
    "MockEmbeddingProvider",
    "OpenAIEmbeddingProvider",
    "EmbeddingService",
]


class EmbeddingService:
    """
    Service encapsulating embedding generation and persistent DocumentEmbedding creation.

    Inject a custom provider in tests:
        service = EmbeddingService(provider=MockEmbeddingProvider())
    """

    def __init__(self, provider: Optional[EmbeddingProvider] = None) -> None:
        self.provider: EmbeddingProvider = provider or get_embedding_provider()

    def generate_embedding(self, text: str) -> List[float]:
        """Generate a single embedding vector for input text."""
        return self.provider.embed_text(text)

    def generate_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate a batch of embedding vectors."""
        return self.provider.embed_batch(texts)

    def embed_chunk(self, chunk: DocumentChunk) -> DocumentEmbedding:
        """Generate and persist a DocumentEmbedding for a single DocumentChunk."""
        vector = self.generate_embedding(chunk.content)
        embedding_obj, _ = DocumentEmbedding.objects.update_or_create(
            chunk=chunk,
            defaults={
                "embedding": vector,
                "embedding_model": self.provider.model_name,
                "vector_dimension": len(vector),
            },
        )
        return embedding_obj

    def embed_document_chunks(
        self, chunks: List[DocumentChunk]
    ) -> List[DocumentEmbedding]:
        """Generate and persist embeddings for a list of DocumentChunks in batch."""
        if not chunks:
            return []

        texts = [c.content for c in chunks]
        vectors = self.generate_embeddings_batch(texts)

        created: List[DocumentEmbedding] = []
        for chunk, vector in zip(chunks, vectors, strict=False):
            embedding_obj, _ = DocumentEmbedding.objects.update_or_create(
                chunk=chunk,
                defaults={
                    "embedding": vector,
                    "embedding_model": self.provider.model_name,
                    "vector_dimension": len(vector),
                },
            )
            created.append(embedding_obj)

        logger.info(
            "Embedded %d chunks using provider=%s",
            len(created),
            self.provider.model_name,
        )
        return created
