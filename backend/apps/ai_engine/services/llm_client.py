"""
Provider-agnostic LLM Client service for AI Engine.
"""

import json
import logging
import os
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


class LLMClientError(Exception):
    """Raised when an LLM service request fails."""

    pass


class LLMClient:
    """
    Provider-agnostic LLM abstraction client.
    Reads configuration from environment variables (AI_PROVIDER, AI_API_KEY, AI_MODEL).
    """

    def __init__(
        self,
        provider: Optional[str] = None,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
    ):
        self.provider = (provider or os.getenv("AI_PROVIDER", "mock")).lower()
        self.api_key = api_key or os.getenv("AI_API_KEY", "")
        self.model = model or os.getenv("AI_MODEL", "gpt-4-turbo")

        logger.info(
            "Initialized LLMClient with provider=%s model=%s",
            self.provider,
            self.model,
        )

    def generate_response(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        **kwargs: Any,
    ) -> str:
        """
        Generate a text response from the configured LLM provider.
        """
        if not prompt or not isinstance(prompt, str):
            logger.error("Invalid prompt provided to LLMClient.")
            raise LLMClientError("Prompt must be a non-empty string.")

        logger.debug(
            "Generating LLM response provider=%s model=%s prompt_len=%d",
            self.provider,
            self.model,
            len(prompt),
        )

        try:
            if self.provider == "openai" and self.api_key:
                return self._call_openai(prompt, system_prompt=system_prompt, **kwargs)
            elif self.provider == "anthropic" and self.api_key:
                return self._call_anthropic(
                    prompt, system_prompt=system_prompt, **kwargs
                )
            else:
                return self._call_mock(prompt, system_prompt=system_prompt, **kwargs)
        except Exception as exc:
            logger.exception(
                "Error generating LLM response with provider=%s: %s",
                self.provider,
                str(exc),
            )
            raise LLMClientError(f"LLM request failed: {exc}") from exc

    def generate_json(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        **kwargs: Any,
    ) -> Dict[str, Any]:
        """
        Generate a response and parse it as structured JSON.
        """
        response_text = self.generate_response(
            prompt=prompt,
            system_prompt=system_prompt,
            **kwargs,
        )

        cleaned_text = response_text.strip()
        if cleaned_text.startswith("```json"):
            cleaned_text = cleaned_text[len("```json") :].strip()
        if cleaned_text.startswith("```"):
            cleaned_text = cleaned_text[len("```") :].strip()
        if cleaned_text.endswith("```"):
            cleaned_text = cleaned_text[:-3].strip()

        try:
            parsed = json.loads(cleaned_text)
            if not isinstance(parsed, dict):
                raise ValueError("Parsed JSON is not a dictionary object.")
            return parsed
        except (json.JSONDecodeError, ValueError) as exc:
            logger.error("Failed to parse LLM response as JSON: %s", str(exc))
            raise LLMClientError(f"Invalid JSON returned by LLM: {exc}") from exc

    def _call_mock(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        **kwargs: Any,
    ) -> str:
        """
        Deterministic mock provider for local development, testing, and fallback.
        """
        logger.info("Using mock LLM provider response generation.")
        prompt_lower = prompt.lower()

        if (
            "evaluate the severity" in prompt_lower
            or "predicted_severity" in prompt_lower
        ):
            # Severity prediction mock response
            category = "infrastructure"
            if "category:" in prompt_lower:
                for line in prompt.splitlines():
                    if line.lower().startswith("category:"):
                        category = line.split(":", 1)[1].strip().lower()

            if (
                "critical" in prompt_lower
                or "outage" in prompt_lower
                or "data loss" in prompt_lower
            ):
                severity = "CRITICAL"
                confidence = 0.94
            elif "security" in category or "high" in prompt_lower:
                severity = "HIGH"
                confidence = 0.88
            else:
                severity = "MEDIUM"
                confidence = 0.79

            return json.dumps(
                {
                    "predicted_severity": severity,
                    "confidence_score": confidence,
                }
            )

        elif (
            "generate actionable response recommendations" in prompt_lower
            or "immediate_mitigation_steps" in prompt_lower
        ):
            # Recommendation engine mock response
            return json.dumps(
                {
                    "immediate_mitigation_steps": [
                        "Isolate affected services from public routing endpoints.",
                        "Inspect system metrics and enable verbose diagnostic logging.",
                    ],
                    "investigation_checklist": [
                        "Review application audit logs around the incident timestamp.",
                        "Check infrastructure CPU, memory, and network saturation.",
                    ],
                    "prevention_recommendations": [
                        "Implement automated alerting for abnormal latency spikes.",
                        "Add circuit breaker patterns to prevent cascading failures.",
                    ],
                }
            )

        else:
            # Incident analysis mock response
            title_line = "Production Incident"
            for line in prompt.splitlines():
                if line.lower().startswith("title:"):
                    title_line = line.split(":", 1)[1].strip()
                    break

            return json.dumps(
                {
                    "summary": f"Automated AI summary for incident: {title_line}. Analysis indicates anomalous operational metrics requiring remediation.",
                    "probable_root_cause": "Resource exhaustion or configuration mismatch in upstream dependencies under high concurrency.",
                    "affected_components": [
                        "API Gateway",
                        "Database Cluster",
                    ],
                    "recommended_actions": [
                        "Scale horizontal pod replicas to absorb incoming request bursts.",
                        "Audit recent deployment manifests and configuration changes.",
                    ],
                }
            )

    def _call_openai(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        **kwargs: Any,
    ) -> str:
        """
        Call OpenAI API using urllib HTTP request to avoid hard dependency errors if sdk missing.
        """
        import urllib.request

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": kwargs.get("temperature", 0.3),
        }

        req = urllib.request.Request(
            "https://api.openai.com/v1/chat/completions",
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return data["choices"][0]["message"]["content"]
        except Exception as exc:
            logger.warning(
                "OpenAI API call failed, falling back to mock response: %s",
                str(exc),
            )
            return self._call_mock(prompt, system_prompt=system_prompt, **kwargs)

    def _call_anthropic(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        **kwargs: Any,
    ) -> str:
        """
        Call Anthropic API using urllib HTTP request.
        """
        import urllib.request

        headers = {
            "Content-Type": "application/json",
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
        }
        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": kwargs.get("max_tokens", 1024),
        }
        if system_prompt:
            payload["system"] = system_prompt

        req = urllib.request.Request(
            "https://api.anthropic.com/v1/messages",
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return data["content"][0]["text"]
        except Exception as exc:
            logger.warning(
                "Anthropic API call failed, falling back to mock response: %s",
                str(exc),
            )
            return self._call_mock(prompt, system_prompt=system_prompt, **kwargs)
