"""
End-to-End integration tests for Sprint 3 AI Engine and Celery tasks.
Covers:
- Full incident triage lifecycle (API -> Celery task -> DB state -> AIAnalysis)
- Async severity prediction Celery task (predict_severity_task)
- Standalone AI Engine API endpoints (/analyze/, /predict-severity/, /recommendations/)
- RAG Recommendations integration
- Enterprise RBAC security boundary enforcement across the AI lifecycle
"""

import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import Organization, Role
from apps.ai_engine.models import AnalysisStatus, IncidentAnalysis
from apps.ai_engine.tasks import analyze_incident_task, predict_severity_task
from apps.incidents.models import Incident, Severity
from apps.incidents.services import IncidentService

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def org_enterprise(db):
    return Organization.objects.create(
        name="Enterprise Cloud Org", slug="enterprise-cloud"
    )


@pytest.fixture
def user_analyst(db, org_enterprise):
    return User.objects.create_user(
        email="analyst@enterprise-cloud.com",
        password="SecurePassword123!",
        role=Role.ANALYST,
        organization=org_enterprise,
    )


@pytest.fixture
def user_viewer(db, org_enterprise):
    return User.objects.create_user(
        email="viewer@enterprise-cloud.com",
        password="SecurePassword123!",
        role=Role.VIEWER,
        organization=org_enterprise,
    )


@pytest.fixture
def incident_prod(db, org_enterprise, user_analyst):
    return IncidentService.create_incident(
        user=user_analyst,
        organization=org_enterprise,
        data={
            "title": "Production API Gateway Outage",
            "description": "API Gateway responding with 504 Gateway Timeout across all regions.",
            "severity": Severity.CRITICAL,
        },
    )


