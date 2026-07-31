"""
OpenAI embedding provider using text-embedding-3-small.

Falls back to zero vectors when no API key is configured so the rest of
the pipeline (chunking, storage) is never blocked by a missing credential
in development environments.
"""

import logging
import os
from typing import List

from apps.knowledge.services.embeddings.base import EmbeddingProvider

logger = logging.getLogger(__name__)


class OpenAIEmbeddingProvider(EmbeddingProvider):
    """
    Production embedding provider backed by OpenAI text-embedding-3-small.

    Requirements:
        pip install openai>=1.0.0
        OPENAI_API_KEY environment variable set.

    The model produces 1536-dimensional vectors, matching the existing
    DocumentEmbedding schema.
    """

    DIMENSIONS = 1536
    DEFAULT_MODEL = "text-embedding-3-small"

    def __init__(self, api_key: str | None = None, model: str | None = None) -> None:
        self._api_key = api_key or os.environ.get("OPENAI_API_KEY", "")
        self._model = model or os.environ.get(
            "OPENAI_EMBEDDING_MODEL", self.DEFAULT_MODEL
        )
        self._client = None

        if not self._api_key:
            logger.warning(
                "OpenAIEmbeddingProvider: OPENAI_API_KEY is not set. "
                "Embedding calls will return zero vectors."
            )

    @property
    def model_name(self) -> str:
        return self._model

    def _get_client(self):
        """Lazy-initialise the OpenAI client to avoid import cost at startup."""
        if self._client is None:
            try:
                from openai import OpenAI  # noqa: PLC0415

                self._client = OpenAI(api_key=self._api_key)
            except ImportError:
                logger.error(
                    "openai package not installed. " "Run: pip install openai>=1.0.0"
                )
        return self._client

    def _zero_vector(self) -> List[float]:
        return [0.0] * self.DIMENSIONS

    def embed_text(self, text: str) -> List[float]:
        if not self._api_key:
            return self._zero_vector()

        client = self._get_client()
        if client is None:
            return self._zero_vector()

        try:
            response = client.embeddings.create(
                input=[text.replace("\n", " ")],
                model=self._model,
            )
            return response.data[0].embedding
        except Exception as exc:
            logger.exception("OpenAI embedding failed for text snippet: %s", exc)
            return self._zero_vector()

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        if not self._api_key or not texts:
            return [self._zero_vector() for _ in texts]

        client = self._get_client()
        if client is None:
            return [self._zero_vector() for _ in texts]

        try:
            cleaned = [t.replace("\n", " ") for t in texts]
            response = client.embeddings.create(input=cleaned, model=self._model)
            return [item.embedding for item in response.data]
        except Exception as exc:
            logger.exception("OpenAI batch embedding failed: %s", exc)
            return [self._zero_vector() for _ in texts]
