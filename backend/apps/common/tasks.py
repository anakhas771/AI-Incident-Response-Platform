import logging
from typing import Any

from celery import shared_task

from .services import EmailService

logger = logging.getLogger(__name__)


def enqueue_async_email(**kwargs: Any) -> None:
    """Best-effort Celery enqueue for email delivery.

    Database/API operations must not fail because the broker is temporarily
    unavailable. Once queued, the Celery task handles email-send retries.
    """
    try:
        send_async_email.delay(**kwargs)
    except Exception:
        logger.exception("Failed to enqueue asynchronous email task")


@shared_task(
    autoretry_for=(Exception,),
    retry_kwargs={"max_retries": 3, "countdown": 60},
)
def send_async_email(
    subject: str,
    template_name: str,
    context: dict[str, Any],
    recipient_list: list[str],
) -> None:
    """Asynchronously send a templated email, retrying transient failures."""
    EmailService.send_template_email(
        subject=subject,
        template_name=template_name,
        context=context,
        recipient_list=recipient_list,
    )
