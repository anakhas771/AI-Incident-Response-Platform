import logging
import time
from typing import Any

from apps.common.correlation import get_current_request_id

logger = logging.getLogger(__name__)

_TASK_START_TIMES: dict[str, float] = {}


def task_started(task_id: str, task_name: str) -> None:
    """Record task start time and emit a structured start event."""
    _TASK_START_TIMES[task_id] = time.perf_counter()

    logger.info(
        "Celery task started",
        extra={
            "task_name": task_name,
            "task_id": task_id,
            "request_id": get_current_request_id(),
        },
    )


def task_finished(
    task_id: str,
    task_name: str,
    status: str,
    *,
    exception: BaseException | None = None,
) -> None:
    """Emit a terminal task event with execution duration."""
    started_at = _TASK_START_TIMES.pop(task_id, None)

    duration_ms = (
        round((time.perf_counter() - started_at) * 1000, 2)
        if started_at is not None
        else None
    )

    payload: dict[str, Any] = {
        "task_name": task_name,
        "task_id": task_id,
        "status": status,
        "duration_ms": duration_ms,
        "request_id": get_current_request_id(),
    }

    if exception is not None:
        payload["error_type"] = type(exception).__name__
        payload["error"] = str(exception)

    if status == "success":
        logger.info("Celery task completed", extra=payload)
    else:
        logger.error("Celery task failed", extra=payload)


def task_retried(
    task_id: str,
    task_name: str,
    reason: BaseException | None,
    retries: int,
) -> None:
    """Emit a task retry event."""
    logger.warning(
        "Celery task retrying",
        extra={
            "task_name": task_name,
            "task_id": task_id,
            "request_id": get_current_request_id(),
            "retry_count": retries,
            "error_type": type(reason).__name__ if reason else "",
            "error": str(reason) if reason else "",
        },
    )
