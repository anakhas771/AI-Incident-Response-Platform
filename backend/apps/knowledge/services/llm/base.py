"""
Base interface for LLM service gateways.
"""

from abc import ABC, abstractmethod
from typing import Iterator

from apps.knowledge.services.dtos.llm_response_dto import LLMResponseDTO
from apps.knowledge.services.dtos.prompt_dto import PromptContextDTO


class BaseLLMGateway(ABC):
    """
    Abstract interface that all LLM provider gateways must implement.
    """

    @abstractmethod
    def generate(self, prompt: PromptContextDTO) -> LLMResponseDTO:
        """
        Generate text completion based on a PromptContextDTO.
        """
        pass

    @abstractmethod
    def stream(self, prompt: PromptContextDTO) -> Iterator[str]:
        """
        Stream text completion based on a PromptContextDTO.
        """
        pass

    def calculate_cost(
        self,
        prompt_tokens: int,
        completion_tokens: int,
        embedding_tokens: int = 0,
        cached_tokens: int = 0,
    ) -> float:
        """
        Estimate USD cost for a query based on token usage and cache discounts.
        """
        prompt_rate = 0.003 / 1000.0
        completion_rate = 0.015 / 1000.0
        embedding_rate = 0.0001 / 1000.0
        cached_discount = 0.5

        effective_prompt_tokens = max(0, prompt_tokens - cached_tokens)
        cost = (
            (effective_prompt_tokens * prompt_rate)
            + (cached_tokens * prompt_rate * cached_discount)
            + (completion_tokens * completion_rate)
            + (embedding_tokens * embedding_rate)
        )
        return round(cost, 6)
