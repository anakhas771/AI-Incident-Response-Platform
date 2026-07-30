import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import Organization, Role
from apps.incidents.models import Severity
from apps.incidents.services import IncidentService

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def org_alpha(db):
    return Organization.objects.create(name="Org Alpha", slug="org-alpha")


@pytest.fixture
def org_beta(db):
    return Organization.objects.create(name="Org Beta", slug="org-beta")


@pytest.fixture
def user_alpha(db, org_alpha):
    return User.objects.create_user(
        email="analyst@alpha.com",
        password="Password123!",
        role=Role.ANALYST,
        organization=org_alpha,
    )


@pytest.fixture
def user_beta(db, org_beta):
    return User.objects.create_user(
        email="analyst@beta.com",
        password="Password123!",
        role=Role.ANALYST,
        organization=org_beta,
    )


@pytest.fixture
def incident_alpha(db, org_alpha, user_alpha):
    return IncidentService.create_incident(
        user=user_alpha,
        organization=org_alpha,
        data={"title": "Alpha Confidential Incident", "severity": Severity.HIGH},
    )


@pytest.mark.django_db
class TestOrganizationIsolation:
    def test_user_cannot_list_incidents_from_another_org(
        self, api_client, user_beta, incident_alpha
    ):
        api_client.force_authenticate(user=user_beta)
        url = reverse("incident-list")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 0
        assert len(response.data["results"]) == 0

    def test_user_cannot_retrieve_incident_from_another_org(
        self, api_client, user_beta, incident_alpha
    ):
        api_client.force_authenticate(user=user_beta)
        url = reverse("incident-detail", kwargs={"pk": incident_alpha.id})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_user_cannot_update_or_delete_incident_from_another_org(
        self, api_client, user_beta, incident_alpha
    ):
        api_client.force_authenticate(user=user_beta)
        url = reverse("incident-detail", kwargs={"pk": incident_alpha.id})

        # Update attempt
        res_patch = api_client.patch(url, {"title": "Hacked Title"}, format="json")
        assert res_patch.status_code == status.HTTP_404_NOT_FOUND

        # Delete attempt
        res_del = api_client.delete(url)
        assert res_del.status_code in [
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND,
        ]

    def test_user_cannot_assign_incident_to_user_from_another_org(
        self, api_client, user_alpha, user_beta, incident_alpha
    ):
        api_client.force_authenticate(user=user_alpha)
        url = reverse("incident-assign", kwargs={"pk": incident_alpha.id})
        payload = {"assigned_to_id": str(user_beta.id)}
        response = api_client.post(url, payload, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_user_cannot_comment_on_incident_from_another_org(
        self, api_client, user_beta, incident_alpha
    ):
        api_client.force_authenticate(user=user_beta)
        url = reverse("incident-comments", kwargs={"pk": incident_alpha.id})
        payload = {"message": "Cross-org comment attempt"}
        response = api_client.post(url, payload, format="json")

        assert response.status_code == status.HTTP_404_NOT_FOUND
