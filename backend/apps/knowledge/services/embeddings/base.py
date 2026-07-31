"""
Abstract base class for all embedding providers.
"""

from abc import ABC, abstractmethod
from typing import List


class EmbeddingProvider(ABC):
    """
    Abstract interface that every embedding backend must implement.

    Implementations:
        - MockEmbeddingProvider  (deterministic, no external dependencies)
        - OpenAIEmbeddingProvider (text-embedding-3-small via OpenAI API)
    """

    @abstractmethod
    def embed_text(self, text: str) -> List[float]:
        """Generate a single embedding vector for the given text."""
        raise NotImplementedError

    @abstractmethod
    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate embedding vectors for a batch of texts."""
        raise NotImplementedError

    @property
    @abstractmethod
    def model_name(self) -> str:
        """Human-readable model identifier stored in DocumentEmbedding.embedding_model."""
        raise NotImplementedError
