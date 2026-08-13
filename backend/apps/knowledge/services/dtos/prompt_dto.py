"""
DTO representing synthesized LLM prompt contexts.
"""

from dataclasses import dataclass


@dataclass
class PromptContextDTO:
    """
    Represents the full prompt payload prepared for LLM generation.
    """

    system_prompt: str
    user_prompt: str
    context_text: str
    history_text: str
    estimated_tokens: int
    template_version: str
    raw_history: list = None
    raw_user_message: str = ""
