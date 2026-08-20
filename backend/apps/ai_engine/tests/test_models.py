"""
Unit tests for AIIncidentAnalysis Django model.
"""

import pytest

from apps.accounts.models import Organization
from apps.ai_engine.models import AIIncidentAnalysis
from apps.incidents.models import Incident, Severity


@pytest.fixture
def test_organization(db):
    return Organization.objects.create(name="AI Org", slug="ai-org")


@pytest.fixture
def test_incident(db, test_organization):
    return Incident.objects.create(
        organization=test_organization,
        title="DB Outage",
        description="Database connection pool exhausted.",
        severity=Severity.CRITICAL,
    )


@pytest.mark.django_db
class TestAIIncidentAnalysisModel:
    def test_create_ai_analysis(self, test_incident):
        analysis = AIIncidentAnalysis.objects.create(
            incident=test_incident,
            summary="Security summary of DB outage.",
            root_cause="Connection leak in worker thread.",
            severity_prediction="CRITICAL",
            risk_score=88.5,
            confidence_score=0.92,
            recommendations=["Increase connection limit", "Fix connection leak"],
        )
        assert analysis.id is not None
        assert analysis.incident == test_incident
        assert analysis.risk_score == 88.5
        assert analysis.confidence_score == 0.92
        assert len(analysis.recommendations) == 2
        assert str(analysis) == "AI Analysis for DB Outage (CRITICAL)"

    def test_defaults_and_ordering(self, test_incident):
        first_analysis = AIIncidentAnalysis.objects.create(
            incident=test_incident,
            summary="First",
        )
        second_analysis = AIIncidentAnalysis.objects.create(
            incident=test_incident,
            summary="Second",
        )
        assert first_analysis.risk_score == 0.0
        assert first_analysis.confidence_score == 0.0
        assert first_analysis.recommendations == []
        assert list(test_incident.ai_analyses.all()) == [
            second_analysis,
            first_analysis,
        ]


@pytest.mark.django_db
class TestIncidentAnalysisModel:
    def test_create_incident_analysis(self, test_incident):
        from apps.ai_engine.models import AnalysisStatus, IncidentAnalysis

        analysis = IncidentAnalysis.objects.get(incident=test_incident)
        analysis.status = AnalysisStatus.COMPLETED
        analysis.summary = "Test summary"
        analysis.similar_incidents = [{"id": "1", "title": "Test 1"}]
        analysis.previous_resolutions = ["Resolution 1"]
        analysis.knowledge_citations = [{"doc": "Runbook", "page": 1}]
        analysis.save()
        assert analysis.id is not None
        assert analysis.similar_incidents[0]["title"] == "Test 1"
        assert analysis.previous_resolutions[0] == "Resolution 1"
        assert analysis.knowledge_citations[0]["doc"] == "Runbook"
