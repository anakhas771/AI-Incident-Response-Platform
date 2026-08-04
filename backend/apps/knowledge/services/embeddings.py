"""
Embedding computation services, providers, and architectural exports.
Re-exports EmbeddingService, providers, and factory without modifying existing code.
"""

from apps.knowledge.services.embedding_service import (
    EmbeddingProvider,
    EmbeddingService,
    MockEmbeddingProvider,
    OpenAIEmbeddingProvider,
)
from apps.knowledge.services.embeddings.factory import get_embedding_provider

__all__ = [
    "EmbeddingProvider",
    "EmbeddingService",
    "MockEmbeddingProvider",
    "OpenAIEmbeddingProvider",
    "get_embedding_provider",
]
