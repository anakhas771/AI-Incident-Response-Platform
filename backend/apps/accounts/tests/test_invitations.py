from datetime import timedelta

import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import (
    InvitationStatus,
    Organization,
    OrganizationInvitation,
    Role,
    User,
)
from apps.accounts.token_utils import hash_lifecycle_token


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def org():
    return Organization.objects.create(name="Test Org")


@pytest.fixture
def admin_user(org):
    return User.objects.create_user(
        email="admin@test.com",
        password="password123",
        first_name="Admin",
        last_name="User",
        organization=org,
        role=Role.ADMIN,
    )


@pytest.fixture
def viewer_user(org):
    return User.objects.create_user(
        email="viewer@test.com",
        password="password123",
        first_name="Viewer",
        last_name="User",
        organization=org,
        role=Role.VIEWER,
    )


@pytest.mark.django_db
class TestOrganizationInvitations:
    def test_send_invitation_as_admin(self, api_client, admin_user):
        api_client.force_authenticate(user=admin_user)
        url = reverse("accounts:invitations-list")
        response = api_client.post(
            url, {"email": "newuser@test.com", "role": "ANALYST"}
        )
        assert response.status_code == status.HTTP_201_CREATED
        invitation = OrganizationInvitation.objects.get(email="newuser@test.com")
        assert len(invitation.token) == 64
        assert invitation.token != "newuser@test.com"

    def test_send_invitation_as_viewer(self, api_client, viewer_user):
        api_client.force_authenticate(user=viewer_user)
        url = reverse("accounts:invitations-list")
        response = api_client.post(
            url, {"email": "newuser2@test.com", "role": "ANALYST"}
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_accept_invitation_new_user(self, api_client, org):
        raw_token = "test-invitation-token"
        invitation = OrganizationInvitation.objects.create(
            organization=org,
            email="newuser3@test.com",
            role=Role.ANALYST,
            token=hash_lifecycle_token(raw_token),
            created_by=None,
            expires_at=timezone.now() + timedelta(days=7),
            status=InvitationStatus.PENDING,
        )
        user = User.objects.create_user(
            email="newuser3@test.com", password="password123"
        )
        api_client.force_authenticate(user=user)
        response = api_client.post(
            reverse("accounts:invitations-accept"), {"token": raw_token}
        )
        assert response.status_code == status.HTTP_200_OK
        user.refresh_from_db()
        assert user.organization == org
        assert user.role == Role.ANALYST
        invitation.refresh_from_db()
        assert invitation.status == InvitationStatus.ACCEPTED
        assert invitation.accepted_at is not None

    def test_accept_invitation_rejects_expired_token(self, api_client, org):
        raw_token = "expired-invitation-token"
        OrganizationInvitation.objects.create(
            organization=org,
            email="expired@test.com",
            role=Role.ANALYST,
            token=hash_lifecycle_token(raw_token),
            created_by=None,
            expires_at=timezone.now() - timedelta(minutes=1),
            status=InvitationStatus.PENDING,
        )
        user = User.objects.create_user(
            email="expired@test.com", password="password123"
        )
        api_client.force_authenticate(user=user)

        response = api_client.post(
            reverse("accounts:invitations-accept"), {"token": raw_token}
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "token" in response.data

    def test_accept_invitation_rejects_reused_token(self, api_client, org):
        raw_token = "reused-invitation-token"
        invitation = OrganizationInvitation.objects.create(
            organization=org,
            email="reused@test.com",
            role=Role.ANALYST,
            token=hash_lifecycle_token(raw_token),
            created_by=None,
            expires_at=timezone.now() + timedelta(days=7),
            status=InvitationStatus.PENDING,
        )
        user = User.objects.create_user(email="reused@test.com", password="password123")
        api_client.force_authenticate(user=user)
        url = reverse("accounts:invitations-accept")

        first_response = api_client.post(url, {"token": raw_token})
        second_response = api_client.post(url, {"token": raw_token})

        assert first_response.status_code == status.HTTP_200_OK
        assert second_response.status_code == status.HTTP_400_BAD_REQUEST
        assert "token" in second_response.data
        invitation.refresh_from_db()
        assert invitation.status == InvitationStatus.ACCEPTED

    def test_accept_invitation_rejects_wrong_email(self, api_client, org):
        raw_token = "wrong-email-invitation-token"
        OrganizationInvitation.objects.create(
            organization=org,
            email="intended@test.com",
            role=Role.ANALYST,
            token=hash_lifecycle_token(raw_token),
            created_by=None,
            expires_at=timezone.now() + timedelta(days=7),
            status=InvitationStatus.PENDING,
        )
        user = User.objects.create_user(
            email="different@test.com", password="password123"
        )
        api_client.force_authenticate(user=user)

        response = api_client.post(
            reverse("accounts:invitations-accept"), {"token": raw_token}
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_send_invitation_rejects_duplicate_pending_invitation(
        self, api_client, admin_user, monkeypatch
    ):
        monkeypatch.setattr(
            "apps.accounts.views.enqueue_async_email", lambda **kwargs: None
        )
        api_client.force_authenticate(user=admin_user)
        url = reverse("accounts:invitations-list")
        payload = {"email": "duplicate@test.com", "role": "ANALYST"}

        first_response = api_client.post(url, payload)
        second_response = api_client.post(url, payload)

        assert first_response.status_code == status.HTTP_201_CREATED
        assert second_response.status_code == status.HTTP_400_BAD_REQUEST
        assert "pending invitation" in str(second_response.data).lower()
