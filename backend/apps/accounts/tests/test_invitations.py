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


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def org():
    return Organization.objects.create(name="Test Org")


@pytest.fixture
def admin_user(org):
    user = User.objects.create_user(
        email="admin@test.com",
        password="password123",
        first_name="Admin",
        last_name="User",
        organization=org,
        role=Role.ADMIN,
    )
    return user


@pytest.fixture
def viewer_user(org):
    user = User.objects.create_user(
        email="viewer@test.com",
        password="password123",
        first_name="Viewer",
        last_name="User",
        organization=org,
        role=Role.VIEWER,
    )
    return user


@pytest.mark.django_db
class TestOrganizationInvitations:
    def test_send_invitation_as_admin(self, api_client, admin_user):
        api_client.force_authenticate(user=admin_user)
        url = reverse("accounts:invitations-list")
        response = api_client.post(
            url, {"email": "newuser@test.com", "role": "ANALYST"}
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert OrganizationInvitation.objects.filter(email="newuser@test.com").exists()

    def test_send_invitation_as_viewer(self, api_client, viewer_user):
        api_client.force_authenticate(user=viewer_user)
        url = reverse("accounts:invitations-list")
        response = api_client.post(
            url, {"email": "newuser2@test.com", "role": "ANALYST"}
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_accept_invitation_new_user(self, api_client, org):
        invitation = OrganizationInvitation.objects.create(
            organization=org,
            email="newuser3@test.com",
            role=Role.ANALYST,
            token="test-invitation-token",
            created_by=None,
            expires_at=timezone.now() + timedelta(days=7),
            status=InvitationStatus.PENDING,
        )
        url = reverse("accounts:invitations-accept")
        # Creating a user first since Accept logic assumes user exists or handles it?
        # Wait, the logic in accept invitation checks if request.user is authenticated OR they need to register.
        # Let's check how accept invitation works.
        # Actually, if not authenticated, does the API accept it and create user? Or does the user register with the token?
        # The register endpoint takes the token. Accept endpoint is for already registered or logged-in users.

        user = User.objects.create_user(
            email="newuser3@test.com", password="password123"
        )
        api_client.force_authenticate(user=user)

        response = api_client.post(url, {"token": str(invitation.token)})
        assert response.status_code == status.HTTP_200_OK

        user.refresh_from_db()
        assert user.organization == org
        assert user.role == Role.ANALYST

        invitation.refresh_from_db()
        assert invitation.status == InvitationStatus.ACCEPTED
        assert invitation.accepted_at is not None
