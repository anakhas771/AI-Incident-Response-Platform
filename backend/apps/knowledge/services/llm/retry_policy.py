"""
Retry policy with exponential backoff, jitter, and transient failure detection.
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
    Enterprise retry policy for transient LLM failures.

    max_retries means the number of retries AFTER the initial attempt.
    Therefore max_retries=3 means at most 4 total attempts.
    """

    TRANSIENT_STATUS_CODES = {408, 429, 500, 502, 503, 504}

    def __init__(
        self,
        max_retries: int = 3,
        base_backoff: float = 1.0,
        max_backoff: float = 30.0,
        jitter: float = 0.5,
        sleep_fn: Callable[[float], None] = time.sleep,
    ) -> None:
        if max_retries < 0:
            raise ValueError("max_retries must be >= 0.")

        if base_backoff < 0:
            raise ValueError("base_backoff must be >= 0.")

        if max_backoff < 0:
            raise ValueError("max_backoff must be >= 0.")

        if jitter < 0:
            raise ValueError("jitter must be >= 0.")

        self.max_retries = max_retries
        self.base_backoff = base_backoff
        self.max_backoff = max_backoff
        self.jitter = jitter
        self.sleep_fn = sleep_fn

    def is_transient(self, exc: Exception) -> bool:
        """
        Determine whether an exception should be retried.
        """
        status_code = getattr(exc, "status_code", None)

        if status_code is None:
            status_code = getattr(exc, "status", None)

        if isinstance(status_code, int):
            if 400 <= status_code < 500:
                return status_code in self.TRANSIENT_STATUS_CODES

            if status_code in self.TRANSIENT_STATUS_CODES:
                return True

        if isinstance(exc, LLMException):
            return exc.code in {
                ErrorCode.LLM_TIMEOUT.value,
                ErrorCode.LLM_RATE_LIMIT.value,
                ErrorCode.LLM_ERROR.value,
            }

        message = str(exc).lower()

        transient_keywords = (
            "timeout",
            "timed out",
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
        )

        return any(keyword in message for keyword in transient_keywords)

    def _calculate_delay(self, retry_number: int) -> float:
        """
        Calculate exponential backoff with bounded jitter.
        """
        exponential_delay = self.base_backoff * (2 ** (retry_number - 1))
        exponential_delay = min(exponential_delay, self.max_backoff)

        jitter = float(random.uniform(0.0, self.jitter))

        return float(min(exponential_delay + jitter, self.max_backoff))
    def execute(
        self,
        func: Callable[..., T],
        *args: Any,
        **kwargs: Any,
    ) -> T:
        """
        Execute a function with retries for transient failures.
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

                delay = self._calculate_delay(attempt)

                logger.warning(
                    "Transient LLM failure. "
                    "attempt=%d retry=%d/%d delay=%.2fs error_type=%s",
                    attempt,
                    attempt,
                    self.max_retries,
                    delay,
                    type(exc).__name__,
                )

                self.sleep_fn(delay)
