"""
DTO representing structured LLM gateway responses.
"""

from dataclasses import dataclass, field
from typing import Any, Dict


@dataclass
class LLMResponseDTO:
    """
    Structured payload returned by all LLM gateways.
    """

    content: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    latency_ms: float
    finish_reason: str
    model: str
    estimated_cost_usd: float = 0.0
    metadata: Dict[str, Any] = field(default_factory=dict)
