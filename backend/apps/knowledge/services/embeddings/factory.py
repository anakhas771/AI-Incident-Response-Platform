"""
Factory function that selects the embedding provider based on the
EMBEDDING_PROVIDER environment variable.

Supported values (case-insensitive):
    mock    → MockEmbeddingProvider  (default, no external dependencies)
    openai  → OpenAIEmbeddingProvider (requires OPENAI_API_KEY)
"""

import logging
import os
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from apps.knowledge.services.embeddings.base import EmbeddingProvider

logger = logging.getLogger(__name__)


def get_embedding_provider() -> "EmbeddingProvider":
    """
    Instantiate and return the configured embedding provider.

    Reads EMBEDDING_PROVIDER from the environment (default: 'mock').
    Falls back to MockEmbeddingProvider for unknown values.
    """
    provider_name = os.environ.get("EMBEDDING_PROVIDER", "mock").lower().strip()

    if provider_name == "openai":
        from apps.knowledge.services.embeddings.openai_provider import (
            OpenAIEmbeddingProvider,
        )

        logger.info("EmbeddingProvider: using OpenAIEmbeddingProvider")
        return OpenAIEmbeddingProvider()

    if provider_name != "mock":
        logger.warning(
            "Unknown EMBEDDING_PROVIDER=%r — falling back to mock provider.",
            provider_name,
        )

    from apps.knowledge.services.embeddings.mock_provider import MockEmbeddingProvider

    logger.info("EmbeddingProvider: using MockEmbeddingProvider")
    return MockEmbeddingProvider()
