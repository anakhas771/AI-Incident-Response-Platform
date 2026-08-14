from typing import Any, Dict

from celery import shared_task

from .services import EmailService


@shared_task(
    autoretry_for=(Exception,),
    retry_kwargs={"max_retries": 3, "countdown": 60},
)
def send_async_email(
    subject: str,
    template_name: str,
    context: Dict[str, Any],
    recipient_list: list[str],
) -> None:
    """
    Asynchronously send an email using Celery, with retries on failure.
    """
    EmailService.send_template_email(
        subject=subject,
        template_name=template_name,
        context=context,
        recipient_list=recipient_list,
    )
