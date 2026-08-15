import logging

from apps.common.celery_observability import (
    task_finished,
    task_retried,
    task_started,
)


def test_task_started_records_start_time(caplog):
    with caplog.at_level(logging.INFO):
        task_started("task-1", "demo.task")

    assert "Celery task started" in caplog.text

    record = caplog.records[-1]
    assert record.task_name == "demo.task"
    assert record.task_id == "task-1"


def test_task_finished_logs_success(caplog):
    task_started("task-2", "demo.task")

    with caplog.at_level(logging.INFO):
        task_finished("task-2", "demo.task", "success")

    assert "Celery task completed" in caplog.text

    record = caplog.records[-1]
    assert record.task_name == "demo.task"
    assert record.task_id == "task-2"
    assert record.status == "success"
    assert record.duration_ms is not None


def test_task_finished_logs_failure(caplog):
    task_started("task-3", "demo.task")

    error = ValueError("boom")

    with caplog.at_level(logging.ERROR):
        task_finished(
            "task-3",
            "demo.task",
            "failed",
            exception=error,
        )

    assert "Celery task failed" in caplog.text

    record = caplog.records[-1]
    assert record.task_name == "demo.task"
    assert record.task_id == "task-3"
    assert record.status == "failed"
    assert record.error_type == "ValueError"
    assert record.error == "boom"
    assert record.duration_ms is not None


def test_task_retried_logs_retry(caplog):
    error = RuntimeError("temporary failure")

    with caplog.at_level(logging.WARNING):
        task_retried(
            "task-4",
            "demo.task",
            error,
            2,
        )

    assert "Celery task retrying" in caplog.text

    record = caplog.records[-1]
    assert record.task_name == "demo.task"
    assert record.task_id == "task-4"
    assert record.retry_count == 2
    assert record.error_type == "RuntimeError"
    assert record.error == "temporary failure"
