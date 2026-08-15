from types import SimpleNamespace

from apps.common.correlation import (
    clear_request_context,
    get_current_request_id,
    set_request_context,
)
from config.celery import (
    clear_task_request_context,
    propagate_request_id,
    restore_request_id_for_task,
)


def test_propagate_request_id_adds_header():
    set_request_context("req-celery-123")
    headers: dict[str, object] = {}

    try:
        propagate_request_id(headers=headers)
        assert headers["request_id"] == "req-celery-123"
    finally:
        clear_request_context()


def test_propagate_request_id_does_nothing_without_context():
    clear_request_context()
    headers: dict[str, object] = {}

    propagate_request_id(headers=headers)

    assert "request_id" not in headers


def test_restore_request_id_from_task_headers():
    clear_request_context()

    task = SimpleNamespace(
        request=SimpleNamespace(
            headers={"request_id": "req-worker-456"},
        )
    )

    restore_request_id_for_task(task=task, task_id="task-1")

    try:
        assert get_current_request_id() == "req-worker-456"
    finally:
        clear_request_context()


def test_clear_task_request_context():
    set_request_context("req-cleanup-789")

    clear_task_request_context()

    assert get_current_request_id() == ""
