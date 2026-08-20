import logging
from typing import Any, Dict

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)


class EmailService:
    """
    Abstraction for sending emails securely and reliably, supporting templates.
    """

    @staticmethod
    def send_template_email(
        subject: str,
        template_name: str,
        context: Dict[str, Any],
        recipient_list: list[str],
        from_email: str | None = None,
    ) -> None:
        """
        Render an HTML template and its plaintext version, then send.
        """
        from_email = from_email or settings.DEFAULT_FROM_EMAIL

        # Inject standard context variables
        context.setdefault("frontend_base_url", settings.FRONTEND_BASE_URL)

        html_content = render_to_string(template_name, context)
        text_content = strip_tags(html_content)

        msg = EmailMultiAlternatives(subject, text_content, from_email, recipient_list)
        msg.attach_alternative(html_content, "text/html")

        try:
            msg.send()
            logger.info(f"Successfully sent email '{subject}' to {recipient_list}")
        except Exception as e:
            logger.error(f"Failed to send email '{subject}' to {recipient_list}: {e}")
            raise
