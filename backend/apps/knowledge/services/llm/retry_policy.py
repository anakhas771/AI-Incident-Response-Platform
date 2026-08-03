"""
Retry policy with exponential backoff, jitter, and transient failure detection for LLM invocations.
"""

import logging
import random
import time
from typing import Any, Callable, TypeVar

from apps.knowledge.services.exceptions import ErrorCode, LLMException

logger = logging.getLogger(__name__)
T = TypeVar("T")


class RetryPolicy:
    """
    Enterprise retry policy with exponential backoff, jitter, and transient failure detection.
    """

    def __init__(
        self,
        max_retries: int = 3,
        base_backoff: float = 1.0,
        sleep_fn: Callable[[float], None] = time.sleep,
    ) -> None:
        self.max_retries = max_retries
        self.base_backoff = base_backoff
        self.sleep_fn = sleep_fn

    def is_transient(self, exc: Exception) -> bool:
        """
        Determine whether an exception represents a transient failure that should be retried.
        """
        status_code = getattr(exc, "status_code", None) or getattr(exc, "status", None)
        if status_code and 400 <= status_code < 500 and status_code not in (408, 429):
            return False
        if isinstance(exc, LLMException):
            return exc.code in (
                ErrorCode.LLM_TIMEOUT.value,
                ErrorCode.LLM_RATE_LIMIT.value,
                ErrorCode.LLM_ERROR.value,
            )
        if status_code in (408, 429, 500, 502, 503, 504):
            return True
        msg = str(exc).lower()
        transient_keywords = [
            "timeout",
            "rate limit",
            "429",
            "500",
            "502",
            "503",
            "504",
            "connection",
            "temporary",
            "unavailable",
            "overloaded",
        ]
        return any(kw in msg for kw in transient_keywords)

    def execute(self, func: Callable[..., T], *args: Any, **kwargs: Any) -> T:
        """
        Execute a function with exponential backoff and randomized jitter on transient failures.
        """
        attempt = 0
        while True:
            try:
                return func(*args, **kwargs)
            except Exception as exc:
                attempt += 1
                if not self.is_transient(exc) or attempt > self.max_retries:
                    if isinstance(exc, LLMException):
                        raise
                    raise LLMException(
                        f"LLM invocation failed after {attempt} attempts: {exc}",
                        code=ErrorCode.LLM_ERROR.value,
                    ) from exc
                delay = self.base_backoff * (2 ** (attempt - 1)) + random.uniform(
                    0, 0.5
                )
                logger.warning(
                    "LLM invocation failed (attempt %d/%d). Retrying in %.2fs. Error: %s",
                    attempt,
                    self.max_retries,
                    delay,
                    exc,
                )
                self.sleep_fn(delay)
