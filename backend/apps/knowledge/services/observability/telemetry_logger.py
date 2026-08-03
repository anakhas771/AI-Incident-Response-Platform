"""
Structured telemetry logging for Enterprise Copilot tracing, usage, and latency.
"""

import time
from contextlib import contextmanager
from typing import Any, Dict, Iterator, Optional

import structlog

# Set up structured logger
logger = structlog.get_logger("copilot.telemetry")

VALID_STAGES = (
    "validation",
    "memory",
    "retrieval",
    "reranking",
    "prompt",
    "llm",
    "postprocess",
    "persist",
    "total",
)


class TelemetryLogger:
    """
    Reusable structured telemetry logging service with stage timing and usage tracing.
    """

    def __init__(self) -> None:
        self.stage_timings: Dict[str, float] = {}

    def log_event(self, event_name: str, payload: Dict[str, Any]) -> None:
        """
        Log a structured event to standard logger or tracing system.
        """
        logger.info(event_name, **payload)

    def record_stage(self, stage_name: str, duration_ms: float) -> None:
        """
        Record timing for a specific pipeline stage.
        """
        self.stage_timings[stage_name] = round(duration_ms, 2)

    @contextmanager
    def timer(self, stage_name: str) -> Iterator[None]:
        """
        Context manager to time an execution stage in milliseconds.
        """
        start = time.time()
        try:
            yield
        finally:
            duration_ms = (time.time() - start) * 1000.0
            self.record_stage(stage_name, duration_ms)

    def log_chat_turn(
        self,
        session_id: str,
        message_id: str,
        usage: Optional[Dict[str, Any]] = None,
        retries: int = 0,
        error: Optional[str] = None,
        provider_metadata: Optional[Dict[str, Any]] = None,
        stage_timings: Optional[Dict[str, float]] = None,
    ) -> None:
        """
        Log a complete Copilot chat turn with stage timing and usage accounting.
        NEVER log sensitive prompt or completion content.
        """
        timings = stage_timings or self.stage_timings
        payload = {
            "session_id": session_id,
            "message_id": message_id,
            "stages_ms": timings,
            "retries": retries,
            "error_rate": 1 if error else 0,
            "error_code": error,
            "usage": usage or {},
            "provider_metadata": provider_metadata or {},
        }
        self.log_event("copilot.chat.turn", payload)
