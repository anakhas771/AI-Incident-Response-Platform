"""
Tests for LLM Gateways, Factory, and LLMResponseDTO validation.
"""

from unittest.mock import MagicMock, patch

import pytest
from django.core.exceptions import ImproperlyConfigured

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


def test_openai_gateway_generate():
    prompt = PromptContextDTO(
        system_prompt="sys",
        user_prompt="usr",
        context_text="context",
        history_text="history",
        estimated_tokens=10,
        template_version="v1",
    )
    gateway = OpenAILLMGateway(api_key="test-key")

    with patch.object(gateway, "client") as mock_client:
        mock_response = MagicMock()
        mock_response.choices = [
            MagicMock(message=MagicMock(content="real response"), finish_reason="stop")
        ]
        mock_response.usage = MagicMock(
            prompt_tokens=10, completion_tokens=5, total_tokens=15
        )
        mock_client.chat.completions.create.return_value = mock_response

        response = gateway.generate(prompt)
        assert response.content == "real response"
        assert response.prompt_tokens == 10
        assert response.finish_reason == "stop"
        assert response.model == gateway.model


def test_openai_gateway_stream():
    prompt = PromptContextDTO(
        system_prompt="sys",
        user_prompt="usr",
        context_text="context",
        history_text="history",
        estimated_tokens=10,
        template_version="v1",
    )
    gateway = OpenAILLMGateway(api_key="test-key")

    with patch.object(gateway, "client") as mock_client:
        mock_chunk1 = MagicMock()
        mock_chunk1.choices = [MagicMock(delta=MagicMock(content="hello "))]
        mock_chunk2 = MagicMock()
        mock_chunk2.choices = [MagicMock(delta=MagicMock(content="world"))]
        mock_client.chat.completions.create.return_value = [mock_chunk1, mock_chunk2]

        chunks = list(gateway.stream(prompt))
        assert chunks == ["hello ", "world"]


def test_gateway_factory(settings):
    # Test fallback default provider
    settings.COPILOT_LLM_CONFIG = {"PROVIDER": "mock"}
    gateway = get_llm_gateway()
    assert isinstance(gateway, MockLLMGateway)

    # Test explicit openai provider
    settings.COPILOT_LLM_CONFIG = {"PROVIDER": "openai", "API_KEY": "test-key"}
    gateway_openai = get_llm_gateway()
    assert isinstance(gateway_openai, OpenAILLMGateway)

    # Test missing API key for openai
    settings.COPILOT_LLM_CONFIG = {"PROVIDER": "openai", "API_KEY": ""}
    with pytest.raises(ImproperlyConfigured):
        get_llm_gateway()

    # Test unknown provider
    settings.COPILOT_LLM_CONFIG = {"PROVIDER": "unknown"}
    with pytest.raises(ImproperlyConfigured):
        get_llm_gateway()
