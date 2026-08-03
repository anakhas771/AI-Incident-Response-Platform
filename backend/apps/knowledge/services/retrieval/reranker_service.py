"""
Reranker service providing similarity-based sorting, thresholding, and limit logic.
"""

from typing import List

from apps.knowledge.services.config import CopilotSettings
from apps.knowledge.services.dtos.retrieval_dto import RetrievedChunkDTO


class ReRankerService:
    """
    Reranks chunks. Future-ready for machine learning Cross-Encoders.
    """

    def rerank(
        self,
        chunks: List[RetrievedChunkDTO],
        threshold: float = CopilotSettings.MIN_SIMILARITY_THRESHOLD,
        top_k: int = CopilotSettings.RERANK_TOP_K,
    ) -> List[RetrievedChunkDTO]:
        """
        Filters by similarity threshold and limits to top_k results.
        """
        if not CopilotSettings.ENABLE_RERANKING:
            return chunks[:top_k]

        # Filter out chunks below similarity threshold
        filtered = [c for c in chunks if c.similarity_score >= threshold]

        # Sort descending by similarity score
        sorted_chunks = sorted(filtered, key=lambda x: x.similarity_score, reverse=True)

        return sorted_chunks[:top_k]
