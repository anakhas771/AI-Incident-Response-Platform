import pytest


@pytest.fixture(autouse=True)
def mock_copilot_llm(settings):
    """Use the deterministic mock LLM for Knowledge app tests."""
    settings.COPILOT_LLM_CONFIG = {
        "PROVIDER": "mock",
        "MODEL": "mock-gpt-model",
        "TEMPERATURE": 0.2,
        "MAX_TOKENS": 2048,
        "MAX_RETRIES": 2,
        "BASE_BACKOFF": 0.0,
        "MAX_BACKOFF": 0.0,
    }
