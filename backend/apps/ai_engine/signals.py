"""
Django signals for automatic AI Engine incident triage and analysis.
"""

import logging

from django.conf import settings
from django.db import connection, transaction
from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.incidents.models import Incident

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Incident)
def trigger_automatic_incident_analysis(sender, instance, created, **kwargs):
    """
    Django post_save signal handler on Incident models.
    Whenever a new Incident is created (created=True), automatically triggers
    asynchronous background AI analysis via Celery on the Redis queue.
    """
    if created:
        logger.info(
            "New Incident ID=%s created; automatic AI analysis signal fired.",
            instance.id,
        )
        try:
            from apps.ai_engine.tasks import analyze_incident_task

            if (
                connection.in_atomic_block
                and not getattr(settings, "CELERY_TASK_ALWAYS_EAGER", False)
                and not getattr(settings, "TESTING", False)
            ):
                transaction.on_commit(
                    lambda: analyze_incident_task.delay(str(instance.id))
                )
            else:
                analyze_incident_task.delay(str(instance.id))
        except Exception as exc:
            logger.exception(
                "Error enqueuing automatic AI analysis task for Incident ID=%s: %s",
                instance.id,
                exc,
            )
