from celery import shared_task

from apps.common.correlation import clear_request_context, set_request_context
from apps.common.metrics import metrics


@shared_task(name="common.tests.integration_success_task")
def integration_success_task() -> str:
    return "ok"


@shared_task(
    bind=True,
    name="common.tests.integration_failure_task",
    max_retries=0,
)
def integration_failure_task(self):
    raise ValueError("integration failure")


def setup_function():
    metrics.reset()
    clear_request_context()


def teardown_function():
    metrics.reset()
    clear_request_context()


def test_real_celery_success_updates_observability_metrics():
    result = integration_success_task.apply()

    assert result.successful()
    assert result.result == "ok"

    snapshot = metrics.get_snapshot()

    assert (
        snapshot["celery_tasks_total"]["common.tests.integration_success_task|success"]
        == 1
    )

    duration = snapshot["celery_task_duration_ms"][
        "common.tests.integration_success_task"
    ]

    assert duration["count"] == 1
    assert duration["total_ms"] >= 0
    assert duration["min_ms"] >= 0
    assert duration["max_ms"] >= 0
    assert duration["avg_ms"] >= 0


def test_real_celery_failure_updates_observability_metrics():
    result = integration_failure_task.apply(throw=False)

    assert result.failed()
    assert isinstance(result.result, ValueError)

    snapshot = metrics.get_snapshot()

    assert (
        snapshot["celery_tasks_total"]["common.tests.integration_failure_task|failed"]
        == 1
    )

    duration = snapshot["celery_task_duration_ms"][
        "common.tests.integration_failure_task"
    ]

    assert duration["count"] == 1


def test_request_correlation_is_available_during_celery_task():
    set_request_context("req-celery-integration")

    captured: list[str] = []

    @shared_task(name="common.tests.integration_correlation_task")
    def correlation_task() -> str:
        from apps.common.correlation import get_current_request_id

        captured.append(get_current_request_id())
        return "ok"

    try:
        result = correlation_task.apply()

        assert result.successful()
        assert captured == ["req-celery-integration"]
    finally:
        clear_request_context()
