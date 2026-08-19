"""
Tests for CopilotSettings configuration and constants.
"""

from apps.knowledge.services.config import CopilotSettings


def test_copilot_settings_constants():
    assert CopilotSettings.DEFAULT_TOP_K == 3
    assert CopilotSettings.MIN_SIMILARITY_THRESHOLD == 0.70
    assert CopilotSettings.DEFAULT_CHUNK_TOKENS == 500
    assert CopilotSettings.DEFAULT_OVERLAP_TOKENS == 100
    assert CopilotSettings.CHARS_PER_TOKEN == 4
    assert CopilotSettings.COPILOT_SYSTEM_BUDGET_TOKENS == 800
    assert CopilotSettings.COPILOT_MAX_HISTORY_TOKENS == 1200
    assert CopilotSettings.COPILOT_MAX_CONTEXT_TOKENS == 1800
    assert CopilotSettings.COPILOT_MAX_TOTAL_TOKENS == 4200
    assert CopilotSettings.COPILOT_FALLBACK_CHARS_PER_TOKEN == 4
    assert CopilotSettings.TOKEN_COUNTER_MODEL == "cl100k_base"
    assert CopilotSettings.SUMMARY_PLACEHOLDER == "[Previous conversation summarized]"
    