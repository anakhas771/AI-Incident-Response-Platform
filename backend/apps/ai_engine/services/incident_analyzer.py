"""
Incident Analyzer service for synthesizing security summaries, root cause analysis,
risk scores, and remediation recommendations.
"""

import json
import logging
import re
from typing import Any, Dict, List, Optional

from apps.ai_engine.models import AIIncidentAnalysis
from apps.ai_engine.prompts.incident_prompts import build_incident_analysis_prompt
from apps.ai_engine.prompts.system_prompts import INCIDENT_ANALYZER_SYSTEM_PROMPT
from apps.ai_engine.services.llm_client import LLMClient
from apps.incidents.models import Incident
from apps.knowledge.services.dtos.prompt_dto import PromptContextDTO
from apps.knowledge.services.llm.base import BaseLLMGateway
from apps.knowledge.services.llm.factory import get_llm_gateway

logger = logging.getLogger(__name__)

_ALLOWED_SEVERITIES = {"CRITICAL", "HIGH", "MEDIUM", "LOW"}


class IncidentAnalyzer:
    """
    Service responsible for analyzing production incidents, synthesizing security
    summaries, root cause analysis, calculating risk scores, and generating
    remediation recommendations.

    The analyzer uses the existing configured LLM gateway by default. The legacy
    LLMClient remains available for backward-compatible tests/injections.
    """

    def __init__(
        self,
        llm_client: Optional[LLMClient] = None,
        llm_gateway: Optional[BaseLLMGateway] = None,
    ):
        self.llm_client = llm_client
        self.llm_gateway = llm_gateway

        if self.llm_client is None and self.llm_gateway is None:
            self.llm_gateway = get_llm_gateway()

    @staticmethod
    def _parse_json_response(content: str) -> Dict[str, Any]:
        """Parse JSON returned by the configured LLM gateway."""
        text = (content or "").strip()

        if not text:
            raise RuntimeError("Incident analysis LLM returned an empty response.")

        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
        text = re.sub(r"\s*```$", "", text)

        start = text.find("{")
        end = text.rfind("}")
        if start >= 0 and end > start:
            text = text[start : end + 1]

        try:
            payload = json.loads(text)
        except json.JSONDecodeError as exc:
            logger.error("Invalid JSON from incident-analysis LLM: %s", content[:1000])
            raise RuntimeError("Incident analysis LLM returned invalid JSON.") from exc

        if not isinstance(payload, dict):
            raise RuntimeError(
                "Incident analysis LLM returned an unexpected JSON structure."
            )

        return payload

    @staticmethod
    def calculate_risk_score(
        severity: str,
        impact: str = "",
        confidence_score: float = 0.85,
    ) -> float:
        base_scores = {
            "CRITICAL": 90.0,
            "HIGH": 75.0,
            "MEDIUM": 50.0,
            "LOW": 25.0,
        }

        score = base_scores.get(str(severity).upper(), 50.0)
        impact_lower = str(impact).lower()

        if any(
            word in impact_lower
            for word in ("outage", "data loss", "breach", "leak", "compromise")
        ):
            score = min(100.0, score + 10.0)
        elif any(word in impact_lower for word in ("minor", "low", "minimal")):
            score = max(0.0, score - 10.0)

        confidence_score = max(0.0, min(1.0, float(confidence_score)))
        score *= 0.8 + (0.2 * confidence_score)

        return round(max(0.0, min(100.0, score)), 2)

    def _generate_json(self, prompt: str) -> Dict[str, Any]:
        """Generate structured JSON through the configured LLM gateway."""
        if self.llm_client is not None:
            return self.llm_client.generate_json(
                prompt=prompt,
                system_prompt=INCIDENT_ANALYZER_SYSTEM_PROMPT,
                expected_keys=[
                    "summary",
                    "probable_root_cause",
                    "affected_components",
                    "recommended_actions",
                ],
            )

        if self.llm_gateway is None:
            raise RuntimeError("No incident-analysis LLM gateway is configured.")

        prompt_context = PromptContextDTO(
            system_prompt=INCIDENT_ANALYZER_SYSTEM_PROMPT,
            user_prompt=prompt,
            context_text="",
            history_text="",
            estimated_tokens=max(1, len(prompt) // 4),
            template_version="incident-analysis-v2",
            raw_user_message=prompt,
        )

        response = self.llm_gateway.generate(prompt_context)
        return self._parse_json_response(response.content)

    def analyze(
        self,
        title: str,
        description: str,
        logs: Optional[str] = None,
        severity: Optional[str] = None,
        impact: Optional[str] = None,
    ) -> Dict[str, Any]:
        if not isinstance(title, str) or not title.strip():
            raise ValueError("Incident title must be a non-empty string.")

        if not isinstance(description, str) or not description.strip():
            raise ValueError("Incident description must be a non-empty string.")

        prompt = build_incident_analysis_prompt(
            title=title.strip(),
            description=description.strip(),
            logs=(logs or "").strip(),
            severity=(severity or "").strip(),
            impact=(impact or "").strip(),
        )

        logger.info(
            "Analyzing incident title=%s severity=%s",
            title,
            severity,
        )

        result = self._generate_json(prompt)

        summary = str(
            result.get("summary") or result.get("security_summary") or ""
        ).strip()
        root_cause = str(
            result.get("root_cause") or result.get("probable_root_cause") or ""
        ).strip()

        if not summary:
            raise RuntimeError("Incident analysis returned no summary.")
        if not root_cause:
            raise RuntimeError("Incident analysis returned no root-cause analysis.")

        affected_raw = result.get("affected_components", [])
        if isinstance(affected_raw, list):
            affected_components = [
                str(item).strip() for item in affected_raw if str(item).strip()
            ]
        else:
            affected_components = [str(affected_raw).strip()] if affected_raw else []

        actions_raw = (
            result.get("recommendations") or result.get("recommended_actions") or []
        )
        if isinstance(actions_raw, list):
            recommendations = [
                str(item).strip() for item in actions_raw if str(item).strip()
            ]
        else:
            recommendations = [str(actions_raw).strip()] if actions_raw else []

        severity_prediction = (
            str(
                result.get("severity_prediction")
                or result.get("predicted_severity")
                or severity
                or "MEDIUM"
            )
            .strip()
            .upper()
        )
        if severity_prediction not in _ALLOWED_SEVERITIES:
            fallback = str(severity or "MEDIUM").strip().upper()
            severity_prediction = (
                fallback if fallback in _ALLOWED_SEVERITIES else "MEDIUM"
            )

        try:
            confidence_score = float(result.get("confidence_score", 0.0))
        except (TypeError, ValueError):
            confidence_score = 0.0
        confidence_score = max(0.0, min(1.0, confidence_score))

        risk_score_value = result.get("risk_score")
        if risk_score_value is not None:
            try:
                risk_score = max(0.0, min(100.0, float(risk_score_value)))
            except (TypeError, ValueError):
                risk_score = self.calculate_risk_score(
                    severity_prediction, impact or description, confidence_score
                )
        else:
            risk_score = self.calculate_risk_score(
                severity_prediction, impact or description, confidence_score
            )

        return {
            "summary": summary,
            "security_summary": summary,
            "root_cause": root_cause,
            "probable_root_cause": root_cause,
            "severity_prediction": severity_prediction,
            "risk_score": round(risk_score, 2),
            "confidence_score": round(confidence_score, 2),
            "recommendations": recommendations,
            "recommended_actions": recommendations,
            "affected_components": affected_components,
            "impact_analysis": str(
                result.get("impact_analysis")
                or result.get("impact")
                or impact
                or description
            ).strip(),
        }

    def analyze_incident(self, incident: Incident) -> AIIncidentAnalysis:
        """Analyze a Django Incident instance and persist the result."""
        logger.info("Running AI analysis for Incident ID=%s", incident.id)

        data = self.analyze(
            title=incident.title,
            description=incident.description,
            severity=str(incident.severity),
            impact=incident.description,
        )

        # RAG enrichment is deliberately handled by IncidentPipeline so the
        # incident analysis path performs the similarity lookup exactly once.
        analysis, _ = AIIncidentAnalysis.objects.update_or_create(
            incident=incident,
            defaults={
                "summary": data["summary"],
                "root_cause": data["root_cause"],
                "severity_prediction": data["severity_prediction"],
                "risk_score": data["risk_score"],
                "confidence_score": data["confidence_score"],
                "recommendations": data["recommendations"],
            },
        )

        return analysis
