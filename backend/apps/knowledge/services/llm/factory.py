"""
Factory function to construct the configured LLM gateway.
"""

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured

from apps.knowledge.services.llm.base import BaseLLMGateway
from apps.knowledge.services.llm.mock_gateway import MockLLMGateway
from apps.knowledge.services.llm.openai_gateway import OpenAILLMGateway
from apps.knowledge.services.llm.retry_policy import RetryPolicy


def get_llm_gateway() -> BaseLLMGateway:
    """
    Resolve and return the configured BaseLLMGateway instance.
    """
    config = getattr(settings, "COPILOT_LLM_CONFIG", {})

    provider = str(config.get("PROVIDER", "mock")).strip().lower()

    if provider == "mock":
        return MockLLMGateway()

    if provider == "openai":
        api_key = config.get("API_KEY")

        if not api_key:
            raise ImproperlyConfigured(
                "COPILOT_LLM_CONFIG['API_KEY'] must be configured "
                "when the OpenAI provider is enabled."
            )

        model = str(config.get("MODEL", "gpt-4o-mini")).strip()

        return OpenAILLMGateway(
            api_key=str(api_key),
            model=model,
            temperature=float(str(config.get("TEMPERATURE", "0.2"))),
            max_tokens=int(str(config.get("MAX_TOKENS", "2048"))),
            timeout=int(str(config.get("TIMEOUT", "60"))),
            retry_policy=RetryPolicy(
                max_retries=int(str(config.get("MAX_RETRIES", "2"))),
                base_backoff=float(str(config.get("BASE_BACKOFF", "1.0"))),
                max_backoff=float(str(config.get("MAX_BACKOFF", "30.0"))),
            ),
        )

    raise ImproperlyConfigured(f"Unknown COPILOT_LLM_PROVIDER: {provider}")
