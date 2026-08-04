"""
Structured response parsers and JSON schema validation utilities for LLM outputs.
Provides standard interfaces for safely parsing model responses into typed schemas.
"""

import json
import logging
from typing import Any, Dict

logger = logging.getLogger(__name__)


class ResponseParseError(Exception):
    """Raised when an AI response payload fails schema validation or JSON decoding."""

    pass


def extract_json_payload(raw_text: str) -> Dict[str, Any]:
    """
    Safely extracts and parses a JSON object from a raw LLM text response.
    Strips markdown code fences if present.
    """
    if not raw_text:
        raise ResponseParseError("Cannot parse empty response payload.")

    cleaned_text = raw_text.strip()
    if cleaned_text.startswith("```json"):
        cleaned_text = cleaned_text[7:]
    if cleaned_text.startswith("```"):
        cleaned_text = cleaned_text[3:]
    if cleaned_text.endswith("```"):
        cleaned_text = cleaned_text[:-3]
    cleaned_text = cleaned_text.strip()

    try:
        data: Dict[str, Any] = json.loads(cleaned_text)
        if not isinstance(data, dict):
            raise ResponseParseError("Parsed JSON is not a key-value dictionary.")
        return data
    except (json.JSONDecodeError, ValueError) as exc:
        logger.error("Failed to decode JSON from AI response: %s", exc)
        raise ResponseParseError(f"Invalid JSON format in LLM response: {exc}") from exc


__all__ = [
    "ResponseParseError",
    "extract_json_payload",
]
