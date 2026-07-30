import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import Organization, Role

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def sample_organization(db):
    return Organization.objects.create(name="Defense Org", slug="defense-org")


@pytest.fixture
def sample_user(db, sample_organization):
    return User.objects.create_user(
        email="user@defense.com",
        password="SecurePassword123!",
        first_name="Alice",
        last_name="Smith",
        role=Role.ANALYST,
        organization=sample_organization,
    )


@pytest.mark.django_db
class TestAuthenticationAPI:
    def test_user_registration(self, api_client):
        url = reverse("auth-register")
        payload = {
            "email": "newuser@example.com",
            "password": "StrongPassword123!",
            "password_confirm": "StrongPassword123!",
            "first_name": "New",
            "last_name": "User",
            "organization_name": "New Security Co",
            "role": "RESPONDER",
        }
        response = api_client.post(url, payload, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["email"] == "newuser@example.com"
        assert response.data["role"] == "RESPONDER"
        assert response.data["organization"]["name"] == "New Security Co"

        # Verify DB
        created_user = User.objects.get(email="newuser@example.com")
        assert created_user.check_password("StrongPassword123!")

    def test_registration_duplicate_email(self, api_client, sample_user):
        url = reverse("auth-register")
        payload = {
            "email": sample_user.email,
            "password": "AnotherPassword123!",
            "password_confirm": "AnotherPassword123!",
            "first_name": "Duplicate",
            "last_name": "User",
        }
        response = api_client.post(url, payload, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_registration_password_mismatch(self, api_client):
        url = reverse("auth-register")
        payload = {
            "email": "mismatch@example.com",
            "password": "Password123!",
            "password_confirm": "Different123!",
            "first_name": "Test",
            "last_name": "User",
        }
        response = api_client.post(url, payload, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_login_success(self, api_client, sample_user):
        url = reverse("auth-login")
        payload = {
            "email": sample_user.email,
            "password": "SecurePassword123!",
        }
        response = api_client.post(url, payload, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert "access" in response.data
        assert "refresh" in response.data
        assert response.data["user"]["email"] == sample_user.email

    def test_login_invalid_credentials(self, api_client, sample_user):
        url = reverse("auth-login")
        payload = {
            "email": sample_user.email,
            "password": "WrongPassword!",
        }
        response = api_client.post(url, payload, format="json")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_token_refresh(self, api_client, sample_user):
        login_url = reverse("auth-login")
        login_res = api_client.post(
            login_url,
            {"email": sample_user.email, "password": "SecurePassword123!"},
            format="json",
        )
        refresh_token = login_res.data["refresh"]

        refresh_url = reverse("auth-refresh")
        response = api_client.post(
            refresh_url, {"refresh": refresh_token}, format="json"
        )
        assert response.status_code == status.HTTP_200_OK
        assert "access" in response.data

    def test_user_profile_me(self, api_client, sample_user):
        api_client.force_authenticate(user=sample_user)
        url = reverse("auth-me")

        # GET profile
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["email"] == sample_user.email
        assert response.data["full_name"] == "Alice Smith"

        # UPDATE profile
        update_res = api_client.patch(
            url, {"first_name": "Alicia", "phone_number": "+123456789"}, format="json"
        )
        assert update_res.status_code == status.HTTP_200_OK
        assert update_res.data["first_name"] == "Alicia"
        assert update_res.data["phone_number"] == "+123456789"

    def test_change_password(self, api_client, sample_user):
        api_client.force_authenticate(user=sample_user)
        url = reverse("auth-change-password")
        payload = {
            "old_password": "SecurePassword123!",
            "new_password": "BrandNewPassword123!",
            "new_password_confirm": "BrandNewPassword123!",
        }
        response = api_client.post(url, payload, format="json")
        assert response.status_code == status.HTTP_200_OK

        # Verify old password no longer works
        sample_user.refresh_from_db()
        assert sample_user.check_password("BrandNewPassword123!")

    def test_organization_detail_view(
        self, api_client, sample_user, sample_organization
    ):
        api_client.force_authenticate(user=sample_user)
        url = reverse("organization-detail")

        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == sample_organization.name
        assert response.data["slug"] == sample_organization.slug
