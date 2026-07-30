"""
Incident Analyzer service for synthesizing security summaries, root cause analysis,
risk scores, and remediation recommendations.
"""

import logging
from typing import Any, Dict, List, Optional

from apps.ai_engine.models import AIIncidentAnalysis
from apps.ai_engine.prompts.incident_prompts import build_incident_analysis_prompt
from apps.ai_engine.prompts.system_prompts import INCIDENT_ANALYZER_SYSTEM_PROMPT
from apps.ai_engine.services.llm_client import LLMClient
from apps.incidents.models import Incident

logger = logging.getLogger(__name__)


class IncidentAnalyzer:
    """
    Service responsible for analyzing production incidents, synthesizing security
    summaries, root cause analysis, calculating risk scores, and generating remediation
    recommendations.
    """

    def __init__(self, llm_client: Optional[LLMClient] = None):
        self.llm_client = llm_client or LLMClient()

    def calculate_risk_score(
        self,
        severity: str,
        impact: str = "",
        confidence_score: float = 0.85,
    ) -> float:
        """
        Calculate quantitative risk score (0.0 to 100.0) based on severity level,
        impact descriptors, and AI prediction confidence.
        """
        base_scores = {
            "CRITICAL": 90.0,
            "HIGH": 75.0,
            "MEDIUM": 50.0,
            "LOW": 25.0,
        }
        score = base_scores.get(str(severity).upper(), 50.0)
        impact_lower = str(impact).lower()
        if any(
            w in impact_lower
            for w in ["outage", "data loss", "breach", "leak", "compromise"]
        ):
            score = min(100.0, score + 10.0)
        elif any(w in impact_lower for w in ["minor", "low", "minimal"]):
            score = max(0.0, score - 10.0)

        # Scale slightly with confidence
        score = min(100.0, max(0.0, score * (0.8 + (0.2 * confidence_score))))
        return round(score, 2)

    def analyze(
        self,
        title: str,
        description: str,
        logs: Optional[str] = None,
        severity: Optional[str] = None,
        impact: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Analyze an incident and return a structured dictionary containing security
        summary, root cause analysis, severity prediction, risk score, and recommendations.
        """
        logger.info(
            "Analyzing incident title=%s severity=%s",
            title,
            severity,
        )

        prompt = build_incident_analysis_prompt(
            title=title,
            description=description,
            logs=logs,
            severity=severity,
            impact=impact,
        )

        result = self.llm_client.generate_json(
            prompt=prompt,
            system_prompt=INCIDENT_ANALYZER_SYSTEM_PROMPT,
        )

        summary = str(
            result.get("summary")
            or result.get("security_summary")
            or "Incident analysis completed."
        )
        root_cause = str(
            result.get("root_cause")
            or result.get("probable_root_cause")
            or "Under investigation by engineering triage."
        )

        affected_raw = result.get("affected_components", [])
        if isinstance(affected_raw, list):
            affected_components: List[str] = [str(x) for x in affected_raw]
        else:
            affected_components = [str(affected_raw)]

        actions_raw = (
            result.get("recommendations") or result.get("recommended_actions") or []
        )
        if isinstance(actions_raw, list):
            recommendations: List[str] = [str(x) for x in actions_raw]
        else:
            recommendations = [str(actions_raw)]

        # Determine severity prediction and confidence
        severity_prediction = (
            str(result.get("predicted_severity") or severity or "MEDIUM")
            .strip()
            .upper()
        )
        if severity_prediction not in {"CRITICAL", "HIGH", "MEDIUM", "LOW"}:
            severity_prediction = "MEDIUM"

        try:
            confidence_score = float(result.get("confidence_score", 0.88))
            confidence_score = max(0.0, min(1.0, confidence_score))
        except (ValueError, TypeError):
            confidence_score = 0.88

        risk_score = self.calculate_risk_score(
            severity=severity_prediction,
            impact=impact or "",
            confidence_score=confidence_score,
        )

        return {
            "summary": summary,
            "security_summary": summary,
            "root_cause": root_cause,
            "probable_root_cause": root_cause,
            "severity_prediction": severity_prediction,
            "risk_score": risk_score,
            "confidence_score": round(confidence_score, 2),
            "recommendations": recommendations,
            "recommended_actions": recommendations,
            "affected_components": affected_components,
        }

    def analyze_incident(self, incident: Incident) -> AIIncidentAnalysis:
        """
        Analyze an Incident Django model instance, generate AI security summary,
        root cause analysis, severity prediction, risk score, and recommendations,
        and persist an AIIncidentAnalysis record in the database.
        """
        logger.info("Running AI analysis for Incident ID=%s", incident.id)
        data = self.analyze(
            title=incident.title,
            description=incident.description,
            severity=str(incident.severity),
            impact=getattr(incident, "impact", ""),
        )

        analysis = AIIncidentAnalysis.objects.create(
            incident=incident,
            summary=data["summary"],
            root_cause=data["root_cause"],
            severity_prediction=data["severity_prediction"],
            risk_score=data["risk_score"],
            confidence_score=data["confidence_score"],
            recommendations=data["recommendations"],
        )
        return analysis
