"""
Tests for TokenCounterService using tiktoken and fallback.
"""

from unittest.mock import patch

from apps.knowledge.services.config import CopilotSettings
from apps.knowledge.services.memory.token_counter import TokenCounterService


def test_token_counter_service_tiktoken():
    service = TokenCounterService()
    # tiktoken is installed, so it should run normally
    tokens = service.count_tokens("Hello world!")
    assert tokens > 0


def test_token_counter_service_fallback():
    service = TokenCounterService()
    # Mock tiktoken failure to verify fallback logic
    with patch("tiktoken.get_encoding", side_effect=Exception("Failed")):
        tokens = service.count_tokens("Hello world!")
        expected = (
            len("Hello world!") // CopilotSettings.COPILOT_FALLBACK_CHARS_PER_TOKEN
        )
        assert tokens == expected


def test_token_counter_service_empty():
    service = TokenCounterService()
    assert service.count_tokens("") == 0
    assert service.count_tokens(None) == 0
