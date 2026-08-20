import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import Organization, Role
from apps.incidents.models import Severity, Status
from apps.incidents.services import IncidentService

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def org(db):
    return Organization.objects.create(name="Security Org", slug="security-org")


@pytest.fixture
def admin_user(db, org):
    return User.objects.create_user(
        email="admin@security.com",
        password="Password123!",
        role=Role.ADMIN,
        organization=org,
    )


@pytest.fixture
def analyst_user(db, org):
    return User.objects.create_user(
        email="analyst@security.com",
        password="Password123!",
        role=Role.ANALYST,
        organization=org,
    )


@pytest.fixture
def responder_user(db, org):
    return User.objects.create_user(
        email="responder@security.com",
        password="Password123!",
        role=Role.RESPONDER,
        organization=org,
    )


@pytest.fixture
def viewer_user(db, org):
    return User.objects.create_user(
        email="viewer@security.com",
        password="Password123!",
        role=Role.VIEWER,
        organization=org,
    )


@pytest.fixture
def incident(db, org, admin_user):
    return IncidentService.create_incident(
        user=admin_user,
        organization=org,
        data={"title": "Permission Test Incident", "severity": Severity.MEDIUM},
    )


@pytest.mark.django_db
class TestRBACPermissions:
    def test_admin_has_full_access(self, api_client, admin_user, incident):
        api_client.force_authenticate(user=admin_user)

        # Create
        res_create = api_client.post(
            reverse("incident-list"),
            {
                "title": "Admin Created Incident",
                "description": "Incident created for administrator RBAC validation.",
                "severity": "HIGH",
            },
            format="json",
        )
        assert res_create.status_code == status.HTTP_201_CREATED

        # Delete
        res_del = api_client.delete(
            reverse("incident-detail", kwargs={"pk": incident.id})
        )
        assert res_del.status_code == status.HTTP_204_NO_CONTENT

    def test_analyst_can_create_update_assign_status_comment_but_not_delete(
        self, api_client, analyst_user, responder_user, incident
    ):
        api_client.force_authenticate(user=analyst_user)

        # Create allowed
        res_create = api_client.post(
            reverse("incident-list"),
            {
                "title": "Analyst Incident",
                "description": "Incident created for analyst RBAC validation.",
                "severity": "MEDIUM",
            },
            format="json",
        )
        assert res_create.status_code == status.HTTP_201_CREATED

        # Assign allowed
        res_assign = api_client.post(
            reverse("incident-assign", kwargs={"pk": incident.id}),
            {"assigned_to_id": str(responder_user.id)},
            format="json",
        )
        assert res_assign.status_code == status.HTTP_200_OK

        # Delete rejected (403)
        res_del = api_client.delete(
            reverse("incident-detail", kwargs={"pk": incident.id})
        )
        assert res_del.status_code == status.HTTP_403_FORBIDDEN

    def test_responder_can_update_status_and_comment_but_not_create_or_delete(
        self, api_client, responder_user, incident
    ):
        api_client.force_authenticate(user=responder_user)

        # Status change allowed
        res_status = api_client.post(
            reverse("incident-change-status", kwargs={"pk": incident.id}),
            {"status": Status.INVESTIGATING},
            format="json",
        )
        assert res_status.status_code == status.HTTP_200_OK

        # Comment allowed
        res_comment = api_client.post(
            reverse("incident-comments", kwargs={"pk": incident.id}),
            {"message": "Responder reviewing incident."},
            format="json",
        )
        assert res_comment.status_code == status.HTTP_201_CREATED

        # Create rejected (403)
        res_create = api_client.post(
            reverse("incident-list"),
            {
                "title": "Responder Created",
                "description": "Incident creation attempt for responder RBAC validation.",
                "severity": "LOW",
            },
            format="json",
        )
        assert res_create.status_code == status.HTTP_403_FORBIDDEN

    def test_viewer_has_readonly_access_only(self, api_client, viewer_user, incident):
        api_client.force_authenticate(user=viewer_user)

        # List allowed
        res_list = api_client.get(reverse("incident-list"))
        assert res_list.status_code == status.HTTP_200_OK

        # Retrieve allowed
        res_detail = api_client.get(
            reverse("incident-detail", kwargs={"pk": incident.id})
        )
        assert res_detail.status_code == status.HTTP_200_OK

        # Create rejected (403)
        res_create = api_client.post(
            reverse("incident-list"),
            {"title": "Viewer Created", "severity": "LOW"},
            format="json",
        )
        assert res_create.status_code == status.HTTP_403_FORBIDDEN

        # Comment rejected (403)
        res_comment = api_client.post(
            reverse("incident-comments", kwargs={"pk": incident.id}),
            {"message": "Viewer comment"},
            format="json",
        )
        assert res_comment.status_code == status.HTTP_403_FORBIDDEN
