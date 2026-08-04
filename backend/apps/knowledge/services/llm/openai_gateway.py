"""
OpenAI API LLM gateway stub implementation (to be fully integrated in future tasks).
"""

from typing import Iterator, Optional

from apps.knowledge.services.dtos.llm_response_dto import LLMResponseDTO
from apps.knowledge.services.dtos.prompt_dto import PromptContextDTO
from apps.knowledge.services.llm.base import BaseLLMGateway
from apps.knowledge.services.llm.retry_policy import RetryPolicy


class OpenAILLMGateway(BaseLLMGateway):
    """
    OpenAI Gateway stub.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = "gpt-4",
        retry_policy: Optional[RetryPolicy] = None,
    ) -> None:
        self.api_key = api_key
        self.model = model
        self.retry_policy = retry_policy or RetryPolicy()

    def generate(self, prompt: PromptContextDTO) -> LLMResponseDTO:
        raise NotImplementedError("OpenAILLMGateway is not fully integrated yet.")

    def stream(self, prompt: PromptContextDTO) -> Iterator[str]:
        raise NotImplementedError("OpenAILLMGateway is not fully integrated yet.")
