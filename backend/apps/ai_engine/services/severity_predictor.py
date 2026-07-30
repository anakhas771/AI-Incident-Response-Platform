"""
Severity Predictor service for evaluating incident severity and confidence scores.
"""

import logging
from typing import Any, Dict, Optional

from apps.ai_engine.prompts.incident_prompts import (
    build_severity_prediction_prompt,
)
from apps.ai_engine.prompts.system_prompts import SEVERITY_PREDICTOR_SYSTEM_PROMPT
from apps.ai_engine.services.llm_client import LLMClient

logger = logging.getLogger(__name__)


class SeverityPredictor:
    """
    Service responsible for evaluating incident categories, impact descriptions,
    and user blast radius to predict standardized severity levels with confidence scoring.
    """

    def __init__(self, llm_client: Optional[LLMClient] = None):
        self.llm_client = llm_client or LLMClient()

    def predict(
        self,
        category: str,
        impact: str,
        affected_users: int,
        description: str,
    ) -> Dict[str, Any]:
        """
        Predict severity classification (CRITICAL, HIGH, MEDIUM, LOW) and return
        confidence score between 0.0 and 1.0.
        """
        logger.info(
            "Predicting severity category=%s affected_users=%s",
            category,
            affected_users,
        )

        prompt = build_severity_prediction_prompt(
            category=category,
            impact=impact,
            affected_users=affected_users,
            description=description,
        )

        result = self.llm_client.generate_json(
            prompt=prompt,
            system_prompt=SEVERITY_PREDICTOR_SYSTEM_PROMPT,
        )

        predicted_severity = (
            str(result.get("predicted_severity", "MEDIUM")).strip().upper()
        )
        if predicted_severity not in {"CRITICAL", "HIGH", "MEDIUM", "LOW"}:
            predicted_severity = "MEDIUM"

        try:
            confidence_score = float(result.get("confidence_score", 0.85))
            confidence_score = max(0.0, min(1.0, confidence_score))
        except (ValueError, TypeError):
            confidence_score = 0.85

        return {
            "predicted_severity": predicted_severity,
            "confidence_score": round(confidence_score, 2),
        }
