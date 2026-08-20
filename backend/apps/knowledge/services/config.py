"""
Configuration settings and constants for Enterprise AI Copilot services.
"""

import os
from typing import Final


class CopilotSettings:
    """
    Settings and token budgets for the Enterprise AI Copilot.
    """

    # General retrieval defaults
    DEFAULT_TOP_K: Final[int] = 3
    MIN_SIMILARITY_THRESHOLD: Final[float] = 0.70
    RERANK_TOP_K: Final[int] = 3

    # Feature flags
    ENABLE_MEMORY: Final[bool] = True
    ENABLE_HYBRID_SEARCH: Final[bool] = True
    ENABLE_RERANKING: Final[bool] = True
    ENABLE_QUERY_REWRITE: Final[bool] = False

    # Ingestion & chunking defaults
    DEFAULT_CHUNK_TOKENS: Final[int] = 500
    DEFAULT_OVERLAP_TOKENS: Final[int] = 100
    CHARS_PER_TOKEN: Final[int] = 4

    # Token budgeting constraints
    COPILOT_SYSTEM_BUDGET_TOKENS: Final[int] = 800
    COPILOT_MAX_HISTORY_TOKENS: Final[int] = 1200
    COPILOT_MAX_CONTEXT_TOKENS: Final[int] = 1800
    COPILOT_MAX_TOTAL_TOKENS: Final[int] = 4200
    COPILOT_FALLBACK_CHARS_PER_TOKEN: Final[int] = 4

    # Token counter settings
    TOKEN_COUNTER_MODEL: Final[str] = "cl100k_base"

    # Memory settings
    SUMMARY_PLACEHOLDER: Final[str] = "[Previous conversation summarized]"
    MAX_HISTORY_MESSAGES: Final[int] = int(
        os.environ.get("COPILOT_MAX_HISTORY_MESSAGES", 6)
    )

    # Streaming & API defaults (Task 5)
    ENABLE_STREAMING: Final[bool] = True
    STREAM_CHUNK_SIZE: Final[int] = 16
    STREAM_HEARTBEAT_SECONDS: Final[float] = 15.0
    MAX_MESSAGE_LENGTH: Final[int] = 4000
    MAX_STREAM_DURATION: Final[float] = 90.0
    DEFAULT_LLM_PROVIDER: Final[str] = "mock"
    DEFAULT_MODEL: Final[str] = "mock-gpt-model"
    MAX_RETRIES: Final[int] = 1
    RETRY_BACKOFF: Final[float] = 0.5
