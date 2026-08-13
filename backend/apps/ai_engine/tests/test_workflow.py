"""
Unit and integration tests for Phase 5 AI Incident Response Automation Layer.
Covers workflow trigger on incident creation, Celery task execution, failure handling,
API response schemas, and organization isolation permissions.
"""

import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import Organization, Role
from apps.ai_engine.models import AnalysisStatus, IncidentAnalysis
from apps.ai_engine.services.incident_pipeline import IncidentPipeline
from apps.ai_engine.tasks import analyze_incident_task
from apps.incidents.models import Incident, Severity
from apps.incidents.services import IncidentService

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def org_alpha(db):
    return Organization.objects.create(name="Alpha Org", slug="alpha-org-p5")


@pytest.fixture
def org_beta(db):
    return Organization.objects.create(name="Beta Org", slug="beta-org-p5")


@pytest.fixture
def user_alpha(db, org_alpha):
    return User.objects.create_user(
        email="workflow_alpha@enterprise.com",
        password="Password123!",
        role=Role.ANALYST,
        organization=org_alpha,
    )


@pytest.fixture
def user_beta(db, org_beta):
    return User.objects.create_user(
        email="workflow_beta@enterprise.com",
        password="Password123!",
        role=Role.ANALYST,
        organization=org_beta,
    )


@pytest.fixture
def incident_alpha(db, org_alpha, user_alpha):
    return IncidentService.create_incident(
        user=user_alpha,
        organization=org_alpha,
        data={
            "title": "DNS Resolvers Unreachable",
            "description": "Primary DNS cluster failing with timeout errors.",
            "severity": Severity.CRITICAL,
        },
    )


@pytest.mark.django_db
class TestAIIncidentWorkflow:
    def test_ai_analysis_creation_on_incident_create(self, incident_alpha):
        """
        Verify that creating an incident automatically creates a completed IncidentAnalysis
        in eager test mode.
        """
        analysis = incident_alpha.ai_analysis
        assert analysis is not None
        assert analysis.status == AnalysisStatus.COMPLETED
        assert analysis.severity_prediction in {"CRITICAL", "HIGH", "MEDIUM", "LOW"}
        assert analysis.risk_score >= 0.0
        assert analysis.incident_category != ""
        assert analysis.root_cause_analysis != ""
        assert analysis.impact_analysis != ""
        assert isinstance(analysis.recommended_actions, list)

    def test_celery_task_execution(self, db, org_alpha, user_alpha):
        """
        Directly invoke analyze_incident_task and verify status transition and outputs.
        """
        incident = Incident.objects.create(
            organization=org_alpha,
            created_by=user_alpha,
            title="Database Latency Spike",
            description="Query latency exceeded 2000ms SLA.",
            severity=Severity.HIGH,
        )
        result = analyze_incident_task(str(incident.id))
        assert result["status"] == "completed"
        assert result["incident_id"] == str(incident.id)

        analysis = IncidentAnalysis.objects.get(incident=incident)
        assert analysis.status == AnalysisStatus.COMPLETED
        assert analysis.risk_score > 0.0

    def test_celery_task_failure_handling(self, db, org_alpha, user_alpha, monkeypatch):
        """
        Verify that exceptions during pipeline execution transition status to FAILED.
        """
        incident = Incident.objects.create(
            organization=org_alpha,
            created_by=user_alpha,
            title="Redis Cache Exhaustion",
            description="Memory usage at 100%.",
            severity=Severity.HIGH,
        )

        def mock_process_incident(*args, **kwargs):
            raise RuntimeError("LLM Service Unreachable")

        monkeypatch.setattr(IncidentPipeline, "process_incident", mock_process_incident)

        result = analyze_incident_task(str(incident.id))
        assert result["status"] == "failed"
        assert "LLM Service Unreachable" in result["error"]

        analysis = IncidentAnalysis.objects.get(incident=incident)
        assert analysis.status == AnalysisStatus.FAILED

    def test_api_get_analysis_success_and_schema(
        self, api_client, user_alpha, incident_alpha
    ):
        """
        Verify GET /api/ai/incidents/<id>/analysis/ returns exact required JSON schema.
        """
        api_client.force_authenticate(user=user_alpha)
        url = reverse("incident-ai-analysis", kwargs={"id": str(incident_alpha.id)})
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        expected_keys = {
            "id",
            "incident_id",
            "status",
            "summary",
            "severity_prediction",
            "risk_score",
            "confidence_score",
            "incident_category",
            "root_cause_analysis",
            "impact_analysis",
            "recommended_actions",
            "similar_incidents",
            "previous_resolutions",
            "knowledge_citations",
            "created_at",
            "updated_at",
            # Aliases
            "category",
            "root_cause",
            "impact",
            "recommendations",
        }
        assert expected_keys.issubset(set(data.keys()))
        assert data["incident_id"] == str(incident_alpha.id)
        assert data["status"] == AnalysisStatus.COMPLETED.value

    def test_api_post_analyze_manual_trigger(
        self, api_client, user_alpha, incident_alpha
    ):
        """
        Verify POST /api/ai/incidents/<id>/analyze/ manually triggers triage.
        """
        api_client.force_authenticate(user=user_alpha)
        url = reverse("incident-ai-analyze", kwargs={"id": str(incident_alpha.id)})
        response = api_client.post(url)
        assert response.status_code == status.HTTP_202_ACCEPTED
        data = response.json()
        assert data["message"] == "AI analysis triggered."
        assert data["incident_id"] == str(incident_alpha.id)

    def test_permission_checks_and_org_isolation(
        self, api_client, user_alpha, user_beta, incident_alpha
    ):
        """
        Verify organization isolation and unauthenticated access restrictions.
        """
        url_get = reverse("incident-ai-analysis", kwargs={"id": str(incident_alpha.id)})
        url_post = reverse("incident-ai-analyze", kwargs={"id": str(incident_alpha.id)})

        # Unauthenticated rejected
        assert api_client.get(url_get).status_code in {
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        }
        assert api_client.post(url_post).status_code in {
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        }

        # Different organization member rejected
        api_client.force_authenticate(user=user_beta)
        assert api_client.get(url_get).status_code in {
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND,
        }
        assert api_client.post(url_post).status_code in {
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND,
        }
