"""
Unit and integration tests for Sprint 3 Epic 2:
Celery tasks, Redis queue routing, retry policy, batch analysis, automatic pending analysis,
and Django post_save signals for automatic incident analysis.
"""

from unittest.mock import patch

import pytest
from django.contrib.auth import get_user_model

from apps.accounts.models import Organization, Role
from apps.ai_engine.models import AnalysisStatus, IncidentAnalysis
from apps.ai_engine.signals import trigger_automatic_incident_analysis
from apps.ai_engine.tasks import (
    analyze_incident_task,
    auto_analyze_pending_incidents_task,
    batch_analyze_incidents_task,
    reanalyze_incident_task,
)
from apps.incidents.models import Incident, Severity

User = get_user_model()


@pytest.fixture
def org(db):
    return Organization.objects.create(name="Epic2 Org", slug="epic2-org")


@pytest.fixture
def user(db, org):
    return User.objects.create_user(
        email="epic2_user@enterprise.com",
        password="Password123!",
        role=Role.ANALYST,
        organization=org,
    )


@pytest.fixture
def sample_incident(db, org, user):
    return Incident.objects.create(
        organization=org,
        created_by=user,
        title="Epic 2 Test Incident",
        description="Testing Celery tasks and signals.",
        severity=Severity.HIGH,
    )


@pytest.mark.django_db
class TestCeleryTaskMetadataAndRouting:
    def test_analyze_incident_task_metadata(self):
        assert analyze_incident_task.name == "ai_engine.analyze_incident_task"
        assert analyze_incident_task.queue == "ai_tasks"
        assert analyze_incident_task.max_retries == 3
        assert analyze_incident_task.default_retry_delay == 60
        assert analyze_incident_task.acks_late is True

    def test_batch_analyze_task_metadata(self):
        assert (
            batch_analyze_incidents_task.name
            == "ai_engine.batch_analyze_incidents_task"
        )
        assert batch_analyze_incidents_task.queue == "ai_tasks"
        assert batch_analyze_incidents_task.acks_late is True

    def test_auto_analyze_pending_task_metadata(self):
        assert (
            auto_analyze_pending_incidents_task.name
            == "ai_engine.auto_analyze_pending_incidents_task"
        )
        assert auto_analyze_pending_incidents_task.queue == "ai_tasks"
        assert auto_analyze_pending_incidents_task.acks_late is True

    def test_reanalyze_task_metadata(self):
        assert reanalyze_incident_task.name == "ai_engine.reanalyze_incident_task"
        assert reanalyze_incident_task.queue == "ai_tasks"
        assert reanalyze_incident_task.max_retries == 3


@pytest.mark.django_db
class TestAnalyzeIncidentTaskExecution:
    def test_analyze_incident_task_not_found(self):
        res = analyze_incident_task("00000000-0000-0000-0000-000000000000")
        assert res["status"] == "failed"
        assert res["error"] == "Incident not found"

    def test_analyze_incident_task_skips_completed_when_not_direct(
        self, sample_incident
    ):
        analysis, _ = IncidentAnalysis.objects.update_or_create(
            incident=sample_incident,
            defaults={
                "status": AnalysisStatus.COMPLETED,
                "severity_prediction": "CRITICAL",
                "risk_score": 92.5,
                "summary": "Existing summary",
            },
        )
        res = analyze_incident_task.apply(args=[str(sample_incident.id)]).result
        assert res["status"] == AnalysisStatus.COMPLETED.value
        assert res["severity_prediction"] == "CRITICAL"
        assert res["risk_score"] == 92.5
        analysis.refresh_from_db()
        assert analysis.status == AnalysisStatus.COMPLETED

    def test_analyze_incident_task_retry_policy_on_failure(self, sample_incident):
        IncidentAnalysis.objects.filter(incident=sample_incident).update(
            status=AnalysisStatus.PROCESSING
        )
        with patch(
            "apps.ai_engine.services.incident_pipeline.IncidentPipeline.process_incident",
            side_effect=RuntimeError("Temporary Celery error"),
        ):
            with patch.object(
                analyze_incident_task, "retry", return_value={"status": "retrying"}
            ) as mock_retry:
                res = analyze_incident_task.apply(args=[str(sample_incident.id)]).result
                mock_retry.assert_called_once()
                assert mock_retry.call_args[1]["countdown"] == 60
                assert res == {"status": "retrying"}

    def test_reanalyze_incident_task_forces_execution(self, sample_incident):
        analysis, _ = IncidentAnalysis.objects.update_or_create(
            incident=sample_incident,
            defaults={
                "status": AnalysisStatus.COMPLETED,
                "severity_prediction": "LOW",
                "risk_score": 10.0,
            },
        )
        res = reanalyze_incident_task(str(sample_incident.id))
        assert res["status"] == AnalysisStatus.COMPLETED.value
        analysis.refresh_from_db()
        assert analysis.status == AnalysisStatus.COMPLETED


@pytest.mark.django_db
class TestBatchAndAutoAnalyzeTasks:
    def test_batch_analyze_incidents_task(self, sample_incident):
        with patch("apps.ai_engine.tasks.analyze_incident_task.delay") as mock_delay:
            res = batch_analyze_incidents_task([str(sample_incident.id)])
            assert res["status"] == "dispatched"
            assert res["dispatched_count"] == 1
            mock_delay.assert_called_once_with(str(sample_incident.id))

    def test_batch_analyze_incidents_task_invalid_input(self):
        res = batch_analyze_incidents_task("not-a-list")  # type: ignore
        assert res["status"] == "failed"

    def test_auto_analyze_pending_incidents_task(self, org, user):
        inc1 = Incident.objects.create(
            organization=org,
            created_by=user,
            title="Pending Incident 1",
            description="No analysis yet.",
            severity=Severity.HIGH,
        )
        IncidentAnalysis.objects.filter(incident=inc1).delete()

        inc2 = Incident.objects.create(
            organization=org,
            created_by=user,
            title="Pending Incident 2",
            description="Failed analysis earlier.",
            severity=Severity.MEDIUM,
        )
        IncidentAnalysis.objects.update_or_create(
            incident=inc2,
            defaults={"status": AnalysisStatus.FAILED},
        )

        with patch("apps.ai_engine.tasks.analyze_incident_task.delay") as mock_delay:
            res = auto_analyze_pending_incidents_task(limit=10)
            assert res["status"] == "dispatched"
            assert res["pending_count"] >= 2
            assert str(inc1.id) in res["incident_ids"]
            assert str(inc2.id) in res["incident_ids"]
            assert mock_delay.call_count >= 2


@pytest.mark.django_db
class TestAutomaticIncidentAnalysisSignal:
    def test_post_save_signal_triggers_analyze_task_on_create(self, org, user):
        with patch("apps.ai_engine.tasks.analyze_incident_task.delay") as mock_delay:
            inc = Incident.objects.create(
                organization=org,
                created_by=user,
                title="Signal Trigger Test",
                description="Verify post_save signal fires automatic triage.",
                severity=Severity.CRITICAL,
            )
            mock_delay.assert_called_with(str(inc.id))

    def test_post_save_signal_ignores_update(self, org, user):
        inc = Incident.objects.create(
            organization=org,
            created_by=user,
            title="Initial Title",
            description="Initial description.",
            severity=Severity.LOW,
        )
        with patch("apps.ai_engine.tasks.analyze_incident_task.delay") as mock_delay:
            inc.title = "Updated Title"
            inc.save(update_fields=["title", "updated_at"])
            mock_delay.assert_not_called()

    def test_receiver_function_direct(self, sample_incident):
        with patch("apps.ai_engine.tasks.analyze_incident_task.delay") as mock_delay:
            trigger_automatic_incident_analysis(
                sender=Incident,
                instance=sample_incident,
                created=True,
            )
            mock_delay.assert_called_once_with(str(sample_incident.id))