@pytest.mark.django_db
class TestAIEngineE2EIntegration:
    def test_e2e_incident_creation_and_async_analysis_task(
        self, db, org_enterprise, user_analyst
    ):
        """
        Test that creating an incident runs the analyze_incident_task pipeline
        and populates a complete IncidentAnalysis with valid JSON schemas.
        """
        incident = Incident.objects.create(
            organization=org_enterprise,
            created_by=user_analyst,
            title="Database Connection Pool Exhaustion",
            description="PgBouncer connection limit reached; queries dropping.",
            severity=Severity.HIGH,
        )
        result = analyze_incident_task(str(incident.id))
        assert result["status"] == "completed"
        assert result["incident_id"] == str(incident.id)
        assert result["severity_prediction"] in {"CRITICAL", "HIGH", "MEDIUM", "LOW"}
        assert isinstance(result["recommendations"], list)

        analysis = IncidentAnalysis.objects.get(incident=incident)
        assert analysis.status == AnalysisStatus.COMPLETED
        assert analysis.risk_score > 0.0
        assert analysis.root_cause_analysis != ""
        assert analysis.impact_analysis != ""

    def test_e2e_predict_severity_celery_task(self, db):
        """
        Test the standalone async predict_severity_task Celery task.
        """
        result = predict_severity_task(
            description="High frequency deadlocks occurring in payment processing schema.",
            category="Database",
            impact="High impact on transaction throughput",
            affected_users=500,
        )
        assert "predicted_severity" in result
        assert result["predicted_severity"] in {
            "CRITICAL",
            "HIGH",
            "MEDIUM",
            "LOW",
            "UNKNOWN",
        }
        assert "confidence_score" in result
        assert 0.0 <= result["confidence_score"] <= 1.0

    def test_e2e_predict_severity_api_endpoint(self, api_client, user_analyst):
        """
        Test POST /api/v1/ai/predict-severity/ endpoint via APIClient.
        """
        api_client.force_authenticate(user=user_analyst)
        url = reverse("predict-severity")
        payload = {
            "category": "Infrastructure",
            "impact": "Potential session loss for active web clients.",
            "affected_users": 1500,
            "description": "Redis cache cluster usage exceeded 95 percent threshold.",
        }
        response = api_client.post(url, payload, format="json")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "predicted_severity" in data
        assert "confidence_score" in data
        assert data["predicted_severity"] in {"CRITICAL", "HIGH", "MEDIUM", "LOW"}
        assert 0.0 <= data["confidence_score"] <= 1.0

    def test_e2e_recommendation_engine_with_rag_api(self, api_client, user_analyst):
        """
        Test POST /api/v1/ai/recommendations/ endpoint with 3-tier recommendation checklist.
        """
        api_client.force_authenticate(user=user_analyst)
        url = reverse("recommendations")
        payload = {
            "title": "Kafka Broker Partition Disconnect",
            "description": "Broker node 3 unresponsive; message lag increasing exponentially.",
            "severity": "CRITICAL",
            "category": "Messaging",
            "impact": "Data pipeline ingestion delay across analytics platform.",
            "affected_users": 1500,
            "affected_components": ["Kafka Cluster", "Analytics Pipeline"],
        }
        response = api_client.post(url, payload, format="json")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "immediate_mitigation_steps" in data
        assert "investigation_checklist" in data
        assert "prevention_recommendations" in data
        assert "knowledge_citations" in data
        assert isinstance(data["immediate_mitigation_steps"], list)
        assert isinstance(data["investigation_checklist"], list)
        assert isinstance(data["prevention_recommendations"], list)

    def test_e2e_analyze_incident_api_endpoint(self, api_client, user_analyst):
        """
        Test POST /api/v1/ai/analyze/ standalone payload triage endpoint.
        """
        api_client.force_authenticate(user=user_analyst)
        url = reverse("analyze")
        payload = {
            "title": "Authentication Provider TLS Cert Expiry",
            "description": "SSO login endpoints rejecting handshake due to expired SSL cert.",
            "severity": "CRITICAL",
            "category": "Security / Auth",
            "impact": "All employees unable to access internal web tools.",
        }
        response = api_client.post(url, payload, format="json")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "summary" in data
        assert "severity_prediction" in data
        assert "risk_score" in data
        assert "recommended_actions" in data

    def test_e2e_rbac_security_boundary_across_ai_lifecycle(
        self, api_client, user_viewer, user_analyst, incident_prod
    ):
        """
        Verify RBAC boundaries: Role.VIEWER is denied on all mutation/trigger routes,
        but permitted on read-only analysis retrieval routes.
        """
        api_client.force_authenticate(user=user_viewer)

        url_analyze = reverse("analyze")
        url_predict = reverse("predict-severity")
        url_recom = reverse("recommendations")
        url_trigger_id = reverse(
            "incident-ai-analyze", kwargs={"id": str(incident_prod.id)}
        )
        url_get_analysis = reverse(
            "incident-ai-analysis", kwargs={"id": str(incident_prod.id)}
        )

        # Viewer denied on all active triage triggering requests
        payload_analyze = {
            "title": "Sample Issue Title",
            "description": "Sample Issue Description over 10 characters long.",
            "severity": "HIGH",
        }
        payload_predict = {
            "category": "Infrastructure",
            "impact": "High impact",
            "affected_users": 100,
            "description": "Sample Issue Description over 10 characters long.",
        }
        assert (
            api_client.post(url_analyze, payload_analyze, format="json").status_code
            == status.HTTP_403_FORBIDDEN
        )
        assert (
            api_client.post(url_predict, payload_predict, format="json").status_code
            == status.HTTP_403_FORBIDDEN
        )
        assert (
            api_client.post(url_recom, payload_analyze, format="json").status_code
            == status.HTTP_403_FORBIDDEN
        )
        assert api_client.post(url_trigger_id).status_code == status.HTTP_403_FORBIDDEN

        # Viewer allowed on GET analysis record
        resp_get = api_client.get(url_get_analysis)
        assert resp_get.status_code == status.HTTP_200_OK

        # Unauthenticated rejected across all
        api_client.logout()
        assert (
            api_client.get(url_get_analysis).status_code == status.HTTP_401_UNAUTHORIZED
        )
        assert (
            api_client.post(url_trigger_id).status_code == status.HTTP_401_UNAUTHORIZED
        )
