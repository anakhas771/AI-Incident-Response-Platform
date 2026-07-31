"""
Deterministic mock embedding provider for tests and local development.

Generates 1536-dimensional L2-normalized vectors by hashing each word in the
input text.  The same text always produces the same vector, making tests
reproducible without any external API calls.
"""

import hashlib
import math
from typing import List

from apps.knowledge.services.embeddings.base import EmbeddingProvider


class MockEmbeddingProvider(EmbeddingProvider):
    """
    Deterministic mock provider generating 1536-dim L2-normalized vectors.

    Similar vocabulary yields high cosine similarity, which is enough for
    all integration tests and local development without a real embedding API.
    """

    DIMENSIONS = 1536

    @property
    def model_name(self) -> str:
        return "mock-embed-v1"

    def _word_vector(self, word: str) -> List[float]:
        digest = hashlib.sha256(word.encode("utf-8")).digest()
        vec = [0.0] * self.DIMENSIONS
        for idx_byte in digest[:20]:
            idx = (idx_byte * 13) % self.DIMENSIONS
            vec[idx] = 2.0
        return vec

    def embed_text(self, text: str) -> List[float]:
        words = [w.lower().strip(".,!?;:()[]\"'#-") for w in text.split()]
        words = [w for w in words if len(w) > 1]
        if not words:
            words = ["default", "empty", "text"]

        sum_vec = [0.6] * self.DIMENSIONS
        for w in set(words):
            w_vec = self._word_vector(w)
            for i in range(self.DIMENSIONS):
                sum_vec[i] += w_vec[i]

        norm = math.sqrt(sum(v * v for v in sum_vec))
        if norm == 0:
            return [0.0] * self.DIMENSIONS
        return [round(v / norm, 6) for v in sum_vec]

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        return [self.embed_text(t) for t in texts]
