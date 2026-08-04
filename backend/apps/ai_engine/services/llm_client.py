"""
Provider-agnostic LLM Client service for AI Engine.
Supports OpenAI, Anthropic, and deterministic Mock providers with retry logic,
timeout handling, input validation, and structured JSON output parsing.
"""

import json
import logging
import os
import socket
import time
import urllib.error
import urllib.request
from typing import Any, Callable, Dict, List, Optional

from apps.ai_engine.parsers import extract_json_payload
from apps.ai_engine.utils import sanitize_prompt_input

logger = logging.getLogger(__name__)


class LLMClientError(Exception):
    """Raised when an LLM service request fails after retries or fails validation."""

    pass


class LLMClient:
    """
    Provider-agnostic LLM abstraction client.
    Supports OpenAI, Anthropic, and Mock providers.
    Provides configurable retry logic, timeout handling, and structured JSON output.
    """

    SUPPORTED_PROVIDERS = {"openai", "anthropic", "mock"}

    def __init__(
        self,
        provider: Optional[str] = None,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        max_retries: int = 3,
        retry_delay: float = 1.0,
        timeout: int = 15,
        fallback_to_mock: bool = True,
    ):
        raw_provider = (provider or os.getenv("AI_PROVIDER", "mock") or "mock").lower()
        self.provider = (
            raw_provider if raw_provider in self.SUPPORTED_PROVIDERS else "mock"
        )
        self.api_key = api_key or os.getenv("AI_API_KEY", "")
        self.model = model or os.getenv("AI_MODEL", "gpt-4-turbo")
        self.max_retries = max(0, int(max_retries))
        self.retry_delay = max(0.1, float(retry_delay))
        self.timeout = max(1, int(timeout))
        self.fallback_to_mock = fallback_to_mock

        logger.info(
            "Initialized LLMClient provider=%s model=%s retries=%d timeout=%ds",
            self.provider,
            self.model,
            self.max_retries,
            self.timeout,
        )

    def generate_response(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        **kwargs: Any,
    ) -> str:
        """
        Generate a text response from the configured LLM provider with retry logic.
        """
        if not prompt or not isinstance(prompt, str) or not prompt.strip():
            logger.error("Invalid empty prompt provided to LLMClient.")
            raise LLMClientError("Prompt must be a non-empty string.")

        sanitized_prompt = sanitize_prompt_input(prompt)
        logger.debug(
            "Generating LLM response provider=%s model=%s prompt_len=%d",
            self.provider,
            self.model,
            len(sanitized_prompt),
        )

        try:
            if self.provider == "openai" and self.api_key:
                return self._execute_with_retry(
                    self._call_openai,
                    sanitized_prompt,
                    system_prompt=system_prompt,
                    **kwargs,
                )
            elif self.provider == "anthropic" and self.api_key:
                return self._execute_with_retry(
                    self._call_anthropic,
                    sanitized_prompt,
                    system_prompt=system_prompt,
                    **kwargs,
                )
            else:
                return self._call_mock(
                    sanitized_prompt, system_prompt=system_prompt, **kwargs
                )
        except Exception as exc:
            logger.exception(
                "Error generating LLM response with provider=%s: %s",
                self.provider,
                str(exc),
            )
            raise LLMClientError(f"LLM request failed: {exc}") from exc

    def generate_completion(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        **kwargs: Any,
    ) -> str:
        """
        Alias for generate_response to support legacy caller interfaces.
        """
        return self.generate_response(prompt, system_prompt=system_prompt, **kwargs)

    def generate_json(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        expected_keys: Optional[List[str]] = None,
        **kwargs: Any,
    ) -> Dict[str, Any]:
        """
        Generate a response and parse it as validated structured JSON.
        """
        response_text = self.generate_response(
            prompt=prompt,
            system_prompt=system_prompt,
            **kwargs,
        )

        try:
            data = extract_json_payload(response_text)
        except Exception as exc:
            logger.error("Failed to parse LLM response as JSON: %s", exc)
            raise LLMClientError(f"Invalid JSON returned by LLM: {exc}") from exc

        if expected_keys:
            missing_keys = [k for k in expected_keys if k not in data]
            if missing_keys:
                raise LLMClientError(
                    f"Response JSON missing required keys: {missing_keys}"
                )

        return data

    def _execute_with_retry(
        self,
        call_func: Callable[..., str],
        prompt: str,
        system_prompt: Optional[str] = None,
        **kwargs: Any,
    ) -> str:
        """
        Execute an API call function with exponential backoff retry logic and timeout handling.
        """
        last_exception: Optional[Exception] = None
        for attempt in range(1, self.max_retries + 2):
            try:
                return call_func(prompt, system_prompt=system_prompt, **kwargs)
            except (
                urllib.error.URLError,
                urllib.error.HTTPError,
                TimeoutError,
                socket.timeout,
                ConnectionError,
            ) as exc:
                last_exception = exc
                logger.warning(
                    "LLM API request attempt %d/%d failed: %s",
                    attempt,
                    self.max_retries + 1,
                    exc,
                )
                if attempt <= self.max_retries:
                    sleep_time = self.retry_delay * (2 ** (attempt - 1))
                    time.sleep(sleep_time)

        if self.fallback_to_mock:
            logger.warning(
                "All %d retry attempts exhausted for provider=%s. Falling back to mock response.",
                self.max_retries + 1,
                self.provider,
            )
            return self._call_mock(prompt, system_prompt=system_prompt, **kwargs)

        raise LLMClientError(
            f"LLM request exhausted retries ({self.max_retries}): {last_exception}"
        )

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
        Call OpenAI API using urllib HTTP request with configurable timeout.
        """
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
        with urllib.request.urlopen(req, timeout=self.timeout) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return str(data["choices"][0]["message"]["content"])

    def _call_anthropic(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        **kwargs: Any,
    ) -> str:
        """
        Call Anthropic API using urllib HTTP request with configurable timeout.
        """
        headers: dict[str, str] = {
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01",
        }
        if self.api_key:
            headers["x-api-key"] = self.api_key
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
        with urllib.request.urlopen(req, timeout=self.timeout) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return str(data["content"][0]["text"])
