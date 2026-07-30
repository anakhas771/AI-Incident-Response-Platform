"""
Celery asynchronous tasks for AI Engine incident triage and analysis.
"""

import logging
from typing import Any, Dict

from celery import shared_task
from django.db import transaction

from apps.ai_engine.models import AnalysisStatus, IncidentAnalysis
from apps.ai_engine.services.incident_pipeline import IncidentPipeline
from apps.incidents.models import Incident

logger = logging.getLogger(__name__)


@shared_task(name="ai_engine.analyze_incident_task")
def analyze_incident_task(incident_id: str) -> Dict[str, Any]:
    """
    Asynchronous Celery task that fetches an Incident, transitions status to
    PROCESSING, invokes the AI IncidentPipeline, stores generated analysis results,
    and marks the status COMPLETED or FAILED.
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
        analysis, _ = IncidentAnalysis.objects.get_or_create(
            incident=incident,
            defaults={"status": AnalysisStatus.PROCESSING},
        )
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
        logger.exception(
            "AI analysis task failed for incident_id=%s: %s", incident_id, str(exc)
        )
        with transaction.atomic():
            analysis.status = AnalysisStatus.FAILED
            analysis.save(update_fields=["status", "updated_at"])
        return {
            "incident_id": str(incident.id),
            "status": AnalysisStatus.FAILED.value,
            "error": str(exc),
        }
