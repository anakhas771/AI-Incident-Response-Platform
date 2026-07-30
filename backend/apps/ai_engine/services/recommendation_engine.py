"""
Recommendation Engine service for generating mitigation, investigation, and prevention steps.
"""

import logging
from typing import Any, Dict, List, Optional

from apps.ai_engine.prompts.incident_prompts import build_recommendations_prompt
from apps.ai_engine.prompts.system_prompts import RECOMMENDATION_ENGINE_SYSTEM_PROMPT
from apps.ai_engine.services.llm_client import LLMClient

logger = logging.getLogger(__name__)


class RecommendationEngine:
    """
    Service responsible for generating immediate mitigation actions, systematic
    investigation checklists, and long-term prevention recommendations.
    """

    def __init__(self, llm_client: Optional[LLMClient] = None):
        self.llm_client = llm_client or LLMClient()

    def recommend(
        self,
        title: str,
        description: str,
        category: Optional[str] = None,
        severity: Optional[str] = None,
        affected_components: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Generate recommendations dictionary with immediate_mitigation_steps,
        investigation_checklist, and prevention_recommendations.
        """
        logger.info(
            "Generating recommendations title=%s category=%s severity=%s",
            title,
            category,
            severity,
        )

        prompt = build_recommendations_prompt(
            title=title,
            description=description,
            category=category,
            severity=severity,
            affected_components=affected_components,
        )

        result = self.llm_client.generate_json(
            prompt=prompt,
            system_prompt=RECOMMENDATION_ENGINE_SYSTEM_PROMPT,
        )

        def _ensure_list(key: str, fallback: str) -> List[str]:
            raw = result.get(key, [])
            if isinstance(raw, list):
                return [str(item) for item in raw]
            elif raw:
                return [str(raw)]
            return [fallback]

        immediate_mitigation_steps = _ensure_list(
            "immediate_mitigation_steps",
            "Isolate impacted subsystems and monitor error telemetry.",
        )
        investigation_checklist = _ensure_list(
            "investigation_checklist",
            "Verify audit logs and inspect application performance metrics.",
        )
        prevention_recommendations = _ensure_list(
            "prevention_recommendations",
            "Enhance test automation and refine alerting thresholds.",
        )

        return {
            "immediate_mitigation_steps": immediate_mitigation_steps,
            "investigation_checklist": investigation_checklist,
            "prevention_recommendations": prevention_recommendations,
        }
