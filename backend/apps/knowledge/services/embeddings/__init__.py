"""
Embedding provider subpackage.

Exports the abstract base, concrete providers, and the factory function
so callers import from a single location.
"""

from apps.knowledge.services.embeddings.base import EmbeddingProvider
from apps.knowledge.services.embeddings.factory import get_embedding_provider
from apps.knowledge.services.embeddings.mock_provider import MockEmbeddingProvider
from apps.knowledge.services.embeddings.openai_provider import OpenAIEmbeddingProvider

__all__ = [
    "EmbeddingProvider",
    "MockEmbeddingProvider",
    "OpenAIEmbeddingProvider",
    "get_embedding_provider",
]
