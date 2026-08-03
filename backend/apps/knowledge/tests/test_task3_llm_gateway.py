"""
Tests for LLM Gateways, Factory, and LLMResponseDTO validation.
"""

import pytest

from apps.knowledge.services.dtos import LLMResponseDTO, PromptContextDTO
from apps.knowledge.services.llm import (
    MockLLMGateway,
    OpenAILLMGateway,
    get_llm_gateway,
)


def test_llm_response_dto_fields():
    dto = LLMResponseDTO(
        content="Incident response actions resolved.",
        prompt_tokens=100,
        completion_tokens=20,
        total_tokens=120,
        latency_ms=250.5,
        finish_reason="stop",
        model="gpt-4o",
        estimated_cost_usd=0.002,
        metadata={"temperature": 0.2},
    )
    assert dto.content == "Incident response actions resolved."
    assert dto.total_tokens == 120
    assert dto.latency_ms == 250.5
    assert dto.estimated_cost_usd == 0.002
    assert dto.metadata["temperature"] == 0.2


def test_mock_llm_gateway_completion():
    prompt = PromptContextDTO(
        system_prompt="sys",
        user_prompt="usr",
        context_text="retrieved context info",
        history_text="history info",
        estimated_tokens=50,
        template_version="v1",
    )
    gateway = MockLLMGateway()
    response = gateway.generate(prompt)

    assert isinstance(response, LLMResponseDTO)
    assert "Mock response" in response.content
    assert response.prompt_tokens == 50
    assert response.completion_tokens > 0
    assert response.finish_reason == "stop"
    assert response.model == "mock-gpt-model"


def test_mock_llm_gateway_custom_content():
    prompt = PromptContextDTO(
        system_prompt="sys",
        user_prompt="usr",
        context_text="context",
        history_text="history",
        estimated_tokens=10,
        template_version="v1",
    )
    gateway = MockLLMGateway(mock_content="Hello human")
    response = gateway.generate(prompt)
    assert response.content == "Hello human"


def test_openai_gateway_stub():
    prompt = PromptContextDTO(
        system_prompt="sys",
        user_prompt="usr",
        context_text="context",
        history_text="history",
        estimated_tokens=10,
        template_version="v1",
    )
    gateway = OpenAILLMGateway()
    with pytest.raises(NotImplementedError):
        gateway.generate(prompt)


def test_gateway_factory(monkeypatch):
    # Test fallback default provider
    monkeypatch.delenv("COPILOT_LLM_PROVIDER", raising=False)
    gateway = get_llm_gateway()
    assert isinstance(gateway, MockLLMGateway)

    # Test explicit openai provider
    monkeypatch.setenv("COPILOT_LLM_PROVIDER", "openai")
    gateway_openai = get_llm_gateway()
    assert isinstance(gateway_openai, OpenAILLMGateway)
