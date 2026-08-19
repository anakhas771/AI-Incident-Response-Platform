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
        Extract and format relevant incident domain attributes and stored evidence
        into a structured context dictionary for AI analysis.

        Legacy incidents may have an empty description while still containing
        useful timeline/comment evidence. In that case, the evidence becomes the
        analysis description instead of silently failing.
        """
        title = str(getattr(incident, "title", "") or "").strip()
        description = str(getattr(incident, "description", "") or "").strip()
        severity = str(getattr(incident, "severity", "MEDIUM") or "MEDIUM")
        category = str(getattr(incident, "category", "Other") or "Other")

        evidence_lines: List[str] = []

        for event in incident.events.order_by("created_at").values(
            "event_type",
            "message",
            "created_at",
        )[:50]:
            message = str(event.get("message") or "").strip()
            if message:
                evidence_lines.append(
                    f"[EVENT {event.get('created_at')}] "
                    f"{event.get('event_type')}: {message}"
                )

        for comment in incident.comments.order_by("created_at").values(
            "message",
            "created_at",
        )[:50]:
            message = str(comment.get("message") or "").strip()
            if message:
                evidence_lines.append(
                    f"[COMMENT {comment.get('created_at')}] {message}"
                )

        evidence = "\n".join(evidence_lines).strip()

        if not description and evidence:
            description = (
                "Primary incident evidence from the recorded timeline and analyst "
                f"context:\n{evidence}"
            )
            logger.warning(
                "Incident %s has no description; using stored evidence for AI analysis.",
                incident.id,
            )

        if not description:
            raise ValueError(
                "Incident has no description or stored evidence available for AI analysis."
            )

        return {
            "title": title,
            "description": description,
            "severity": severity,
            "impact": description,
            "category": category,
            "logs": evidence,
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

        try:
            risk_score = float(raw_result.get("risk_score", 0.0))
            risk_score = max(0.0, min(100.0, risk_score))
        except (ValueError, TypeError):
            risk_score = 0.0

        try:
            confidence_score = float(raw_result.get("confidence_score", 0.0))
            confidence_score = max(0.0, min(1.0, confidence_score))
        except (ValueError, TypeError):
            confidence_score = 0.0

        root_cause_analysis = str(
            raw_result.get("root_cause")
            or raw_result.get("probable_root_cause")
            or raw_result.get("root_cause_analysis")
            or ""
        ).strip()

        impact_analysis = str(
            raw_result.get("impact_analysis") or raw_result.get("impact") or ""
        ).strip()

        incident_category = str(
            raw_result.get("incident_category")
            or raw_result.get("category")
            or default_category
            or "Other"
        ).strip()

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
            raw_result.get("summary") or raw_result.get("security_summary") or ""
        ).strip()

        if not summary or not root_cause_analysis or not impact_analysis:
            raise ValueError("AI analysis returned incomplete structured output.")

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
            "similar_incidents": raw_result.get("similar_incidents", []),
            "previous_resolutions": raw_result.get("previous_resolutions", []),
            "knowledge_citations": raw_result.get("knowledge_citations", []),
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

        try:
            from apps.knowledge.services.similar_incident_service import (
                SimilarIncidentService,
            )

            sim_data = SimilarIncidentService().find_similar_for_incident(incident)

            raw_result["similar_incidents"] = sim_data.get("similar_incidents", [])
            raw_result["previous_resolutions"] = sim_data.get(
                "previous_resolutions", []
            )
            raw_result["knowledge_citations"] = sim_data.get("knowledge_citations", [])

            recs = (
                raw_result.get("recommendations")
                or raw_result.get("recommended_actions")
                or []
            )
            if not isinstance(recs, list):
                recs = [str(recs)]

            for action in sim_data.get("recommended_actions", []):
                if action and action not in recs:
                    recs.append(f"[Knowledge RAG] {action}")
            for res in sim_data.get("previous_resolutions", []):
                if res and res not in recs:
                    recs.append(f"[Similar Incident] {res}")

            raw_result["recommendations"] = recs
            raw_result["recommended_actions"] = recs

        except Exception as exc:
            logger.info(
                "SimilarIncidentService not available or error during RAG enrichment in pipeline: %s",
                exc,
            )

        return self.validate_result(
            raw_result,
            default_severity=context["severity"],
            default_category=context["category"],
        )

    def run(self, incident: Incident) -> Dict[str, Any]:
        return self.process_incident(incident)
