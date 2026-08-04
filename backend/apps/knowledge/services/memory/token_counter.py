"""
Token counting service using tiktoken with a graceful fallback estimator.
"""

import logging
from typing import Optional

import tiktoken

from apps.knowledge.services.config import CopilotSettings

logger = logging.getLogger(__name__)


class TokenCounterService:
    """
    Calculates token counts for text strings using OpenAI tiktoken, with a character-ratio fallback.
    """

    def __init__(
        self, default_model: str = CopilotSettings.TOKEN_COUNTER_MODEL
    ) -> None:
        self.default_model = default_model

    def count_tokens(self, text: str, model: Optional[str] = None) -> int:
        """
        Count the number of tokens in a string.
        """
        if not text:
            return 0

        target_model = model or self.default_model
        try:
            try:
                encoding = tiktoken.get_encoding(target_model)
            except ValueError:
                encoding = tiktoken.encoding_for_model(target_model)
            return len(encoding.encode(text))
        except Exception as exc:
            logger.debug(
                "Tiktoken count failed for model %s, falling back to estimator: %s",
                target_model,
                exc,
            )
            # Graceful fallback: ~4 characters per token
            fallback_ratio = CopilotSettings.COPILOT_FALLBACK_CHARS_PER_TOKEN
            return max(1, len(text) // fallback_ratio)
