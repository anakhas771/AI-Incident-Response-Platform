import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory

from apps.accounts.models import Organization, Role
from apps.accounts.permissions import (
    HasRole,
    IsAdmin,
    IsAnalyst,
    IsResponder,
    IsSameOrganization,
)

User = get_user_model()


@pytest.fixture
def org_a(db):
    return Organization.objects.create(name="Org A", slug="org-a")


@pytest.fixture
def org_b(db):
    return Organization.objects.create(name="Org B", slug="org-b")


@pytest.fixture
def admin_user(db, org_a):
    return User.objects.create_user(
        email="admin@orga.com",
        password="Password123!",
        role=Role.ADMIN,
        organization=org_a,
    )


@pytest.fixture
def analyst_user(db, org_a):
    return User.objects.create_user(
        email="analyst@orga.com",
        password="Password123!",
        role=Role.ANALYST,
        organization=org_a,
    )


@pytest.fixture
def responder_user(db, org_a):
    return User.objects.create_user(
        email="responder@orga.com",
        password="Password123!",
        role=Role.RESPONDER,
        organization=org_a,
    )


@pytest.fixture
def viewer_user(db, org_a):
    return User.objects.create_user(
        email="viewer@orga.com",
        password="Password123!",
        role=Role.VIEWER,
        organization=org_a,
    )


@pytest.fixture
def user_org_b(db, org_b):
    return User.objects.create_user(
        email="user@orgb.com",
        password="Password123!",
        role=Role.ANALYST,
        organization=org_b,
    )


@pytest.mark.django_db
class TestRBACPermissions:
    def test_is_admin_permission(self, admin_user, analyst_user, viewer_user):
        factory = APIRequestFactory()
        request = factory.get("/")
        perm = IsAdmin()

        request.user = admin_user
        assert perm.has_permission(request, None) is True

        request.user = analyst_user
        assert perm.has_permission(request, None) is False

        request.user = viewer_user
        assert perm.has_permission(request, None) is False

    def test_is_analyst_permission(
        self, admin_user, analyst_user, responder_user, viewer_user
    ):
        factory = APIRequestFactory()
        request = factory.get("/")
        perm = IsAnalyst()

        request.user = admin_user
        assert perm.has_permission(request, None) is True

        request.user = analyst_user
        assert perm.has_permission(request, None) is True

        request.user = responder_user
        assert perm.has_permission(request, None) is False

        request.user = viewer_user
        assert perm.has_permission(request, None) is False

    def test_is_responder_permission(
        self, admin_user, analyst_user, responder_user, viewer_user
    ):
        factory = APIRequestFactory()
        request = factory.get("/")
        perm = IsResponder()

        request.user = admin_user
        assert perm.has_permission(request, None) is True

        request.user = analyst_user
        assert perm.has_permission(request, None) is True

        request.user = responder_user
        assert perm.has_permission(request, None) is True

        request.user = viewer_user
        assert perm.has_permission(request, None) is False

    def test_has_role_factory(self, responder_user, viewer_user):
        factory = APIRequestFactory()
        request = factory.get("/")

        CustomPerm = HasRole([Role.RESPONDER])
        perm = CustomPerm()

        request.user = responder_user
        assert perm.has_permission(request, None) is True

        request.user = viewer_user
        assert perm.has_permission(request, None) is False

    def test_is_same_organization_permission(
        self, analyst_user, user_org_b, org_a, org_b
    ):
        factory = APIRequestFactory()
        request = factory.get("/")
        perm = IsSameOrganization()

        # analyst_user belongs to org_a
        request.user = analyst_user
        assert perm.has_object_permission(request, None, org_a) is True
        assert perm.has_object_permission(request, None, org_b) is False

        # user_org_b belongs to org_b
        request.user = user_org_b
        assert perm.has_object_permission(request, None, org_b) is True
        assert perm.has_object_permission(request, None, org_a) is False
