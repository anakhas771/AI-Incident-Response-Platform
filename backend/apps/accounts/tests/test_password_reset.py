from datetime import timedelta

import pytest
from django.core.cache import cache
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import PasswordResetToken, Role, User
from apps.accounts.token_utils import hash_lifecycle_token


@pytest.mark.django_db
def test_password_reset_request_stores_only_token_hash(
    monkeypatch, django_capture_on_commit_callbacks
):
    user = User.objects.create_user(
        email="reset@test.com",
        password="OldPassword123!",
        first_name="Reset",
        last_name="User",
        role=Role.VIEWER,
    )
    sent = {}

    def fake_enqueue(**kwargs):
        sent.update(kwargs)

    monkeypatch.setattr("apps.accounts.views.enqueue_async_email", fake_enqueue)
    monkeypatch.setattr(
        "apps.accounts.views.get_random_string", lambda length: "r" * length
    )

    with django_capture_on_commit_callbacks(execute=True):
        response = APIClient().post(
            reverse("accounts:auth-password-reset"),
            {"email": user.email},
        )

    assert response.status_code == status.HTTP_200_OK
    token = PasswordResetToken.objects.get(user=user)
    assert token.token == hash_lifecycle_token("r" * 64)
    assert token.token != "r" * 64
    assert "reset_url" in sent["context"]
    assert "token=" + ("r" * 64) in sent["context"]["reset_url"]


@pytest.mark.django_db
def test_password_reset_confirm_accepts_raw_token_and_consumes_it():
    user = User.objects.create_user(
        email="confirm@test.com",
        password="OldPassword123!",
        first_name="Confirm",
        last_name="User",
        role=Role.VIEWER,
    )
    raw_token = "c" * 64
    reset_token = PasswordResetToken.objects.create(
        user=user,
        token=hash_lifecycle_token(raw_token),
        expires_at=timezone.now() + timedelta(hours=24),
    )

    response = APIClient().post(
        reverse("accounts:auth-password-reset-confirm"),
        {
            "token": raw_token,
            "new_password": "NewSecurePassword123!",
            "new_password_confirm": "NewSecurePassword123!",
        },
    )

    assert response.status_code == status.HTTP_200_OK
    reset_token.refresh_from_db()
    assert reset_token.used is True
    user.refresh_from_db()
    assert user.check_password("NewSecurePassword123!")


@pytest.mark.django_db
def test_password_reset_request_is_rate_limited():
    cache.clear()

    client = APIClient()
    url = reverse("accounts:auth-password-reset")

    for _ in range(5):
        response = client.post(url, {"email": "unknown@example.com"})
        assert response.status_code == status.HTTP_200_OK

    response = client.post(url, {"email": "unknown@example.com"})

    assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS
