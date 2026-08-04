"""
Celery asynchronous tasks for AI Engine incident triage and analysis.
Includes retry policy, Redis queue routing, batch processing, and automatic discovery of pending incidents.
"""

import logging
from typing import Any, Dict, List

from celery import shared_task
from celery.exceptions import MaxRetriesExceededError
from django.db import transaction
from django.db.models import Q

from apps.ai_engine.models import AnalysisStatus, IncidentAnalysis
from apps.ai_engine.services.incident_pipeline import IncidentPipeline
from apps.ai_engine.services.severity_predictor import SeverityPredictor
from apps.incidents.models import Incident

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    name="ai_engine.analyze_incident_task",
    queue="ai_tasks",
    max_retries=3,
    default_retry_delay=60,
    acks_late=True,
    reject_on_worker_lost=True,
)
def analyze_incident_task(self, incident_id: str) -> Dict[str, Any]:
    """
    Asynchronous Celery task that fetches an Incident, transitions status to
    PROCESSING, invokes the AI IncidentPipeline, stores generated analysis results,
    and marks the status COMPLETED or FAILED. Includes exponential backoff retry policy.
    """
    logger.info("Starting asynchronous AI analysis for incident_id=%s", incident_id)
    try:
        incident = Incident.objects.get(id=incident_id)
    except Incident.DoesNotExist:
        logger.error("Incident ID=%s not found for AI analysis task.", incident_id)
        return {
            "incident_id": str(incident_id),
            "status": "failed",
            "error": "Incident not found",
        }

    with transaction.atomic():
        analysis, created = IncidentAnalysis.objects.get_or_create(
            incident=incident,
            defaults={"status": AnalysisStatus.PROCESSING},
        )
        called_directly = getattr(self.request, "called_directly", False)
        if (
            not created
            and analysis.status == AnalysisStatus.COMPLETED
            and not called_directly
        ):
            logger.info(
                "Incident ID=%s is already COMPLETED; skipping duplicate analysis task.",
                incident_id,
            )
            return {
                "incident_id": str(incident.id),
                "status": AnalysisStatus.COMPLETED.value,
                "severity_prediction": analysis.severity_prediction,
                "risk_score": analysis.risk_score,
                "category": analysis.incident_category,
                "root_cause": analysis.root_cause_analysis,
                "impact": analysis.impact_analysis,
                "recommendations": analysis.recommended_actions,
            }

        if analysis.status != AnalysisStatus.PROCESSING:
            analysis.status = AnalysisStatus.PROCESSING
            analysis.save(update_fields=["status", "updated_at"])

    try:
        pipeline = IncidentPipeline()
        result = pipeline.process_incident(incident)

        with transaction.atomic():
            analysis.severity_prediction = result.get("severity_prediction", "MEDIUM")
            analysis.risk_score = result.get("risk_score", 0.0)
            analysis.incident_category = result.get("incident_category", "Other")
            analysis.root_cause_analysis = result.get("root_cause_analysis", "")
            analysis.impact_analysis = result.get("impact_analysis", "")
            analysis.recommended_actions = result.get("recommended_actions", [])
            analysis.confidence_score = result.get("confidence_score", 0.0)
            analysis.summary = result.get("summary", "")
            analysis.status = AnalysisStatus.COMPLETED
            analysis.save()

        logger.info(
            "Successfully completed AI analysis for incident_id=%s [severity=%s, risk_score=%s]",
            incident_id,
            analysis.severity_prediction,
            analysis.risk_score,
        )
        return {
            "incident_id": str(incident.id),
            "status": AnalysisStatus.COMPLETED.value,
            "severity_prediction": analysis.severity_prediction,
            "risk_score": analysis.risk_score,
            "category": analysis.incident_category,
            "root_cause": analysis.root_cause_analysis,
            "impact": analysis.impact_analysis,
            "recommendations": analysis.recommended_actions,
        }
    except Exception as exc:
        retries = getattr(self.request, "retries", 0)
        called_directly = getattr(self.request, "called_directly", False)

        logger.warning(
            "AI analysis task attempt %d/%d failed for incident_id=%s: %s",
            retries + 1,
            self.max_retries + 1,
            incident_id,
            str(exc),
        )

        if not called_directly and retries < self.max_retries:
            try:
                countdown = int(self.default_retry_delay * (2**retries))
                logger.info(
                    "Retrying AI analysis task for incident_id=%s in %ds (attempt %d/%d)",
                    incident_id,
                    countdown,
                    retries + 1,
                    self.max_retries,
                )
                return self.retry(exc=exc, countdown=countdown)
            except self.MaxRetriesExceededError:
                pass
            except Exception as retry_exc:
                if retry_exc.__class__.__name__ == "Retry":
                    raise

        with transaction.atomic():
            analysis.status = AnalysisStatus.FAILED
            analysis.save(update_fields=["status", "updated_at"])
        return {
            "incident_id": str(incident.id),
            "status": AnalysisStatus.FAILED.value,
            "error": str(exc),
        }


@shared_task(
    bind=True,
    name="ai_engine.batch_analyze_incidents_task",
    queue="ai_tasks",
    acks_late=True,
)
def batch_analyze_incidents_task(self, incident_ids: List[str]) -> Dict[str, Any]:
    """
    Asynchronously dispatch analyze_incident_task for a batch of incident IDs.
    """
    if not isinstance(incident_ids, list):
        return {
            "status": "failed",
            "error": "incident_ids must be a list of strings",
        }

    dispatched_ids = []
    for inc_id in incident_ids:
        try:
            analyze_incident_task.delay(str(inc_id))
            dispatched_ids.append(str(inc_id))
        except Exception as exc:
            logger.error(
                "Failed to dispatch analysis task for incident_id=%s: %s", inc_id, exc
            )

    logger.info(
        "Batch analyze dispatched %d incident analysis tasks.", len(dispatched_ids)
    )
    return {
        "status": "dispatched",
        "total_requested": len(incident_ids),
        "dispatched_count": len(dispatched_ids),
        "incident_ids": dispatched_ids,
    }


@shared_task(
    bind=True,
    name="ai_engine.auto_analyze_pending_incidents_task",
    queue="ai_tasks",
    acks_late=True,
)
def auto_analyze_pending_incidents_task(self, limit: int = 50) -> Dict[str, Any]:
    """
    Periodic Celery task that identifies up to `limit` unanalyzed incidents
    or failed analyses and automatically dispatches analyze_incident_task for each.
    """
    pending_incidents = (
        Incident.objects.filter(
            Q(ai_analysis__isnull=True) | Q(ai_analysis__status=AnalysisStatus.FAILED)
        )
        .order_by("-created_at")
        .distinct()[:limit]
    )

    dispatched_ids = []
    for inc in pending_incidents:
        try:
            analyze_incident_task.delay(str(inc.id))
            dispatched_ids.append(str(inc.id))
        except Exception as exc:
            logger.error(
                "Failed to dispatch automatic analysis task for incident_id=%s: %s",
                inc.id,
                exc,
            )

    logger.info(
        "Auto-analyze discovered and dispatched %d pending incident tasks.",
        len(dispatched_ids),
    )
    return {
        "status": "dispatched",
        "pending_count": len(dispatched_ids),
        "incident_ids": dispatched_ids,
    }


@shared_task(
    bind=True,
    name="ai_engine.reanalyze_incident_task",
    queue="ai_tasks",
    max_retries=3,
    default_retry_delay=60,
    acks_late=True,
    reject_on_worker_lost=True,
)
def reanalyze_incident_task(self, incident_id: str) -> Dict[str, Any]:
    """
    Forces re-execution of AI analysis for an existing incident by resetting
    status to PROCESSING and bypassing completed status checks.
    """
    logger.info("Starting forced reanalysis task for incident_id=%s", incident_id)
    try:
        incident = Incident.objects.get(id=incident_id)
    except Incident.DoesNotExist:
        logger.error("Incident ID=%s not found for reanalysis task.", incident_id)
        return {
            "incident_id": str(incident_id),
            "status": "failed",
            "error": "Incident not found",
        }

    with transaction.atomic():
        analysis, _ = IncidentAnalysis.objects.get_or_create(
            incident=incident,
            defaults={"status": AnalysisStatus.PROCESSING},
        )
        analysis.status = AnalysisStatus.PROCESSING
        analysis.save(update_fields=["status", "updated_at"])

    return analyze_incident_task(str(incident.id))


@shared_task(
    bind=True,
    name="ai_engine.predict_severity_task",
    queue="ai_tasks",
    max_retries=3,
    default_retry_delay=30,
    acks_late=True,
)
def predict_severity_task(
    self,
    description: str,
    category: str = "General",
    impact: str = "Unknown",
    affected_users: int = 0,
) -> Dict[str, Any]:
    """
    Asynchronous Celery task to predict incident severity from category, impact, and description.
    """
    try:
        predictor = SeverityPredictor()
        result = predictor.predict(
            category=category,
            impact=impact,
            affected_users=affected_users,
            description=description,
        )
        logger.info(
            "Completed async severity prediction: severity=%s (confidence=%s)",
            result.get("predicted_severity"),
            result.get("confidence_score"),
        )
        return result
    except Exception as exc:
        retries = getattr(self.request, "retries", 0)
        logger.warning(
            "predict_severity_task failed (attempt %s): %s", retries + 1, exc
        )
        try:
            raise self.retry(exc=exc)
        except MaxRetriesExceededError:
            return {
                "predicted_severity": "UNKNOWN",
                "confidence_score": 0.0,
                "error": f"Prediction task failed: {exc}",
            }
