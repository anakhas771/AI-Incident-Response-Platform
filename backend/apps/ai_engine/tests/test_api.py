"""
API integration tests for AI Engine endpoints including organization isolation.
"""

import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import Organization, Role
from apps.ai_engine.models import AIIncidentAnalysis
from apps.incidents.models import Incident, Severity

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def org_alpha(db):
    return Organization.objects.create(name="Alpha Org", slug="alpha-org")


@pytest.fixture
def org_beta(db):
    return Organization.objects.create(name="Beta Org", slug="beta-org")


@pytest.fixture
def user_alpha(db, org_alpha):
    return User.objects.create_user(
        email="ai_user_alpha@enterprise.com",
        password="Password123!",
        role=Role.RESPONDER,
        organization=org_alpha,
    )


@pytest.fixture
def user_beta(db, org_beta):
    return User.objects.create_user(
        email="ai_user_beta@enterprise.com",
        password="Password123!",
        role=Role.RESPONDER,
        organization=org_beta,
    )


@pytest.fixture
def incident_alpha(db, org_alpha):
    return Incident.objects.create(
        organization=org_alpha,
        title="Payment Service Down",
        description="500 errors on payment API.",
        severity=Severity.CRITICAL,
    )


@pytest.mark.django_db
class TestAIEngineAPI:
    def test_analyze_unauthenticated_rejected(self, api_client):
        url = reverse("analyze")
        response = api_client.post(url, {}, format="json")
        assert response.status_code in {
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        }

    def test_analyze_authenticated_success(self, api_client, user_alpha):
        api_client.force_authenticate(user=user_alpha)
        url = reverse("analyze")
        payload = {
            "title": "Database Connection Refused",
            "description": "Primary PostgreSQL node stopped responding.",
            "severity": "CRITICAL",
            "impact": "All API endpoints failing",
        }
        response = api_client.post(url, payload, format="json")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "summary" in data
        assert "root_cause" in data
        assert "recommendations" in data

    def test_analyze_detail_incident_success(
        self, api_client, user_alpha, incident_alpha
    ):
        api_client.force_authenticate(user=user_alpha)
        url = reverse("analyze-detail", kwargs={"incident_id": str(incident_alpha.id)})
        response = api_client.post(url, format="json")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["incident"] == str(incident_alpha.id)
        assert "summary" in data
        assert "root_cause" in data
        assert "risk_score" in data
        assert AIIncidentAnalysis.objects.filter(incident=incident_alpha).count() == 1

    def test_analyze_detail_organization_isolation(
        self, api_client, user_beta, incident_alpha
    ):
        api_client.force_authenticate(user=user_beta)
        url = reverse("analyze-detail", kwargs={"incident_id": str(incident_alpha.id)})
        response = api_client.post(url, format="json")
        assert response.status_code in {
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND,
        }

    def test_retrieve_analysis_success_and_isolation(
        self, api_client, user_alpha, user_beta, incident_alpha
    ):
        # Trigger analysis
        api_client.force_authenticate(user=user_alpha)
        analyze_url = reverse(
            "analyze-detail", kwargs={"incident_id": str(incident_alpha.id)}
        )
        api_client.post(analyze_url, format="json")

        # Retrieve as same org member
        get_url = reverse(
            "analysis-detail", kwargs={"incident_id": str(incident_alpha.id)}
        )
        response = api_client.get(get_url)
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["incident"] == str(incident_alpha.id)

        # Retrieve as another org member should be forbidden/not found
        api_client.force_authenticate(user=user_beta)
        denied_response = api_client.get(get_url)
        assert denied_response.status_code in {
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND,
        }

    def test_predict_severity_authenticated_success(self, api_client, user_alpha):
        api_client.force_authenticate(user=user_alpha)
        url = reverse("predict-severity")
        payload = {
            "category": "security",
            "impact": "Potential data breach",
            "affected_users": 2500,
            "description": "Unauthorized access attempt detected.",
        }
        response = api_client.post(url, payload, format="json")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["predicted_severity"] in {"CRITICAL", "HIGH", "MEDIUM", "LOW"}
        assert 0.0 <= data["confidence_score"] <= 1.0

    def test_recommendations_authenticated_success(self, api_client, user_alpha):
        api_client.force_authenticate(user=user_alpha)
        url = reverse("recommendations")
        payload = {
            "title": "VPC Route Table Corruption",
            "description": "Subnets unable to route traffic.",
            "category": "infrastructure",
            "severity": "CRITICAL",
            "affected_components": ["VPC", "Routing"],
        }
        response = api_client.post(url, payload, format="json")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "immediate_mitigation_steps" in data
        assert "investigation_checklist" in data
        assert "prevention_recommendations" in data
