"""
Common utility functions and text helpers for AI Engine services and tasks.
"""

import logging
import re
from typing import Optional

logger = logging.getLogger(__name__)

DEFAULT_LOG_TRUNCATION_CHARACTERS = 8000


def sanitize_prompt_input(
    text: Optional[str], max_length: int = DEFAULT_LOG_TRUNCATION_CHARACTERS
) -> str:
    """
    Sanitizes user and telemetry text inputs before formatting into LLM prompts.
    Strips non-printable characters and truncates excessive log strings.
    """
    if not text:
        return ""

    # Remove non-printable control characters while preserving standard whitespaces and newlines
    sanitized = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]", "", str(text))
    sanitized = sanitized.strip()

    if len(sanitized) > max_length:
        logger.warning(
            "Input text truncated from %d to %d characters for prompt injection.",
            len(sanitized),
            max_length,
        )
        return sanitized[:max_length] + "\n...[TRUNCATED_FOR_PROMPT_MAX_TOKENS]"

    return sanitized
