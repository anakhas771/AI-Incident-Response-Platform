"""
Factory function to construct the appropriate LLM gateway instance.
"""

import os

from apps.knowledge.services.llm.base import BaseLLMGateway
from apps.knowledge.services.llm.mock_gateway import MockLLMGateway
from apps.knowledge.services.llm.openai_gateway import OpenAILLMGateway


def get_llm_gateway() -> BaseLLMGateway:
    """
    Resolve and return the configured BaseLLMGateway instance.
    """
    provider = os.getenv("COPILOT_LLM_PROVIDER", "mock").lower()
    if provider == "openai":
        return OpenAILLMGateway()
    return MockLLMGateway()
