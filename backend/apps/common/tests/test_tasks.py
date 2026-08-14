from unittest.mock import patch

import pytest

from apps.common.tasks import enqueue_async_email


@pytest.mark.django_db
def test_enqueue_async_email_swallows_broker_failure():
    with patch(
        "apps.common.tasks.send_async_email.delay",
        side_effect=ConnectionError("broker down"),
    ) as delay:
        # Email enqueue is best-effort: API/database work must not fail because
        # the Celery broker is unavailable.
        enqueue_async_email(
            subject="Test",
            template_name="emails/test.html",
            context={"name": "Test"},
            recipient_list=["test@example.com"],
        )

    delay.assert_called_once_with(
        subject="Test",
        template_name="emails/test.html",
        context={"name": "Test"},
        recipient_list=["test@example.com"],
    )
