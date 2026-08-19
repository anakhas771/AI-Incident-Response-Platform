"""
Mock LLM gateway implementation for offline testing and deterministic responses.
"""

import json
import time
from typing import Iterator, Optional

from apps.knowledge.services.dtos.llm_response_dto import LLMResponseDTO
from apps.knowledge.services.dtos.prompt_dto import PromptContextDTO
from apps.knowledge.services.llm.base import BaseLLMGateway
from apps.knowledge.services.llm.retry_policy import RetryPolicy


class MockLLMGateway(BaseLLMGateway):
    """
    Deterministic Mock LLM Gateway.
    """

    def __init__(
        self,
        mock_content: Optional[str] = None,
        retry_policy: Optional[RetryPolicy] = None,
        simulated_latency_ms: float = 5.0,
    ) -> None:
        if simulated_latency_ms < 0:
            raise ValueError("simulated_latency_ms must be >= 0.")

        self.mock_content = mock_content
        self.retry_policy = retry_policy or RetryPolicy()
        self.simulated_latency_ms = simulated_latency_ms

    def _generate_internal(
        self,
        prompt: PromptContextDTO,
    ) -> LLMResponseDTO:
        start_time = time.perf_counter()

        if self.simulated_latency_ms > 0:
            time.sleep(self.simulated_latency_ms / 1000.0)

        latency_ms = (time.perf_counter() - start_time) * 1000.0

        if prompt.template_version == "incident-analysis-v2":
            response_content = json.dumps(
                {
                    "summary": "Automated mock incident analysis summary.",
                    "probable_root_cause": (
                        "The incident was caused by a simulated operational condition "
                        "requiring investigation."
                    ),
                    "affected_components": [
                        "API Gateway",
                        "Database Cluster",
                    ],
                    "recommended_actions": [
                        "Validate the affected service configuration.",
                        "Review logs and infrastructure telemetry.",
                    ],
                }
            )
        else:
            response_content = self.mock_content or (
                "Mock response. "
                f"Verified context length: {len(prompt.context_text)} chars. "
                f"User message was: "
                f"'{prompt.user_prompt[-100:].strip()}'"
            )

        completion_tokens = max(1, len(response_content) // 4)
        prompt_tokens = max(0, prompt.estimated_tokens)
        total_tokens = prompt_tokens + completion_tokens

        cost = self.calculate_cost(
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
        )

        return LLMResponseDTO(
            content=response_content,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
            latency_ms=latency_ms,
            finish_reason="stop",
            model="mock-gpt-model",
            estimated_cost_usd=cost,
            metadata={
                "gateway": "mock",
                "provider": "mock",
                "model": "mock-gpt-model",
                "usage_source": "estimated",
                "template_version": prompt.template_version,
            },
        )

    def generate(
        self,
        prompt: PromptContextDTO,
    ) -> LLMResponseDTO:
        """
        Generate a deterministic mock response.
        """
        return self.retry_policy.execute(
            self._generate_internal,
            prompt,
        )

    def stream(
        self,
        prompt: PromptContextDTO,
    ) -> Iterator[str]:
        """
        Stream deterministic mock response chunks.
        """
        response_content = self.mock_content or (
            f"Mock response. Verified context length: {len(prompt.context_text)} chars."
        )

        words = response_content.split()

        for index, word in enumerate(words):
            yield word + (" " if index < len(words) - 1 else "")
