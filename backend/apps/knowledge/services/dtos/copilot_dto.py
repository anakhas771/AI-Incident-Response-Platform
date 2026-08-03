"""
DTO representing complete Copilot responses.
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from apps.knowledge.services.dtos.citation_dto import CitationDTO
from apps.knowledge.services.dtos.confidence_dto import ConfidenceDTO
from apps.knowledge.services.dtos.usage_dto import UsageDTO


@dataclass
class CopilotResponseDTO:
    """
    Represents the full response structured for Copilot orchestration.
    """

    session_id: str
    message_id: str
    content: str
    role: str
    tokens: int
    prompt_tokens: int
    completion_tokens: int
    citations: List[CitationDTO] = field(default_factory=list)
    confidence: ConfidenceDTO = field(
        default_factory=lambda: ConfidenceDTO(score=0, level="low", reasoning="")
    )
    metadata: Dict[str, Any] = field(default_factory=dict)
    suggested_questions: List[str] = field(default_factory=list)
    usage: Optional[UsageDTO] = None
