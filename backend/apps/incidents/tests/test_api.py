import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import Organization, Role
from apps.incidents.models import Category, Incident, Severity, Status
from apps.incidents.services import IncidentService

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def org(db):
    return Organization.objects.create(name="Enterprise Sec", slug="enterprise-sec")


@pytest.fixture
def admin_user(db, org):
    return User.objects.create_user(
        email="admin@enterprise.com",
        password="Password123!",
        role=Role.ADMIN,
        organization=org,
    )


@pytest.fixture
def analyst_user(db, org):
    return User.objects.create_user(
        email="analyst@enterprise.com",
        password="Password123!",
        role=Role.ANALYST,
        organization=org,
    )


@pytest.fixture
def sample_incident(db, org, analyst_user):
    return IncidentService.create_incident(
        user=analyst_user,
        organization=org,
        data={
            "title": "DDoS Attack on Edge",
            "description": "UDP flood targeting port 443.",
            "severity": Severity.CRITICAL,
            "status": Status.OPEN,
            "category": Category.NETWORK,
        },
    )


@pytest.mark.django_db
class TestIncidentAPI:
    def test_list_incidents_api(self, api_client, analyst_user, sample_incident):
        api_client.force_authenticate(user=analyst_user)
        url = reverse("incident-list")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1
        assert response.data["results"][0]["title"] == "DDoS Attack on Edge"

    def test_create_incident_api(self, api_client, analyst_user):
        api_client.force_authenticate(user=analyst_user)
        url = reverse("incident-list")
        payload = {
            "title": "Ransomware Suspected",
            "description": "Encrypted files found on host SRV-01.",
            "severity": "CRITICAL",
            "status": "OPEN",
            "category": "Security",
        }
        response = api_client.post(url, payload, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["title"] == "Ransomware Suspected"
        assert response.data["severity"] == "CRITICAL"

    def test_retrieve_incident_detail_api(self, api_client, analyst_user, sample_incident):
        api_client.force_authenticate(user=analyst_user)
        url = reverse("incident-detail", kwargs={"pk": sample_incident.id})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["id"] == str(sample_incident.id)
        assert "comments" in response.data
        assert "events" in response.data

    def test_update_incident_api(self, api_client, analyst_user, sample_incident):
        api_client.force_authenticate(user=analyst_user)
        url = reverse("incident-detail", kwargs={"pk": sample_incident.id})
        payload = {"title": "Updated DDoS Title", "severity": "HIGH"}
        response = api_client.patch(url, payload, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["title"] == "Updated DDoS Title"
        assert response.data["severity"] == "HIGH"

    def test_delete_incident_api_admin(self, api_client, admin_user, sample_incident):
        api_client.force_authenticate(user=admin_user)
        url = reverse("incident-detail", kwargs={"pk": sample_incident.id})
        response = api_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert Incident.objects.filter(id=sample_incident.id).exists() is False

    def test_assign_incident_custom_action(self, api_client, analyst_user, admin_user, sample_incident):
        api_client.force_authenticate(user=analyst_user)
        url = reverse("incident-assign", kwargs={"pk": sample_incident.id})
        payload = {"assigned_to_id": str(admin_user.id)}
        response = api_client.post(url, payload, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["assigned_to"]["id"] == str(admin_user.id)

    def test_change_status_custom_action(self, api_client, analyst_user, sample_incident):
        api_client.force_authenticate(user=analyst_user)
        url = reverse("incident-change-status", kwargs={"pk": sample_incident.id})
        payload = {"status": "INVESTIGATING"}
        response = api_client.post(url, payload, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == "INVESTIGATING"

    def test_add_and_list_comments_custom_action(self, api_client, analyst_user, sample_incident):
        api_client.force_authenticate(user=analyst_user)
        url = reverse("incident-comments", kwargs={"pk": sample_incident.id})

        # POST comment
        post_res = api_client.post(url, {"message": "Investigating logs now."}, format="json")
        assert post_res.status_code == status.HTTP_201_CREATED
        assert post_res.data["message"] == "Investigating logs now."

        # GET comments
        get_res = api_client.get(url)
        assert get_res.status_code == status.HTTP_200_OK
        assert len(get_res.data) == 1

    def test_timeline_custom_action(self, api_client, analyst_user, sample_incident):
        api_client.force_authenticate(user=analyst_user)
        url = reverse("incident-timeline", kwargs={"pk": sample_incident.id})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1
        assert response.data[0]["event_type"] == "CREATED"

    def test_incident_filtering_by_severity_and_status(self, api_client, analyst_user, org):
        IncidentService.create_incident(
            user=analyst_user,
            organization=org,
            data={"title": "High Sev", "severity": Severity.HIGH, "status": Status.OPEN},
        )
        IncidentService.create_incident(
            user=analyst_user,
            organization=org,
            data={"title": "Low Sev", "severity": Severity.LOW, "status": Status.CLOSED},
        )

        api_client.force_authenticate(user=analyst_user)
        url = reverse("incident-list") + "?severity=HIGH&status=OPEN"
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1
        assert response.data["results"][0]["title"] == "High Sev"

    def test_incident_filtering_by_search(self, api_client, analyst_user, org):
        IncidentService.create_incident(
            user=analyst_user,
            organization=org,
            data={"title": "Database Outage", "description": "Postgres service stopped."},
        )
        IncidentService.create_incident(
            user=analyst_user,
            organization=org,
            data={"title": "Email Warning", "description": "Spam filter issue."},
        )

        api_client.force_authenticate(user=analyst_user)
        url = reverse("incident-list") + "?search=Postgres"
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1
        assert response.data["results"][0]["title"] == "Database Outage"
