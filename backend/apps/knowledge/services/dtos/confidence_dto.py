"""
DTO representing confidence scores and evaluations.
"""

from dataclasses import dataclass


@dataclass
class ConfidenceDTO:
    """
    Represents calculated confidence levels for search and RAG tasks.
    """

    score: int
    level: str
    reasoning: str
