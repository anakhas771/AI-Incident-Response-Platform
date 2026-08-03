"""
DTO representing token usage and estimated cost accounting for Enterprise AI Copilot operations.
"""

from dataclasses import dataclass


@dataclass
class UsageDTO:
    """
    Enterprise token usage and cost accounting DTO.
    """

    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    embedding_tokens: int = 0
    retrieval_tokens: int = 0
    cached_tokens: int = 0
    estimated_cost: float = 0.0
    provider: str = "mock"
    model: str = "mock-gpt-model"
    latency_ms: float = 0.0
