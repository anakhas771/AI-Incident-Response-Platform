"""
DTOs representing conversation context and message history.
"""

from dataclasses import dataclass, field
from typing import List


@dataclass
class MessageTurnDTO:
    """
    Represents a single message turn in the conversation memory.
    """

    role: str
    content: str
    tokens: int = 0


@dataclass
class ConversationContextDTO:
    """
    Represents the loaded and truncated conversation history context.
    """

    session_id: str
    messages: List[MessageTurnDTO] = field(default_factory=list)
    total_tokens: int = 0
    is_truncated: bool = False
