"""
Celery configuration for AI Incident Response Platform.
Configures Redis broker, Redis result backend, task queues ('default', 'ai_tasks'),
task routing, retry policies, and auto-discovery across installed Django applications.
"""

import os

from celery import Celery
from celery.signals import (
    before_task_publish,
    task_failure,
    task_postrun,
    task_prerun,
    task_retry,
    task_success,
)
from kombu import Exchange, Queue

from apps.common.celery_observability import (
    task_finished,
    task_retried,
    task_started,
)
from apps.common.correlation import (
    clear_request_context,
    get_current_request_id,
    set_request_context,
)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")

app = Celery("ai_incident_platform")

# Load task modules from all registered Django app configs using CELERY namespace
app.config_from_object("django.conf:settings", namespace="CELERY")

# Define exchanges and task queues: default queue and ai_tasks queue
default_exchange = Exchange("default", type="direct")
ai_tasks_exchange = Exchange("ai_tasks", type="direct")

app.conf.task_queues = (
    Queue("default", default_exchange, routing_key="default"),
    Queue("ai_tasks", ai_tasks_exchange, routing_key="ai_tasks"),
)

app.conf.task_default_queue = "default"
app.conf.task_default_exchange = "default"
app.conf.task_default_routing_key = "default"

# Task routing: route ai_engine and knowledge tasks to ai_tasks queue
app.conf.task_routes = {
    "ai_engine.*": {"queue": "ai_tasks", "routing_key": "ai_tasks"},
    "apps.ai_engine.tasks.*": {"queue": "ai_tasks", "routing_key": "ai_tasks"},
    "knowledge.*": {"queue": "ai_tasks", "routing_key": "ai_tasks"},
    "apps.knowledge.tasks.*": {"queue": "ai_tasks", "routing_key": "ai_tasks"},
}

# Default task retry and reliability configuration
app.conf.task_acks_late = True
app.conf.task_reject_on_worker_lost = True
app.conf.task_default_retry_delay = 60  # seconds
app.conf.task_max_retries = 3

# Auto-discover tasks in all installed apps
app.autodiscover_tasks()


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f"Request: {self.request!r}")


@before_task_publish.connect
def propagate_request_id(
    sender: str | None = None,
    headers: dict[str, object] | None = None,
    **kwargs: object,
) -> None:
    """Propagate the current HTTP request ID into Celery task headers."""
    if headers is None:
        return

    request_id = get_current_request_id()
    if request_id:
        headers["request_id"] = request_id


@task_prerun.connect
def restore_request_id_for_task(
    task: object,
    task_id: str | None = None,
    **kwargs: object,
) -> None:
    """Restore correlation context and start task telemetry."""
    task_request = getattr(task, "request", None)
    headers = getattr(task_request, "headers", {}) or {}
    request_id = str(headers.get("request_id", ""))

    if request_id:
        set_request_context(request_id)

    if task_id:
        task_name = str(getattr(task, "name", task.__class__.__name__))
        task_started(task_id, task_name)


@task_success.connect
def record_successful_task(
    result: object | None = None,
    sender: object | None = None,
    **kwargs: object,
) -> None:
    """Record successful task completion."""
    task = sender

    if task is not None:
        task_id = str(getattr(getattr(task, "request", None), "id", ""))
        task_name = str(getattr(task, "name", task.__class__.__name__))

        if task_id:
            task_finished(task_id, task_name, "success")


@task_postrun.connect
def clear_task_request_context(**kwargs: object) -> None:
    """Prevent correlation state leaking between Celery tasks."""
    clear_request_context()


@task_failure.connect
def clear_failed_task_request_context(
    sender: object | None = None,
    task_id: str | None = None,
    exception: BaseException | None = None,
    task: object | None = None,
    **kwargs: object,
) -> None:
    """Record failed completion and clear task context."""
    task_obj = task if task is not None else sender

    if task_id:
        task_name = str(
            getattr(task_obj, "name", task_obj.__class__.__name__)
            if task_obj is not None
            else "unknown"
        )
        task_finished(
            task_id,
            task_name,
            "failed",
            exception=exception,
        )

    clear_request_context()


@task_retry.connect
def log_task_retry(
    request: object | None = None,
    reason: BaseException | None = None,
    **kwargs: object,
) -> None:
    """Record task retry attempts."""
    if request is None:
        return

    task_id = str(getattr(request, "id", ""))
    task_name = str(getattr(request, "task", "unknown"))
    retries = int(getattr(request, "retries", 0))

    if task_id:
        task_retried(
            task_id=task_id,
            task_name=task_name,
            reason=reason,
            retries=retries,
        )
