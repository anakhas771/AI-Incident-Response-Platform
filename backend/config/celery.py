"""
Celery configuration for AI Incident Response Platform.
Configures Redis broker, Redis result backend, task queues ('default', 'ai_tasks'),
task routing, retry policies, and auto-discovery across installed Django applications.
"""

import os

from celery import Celery
from kombu import Exchange, Queue

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
