import pytest
from django.contrib.auth import get_user_model

from apps.accounts.models import Organization, Role

User = get_user_model()


@pytest.mark.django_db
class TestOrganizationModel:
    def test_organization_creation(self):
        org = Organization.objects.create(
            name="Acme Corp", slug="acme-corp", description="Security Operations"
        )
        assert org.name == "Acme Corp"
        assert org.slug == "acme-corp"
        assert org.is_active is True
        assert str(org) == "Acme Corp"


@pytest.mark.django_db
class TestUserModel:
    def test_create_user_successful(self):
        email = "TEST.USER@Example.com"
        user = User.objects.create_user(
            email=email,
            password="StrongPassword123!",
            first_name="Jane",
            last_name="Doe",
        )
        assert user.email == "TEST.USER@example.com"
        assert user.check_password("StrongPassword123!")
        assert user.role == Role.VIEWER
        assert user.full_name == "Jane Doe"
        assert str(user) == "TEST.USER@example.com"

    def test_create_user_missing_email(self):
        with pytest.raises(ValueError, match="The Email field must be set"):
            User.objects.create_user(email="", password="Password123!")

    def test_create_superuser_successful(self):
        superuser = User.objects.create_superuser(
            email="admin@example.com",
            password="AdminPassword123!",
            first_name="Admin",
            last_name="User",
        )
        assert superuser.email == "admin@example.com"
        assert superuser.is_staff is True
        assert superuser.is_superuser is True
        assert superuser.role == Role.ADMIN

    def test_create_superuser_invalid_flags(self):
        with pytest.raises(ValueError, match="Superuser must have is_staff=True"):
            User.objects.create_superuser(
                email="admin2@example.com",
                password="AdminPassword123!",
                is_staff=False,
            )

    def test_user_organization_relationship(self):
        org = Organization.objects.create(name="CyberSec Inc", slug="cybersec-inc")
        user = User.objects.create_user(
            email="analyst@cybersec.com",
            password="Password123!",
            organization=org,
            role=Role.ANALYST,
        )
        assert user.organization == org
        assert org.users.count() == 1
        assert org.users.first() == user
