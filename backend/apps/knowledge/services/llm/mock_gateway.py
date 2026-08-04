"""
Mock LLM gateway implementation for offline testing and deterministic responses.
"""

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
    ) -> None:
        self.mock_content = mock_content
        self.retry_policy = retry_policy or RetryPolicy()

    def _generate_internal(self, prompt: PromptContextDTO) -> LLMResponseDTO:
        start_time = time.time()
        # Minimal sleep to simulate API roundtrip
        time.sleep(0.005)
        latency = (time.time() - start_time) * 1000.0

        response_content = (
            self.mock_content
            or f"Mock response. Verified context length: {len(prompt.context_text)} chars. User message was: '{prompt.user_prompt[-100:].strip()}'"
        )

        completion_tokens = len(response_content) // 4
        cost = self.calculate_cost(
            prompt_tokens=prompt.estimated_tokens,
            completion_tokens=completion_tokens,
        )

        return LLMResponseDTO(
            content=response_content,
            prompt_tokens=prompt.estimated_tokens,
            completion_tokens=completion_tokens,
            total_tokens=prompt.estimated_tokens + completion_tokens,
            latency_ms=latency,
            finish_reason="stop",
            model="mock-gpt-model",
            estimated_cost_usd=cost,
            metadata={
                "gateway": "mock",
                "provider": "mock",
                "model": "mock-gpt-model",
            },
        )

    def generate(self, prompt: PromptContextDTO) -> LLMResponseDTO:
        return self.retry_policy.execute(self._generate_internal, prompt)

    def stream(self, prompt: PromptContextDTO) -> Iterator[str]:
        """
        Stub stream implementation yielding chunks.
        """
        response_content = (
            self.mock_content
            or f"Mock response. Verified context length: {len(prompt.context_text)} chars."
        )
        words = response_content.split(" ")
        for i, word in enumerate(words):
            if i < len(words) - 1:
                yield word + " "
            else:
                yield word
