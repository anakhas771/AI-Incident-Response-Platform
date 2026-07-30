"""
Incident AI Pipeline service responsible for orchestrating context preparation,
invoking the AI analyzer, validating outputs, and producing structured results.
"""

import logging
from typing import Any, Dict, List, Optional

from apps.ai_engine.services.incident_analyzer import IncidentAnalyzer
from apps.incidents.models import Incident

logger = logging.getLogger(__name__)


class IncidentPipeline:
    """
    Clean orchestration layer responsible for preparing incident domain context,
    invoking the AI IncidentAnalyzer, validating response schemas, and returning
    structured analysis payloads.
    """

    def __init__(self, analyzer: Optional[IncidentAnalyzer] = None):
        self.analyzer = analyzer or IncidentAnalyzer()

    def prepare_context(self, incident: Incident) -> Dict[str, Any]:
        """
        Extract and format relevant incident domain attributes into a structured context
        dictionary for AI analysis.
        """
        title = getattr(incident, "title", "")
        description = getattr(incident, "description", "")
        severity = str(getattr(incident, "severity", "MEDIUM"))
        impact = str(getattr(incident, "impact", "") or "")
        category = str(getattr(incident, "category", "Other") or "Other")

        return {
            "title": title,
            "description": description,
            "severity": severity,
            "impact": impact,
            "category": category,
            "logs": "",
        }

    def validate_result(
        self,
        raw_result: Dict[str, Any],
        default_severity: str = "MEDIUM",
        default_category: str = "Other",
    ) -> Dict[str, Any]:
        """
        Validate AI analyzer output fields, clamp numerical bounds, and enforce
        consistent enterprise schemas.
        """
        # Validate severity prediction
        severity_prediction = (
            str(raw_result.get("severity_prediction") or default_severity)
            .strip()
            .upper()
        )
        if severity_prediction not in {"CRITICAL", "HIGH", "MEDIUM", "LOW"}:
            severity_prediction = (
                default_severity
                if default_severity in {"CRITICAL", "HIGH", "MEDIUM", "LOW"}
                else "MEDIUM"
            )

        # Validate risk score
        try:
            risk_score = float(raw_result.get("risk_score", 0.0))
            risk_score = max(0.0, min(100.0, risk_score))
        except (ValueError, TypeError):
            risk_score = 0.0

        # Validate confidence score
        try:
            confidence_score = float(raw_result.get("confidence_score", 0.0))
            confidence_score = max(0.0, min(1.0, confidence_score))
        except (ValueError, TypeError):
            confidence_score = 0.0

        # Validate textual analyses
        root_cause_analysis = str(
            raw_result.get("root_cause")
            or raw_result.get("probable_root_cause")
            or raw_result.get("root_cause_analysis")
            or "Root cause under automated evaluation."
        )

        impact_analysis = str(
            raw_result.get("impact_analysis")
            or raw_result.get("impact")
            or "Impact evaluation completed by AI Engine."
        )

        incident_category = str(
            raw_result.get("incident_category")
            or raw_result.get("category")
            or default_category
            or "Other"
        )

        # Validate recommendation list
        actions_raw = (
            raw_result.get("recommendations")
            or raw_result.get("recommended_actions")
            or []
        )
        if isinstance(actions_raw, list):
            recommended_actions: List[Any] = list(actions_raw)
        else:
            recommended_actions = [str(actions_raw)]

        summary = str(
            raw_result.get("summary")
            or raw_result.get("security_summary")
            or "Incident triage analysis completed."
        )

        return {
            "severity_prediction": severity_prediction,
            "risk_score": round(risk_score, 2),
            "incident_category": incident_category,
            "root_cause_analysis": root_cause_analysis,
            "impact_analysis": impact_analysis,
            "recommended_actions": recommended_actions,
            "confidence_score": round(confidence_score, 2),
            "summary": summary,
            "root_cause": root_cause_analysis,
            "recommendations": recommended_actions,
        }

    def process_incident(self, incident: Incident) -> Dict[str, Any]:
        """
        Execute full incident pipeline: prepare context, invoke AI analyzer,
        validate output, and return structured result dictionary.
        """
        logger.info(
            "Executing IncidentPipeline for incident_id=%s title='%s'",
            incident.id,
            getattr(incident, "title", ""),
        )
        context = self.prepare_context(incident)
        raw_result = self.analyzer.analyze(
            title=context["title"],
            description=context["description"],
            severity=context["severity"],
            impact=context["impact"],
            logs=context["logs"],
        )
        return self.validate_result(
            raw_result,
            default_severity=context["severity"],
            default_category=context["category"],
        )

    def run(self, incident: Incident) -> Dict[str, Any]:
        """
        Convenience wrapper around process_incident.
        """
        return self.process_incident(incident)
