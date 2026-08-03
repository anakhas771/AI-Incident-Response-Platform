"""
Tests for CopilotSettings configuration and constants.
"""

from apps.knowledge.services.config import CopilotSettings


def test_copilot_settings_constants():
    assert CopilotSettings.DEFAULT_TOP_K == 5
    assert CopilotSettings.MIN_SIMILARITY_THRESHOLD == 0.65
    assert CopilotSettings.DEFAULT_CHUNK_TOKENS == 500
    assert CopilotSettings.DEFAULT_OVERLAP_TOKENS == 100
    assert CopilotSettings.CHARS_PER_TOKEN == 4
    assert CopilotSettings.COPILOT_SYSTEM_BUDGET_TOKENS == 1000
    assert CopilotSettings.COPILOT_MAX_HISTORY_TOKENS == 2000
    assert CopilotSettings.COPILOT_MAX_CONTEXT_TOKENS == 3000
    assert CopilotSettings.COPILOT_MAX_TOTAL_TOKENS == 6000
    assert CopilotSettings.COPILOT_FALLBACK_CHARS_PER_TOKEN == 4
    assert CopilotSettings.TOKEN_COUNTER_MODEL == "cl100k_base"
    assert CopilotSettings.SUMMARY_PLACEHOLDER == "[Previous conversation summarized]"
