"""
Deterministic confidence engine calculating average similarity scores.
"""

from typing import List

from apps.knowledge.services.dtos import ConfidenceDTO, RetrievedChunkDTO


class ConfidenceEngine:
    """
    Calculates RAG response confidence levels based on retrieval scores.
    """

    def calculate_confidence(self, chunks: List[RetrievedChunkDTO]) -> ConfidenceDTO:
        """
        Produce a ConfidenceDTO based on chunk similarities.
        """
        if not chunks:
            return ConfidenceDTO(
                score=0,
                level="low",
                reasoning="No context chunks retrieved.",
            )

        avg_similarity = sum(c.similarity_score for c in chunks) / len(chunks)
        score = int(round(avg_similarity * 100))

        if score >= 85:
            level = "high"
            reasoning = f"Strong context support with average similarity of {score}%."
        elif score >= 70:
            level = "medium"
            reasoning = f"Moderate context support with average similarity of {score}%."
        else:
            level = "low"
            reasoning = f"Weak context support with average similarity of {score}%."

        return ConfidenceDTO(score=score, level=level, reasoning=reasoning)
