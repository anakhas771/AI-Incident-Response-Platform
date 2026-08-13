"""
OpenAI API LLM gateway implementation.
"""

import logging
import time
from typing import Any, Iterator, List, Optional

import openai
import tiktoken
from openai import OpenAI
from openai.types.chat import ChatCompletionMessageParam

from apps.knowledge.services.dtos.llm_response_dto import LLMResponseDTO
from apps.knowledge.services.dtos.prompt_dto import PromptContextDTO
from apps.knowledge.services.exceptions import ErrorCode, LLMException
from apps.knowledge.services.llm.base import BaseLLMGateway
from apps.knowledge.services.llm.retry_policy import RetryPolicy

logger = logging.getLogger(__name__)


class OpenAILLMGateway(BaseLLMGateway):
    """
    OpenAI gateway implementation for production Copilot use.

    Responsibilities:
    - Build provider-specific messages.
    - Invoke OpenAI.
    - Normalize provider exceptions.
    - Estimate tokens when provider usage is unavailable.
    - Calculate model-specific cost.
    - Support non-streaming and streaming generation.
    """

    PRICING_PER_MILLION_TOKENS = {
        # Keep this mapping aligned with the model pricing configured
        # for the application. Unknown models intentionally fail closed.
        "gpt-4o": {
            "input": 2.50,
            "cached_input": 1.25,
            "output": 10.00,
        },
        "gpt-4o-mini": {
            "input": 0.15,
            "cached_input": 0.075,
            "output": 0.60,
        },
    }

    def __init__(
        self,
        api_key: str,
        model: str = "gpt-4o-mini",
        temperature: float = 0.2,
        max_tokens: int = 2048,
        timeout: int = 60,
        retry_policy: Optional[RetryPolicy] = None,
    ) -> None:
        if not api_key:
            raise ValueError("OpenAI API key is required.")

        if not model:
            raise ValueError("OpenAI model is required.")

        if not 0.0 <= temperature <= 2.0:
            raise ValueError("temperature must be between 0.0 and 2.0.")

        if max_tokens <= 0:
            raise ValueError("max_tokens must be greater than zero.")

        if timeout <= 0:
            raise ValueError("timeout must be greater than zero.")

        self.api_key = api_key
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.timeout = timeout
        self.retry_policy = retry_policy or RetryPolicy()

        self.client = OpenAI(
            api_key=self.api_key,
            timeout=float(self.timeout),
        )

    def _build_messages(
        self,
        prompt: PromptContextDTO,
    ) -> List[ChatCompletionMessageParam]:
        """
        Convert PromptContextDTO into provider-neutral chat messages.
        """
        messages: List[ChatCompletionMessageParam] = []

        if prompt.system_prompt:
            messages.append(
                {
                    "role": "system",
                    "content": prompt.system_prompt,
                }
            )

        if prompt.raw_history:
            for turn in prompt.raw_history:
                messages.append(
                    {
                        "role": turn.role,
                        "content": turn.content,
                    }
                )

        if prompt.raw_user_message:
            final_user_content = prompt.raw_user_message
            if prompt.context_text and prompt.context_text != "No relevant knowledge base documents found.":
                final_user_content = f"RETRIEVED KNOWLEDGE BASE CONTEXT:\n{prompt.context_text}\n\nCURRENT USER MESSAGE:\n{final_user_content}"
            messages.append(
                {
                    "role": "user",
                    "content": final_user_content,
                }
            )
        elif prompt.user_prompt:
            # Fallback to flattened prompt
            if prompt.context_text:
                messages.append(
                    {
                        "role": "system",
                        "content": f"Enterprise Knowledge Context:\n{prompt.context_text}",
                    }
                )
            if prompt.history_text:
                messages.append(
                    {
                        "role": "system",
                        "content": f"Previous Conversation History:\n{prompt.history_text}",
                    }
                )
            messages.append(
                {
                    "role": "user",
                    "content": prompt.user_prompt,
                }
            )

        return messages

    def _handle_api_error(self, exc: Exception) -> LLMException:
        """
        Convert provider-specific OpenAI exceptions into application exceptions.
        """
        if isinstance(exc, openai.APIConnectionError):
            return LLMException(
                "Connection to AI service failed.",
                code=ErrorCode.LLM_ERROR.value,
                status_code=502,
            )

        if isinstance(exc, openai.APITimeoutError):
            return LLMException(
                "AI service request timed out.",
                code=ErrorCode.LLM_TIMEOUT.value,
                status_code=408,
            )

        if isinstance(exc, openai.RateLimitError):
            return LLMException(
                "AI service rate limit exceeded.",
                code=ErrorCode.LLM_RATE_LIMIT.value,
                status_code=429,
            )

        if isinstance(exc, openai.BadRequestError):
            return LLMException(
                f"Invalid request to AI service: {str(exc)}",
                code=ErrorCode.VALIDATION_ERROR.value,
                status_code=400,
            )

        if isinstance(exc, openai.AuthenticationError):
            return LLMException(
                "AI service authentication failed.",
                code=ErrorCode.INTERNAL_SERVER_ERROR.value,
                status_code=502,
            )

        if isinstance(exc, openai.PermissionDeniedError):
            return LLMException(
                "AI service permission was denied.",
                code=ErrorCode.INTERNAL_SERVER_ERROR.value,
                status_code=502,
            )

        if isinstance(exc, openai.NotFoundError):
            return LLMException(
                "Configured AI model or resource was not found.",
                code=ErrorCode.VALIDATION_ERROR.value,
                status_code=400,
            )

        return LLMException(
            "AI service encountered an unexpected error.",
            code=ErrorCode.LLM_ERROR.value,
            status_code=500,
        )

    def _estimate_tokens(self, text: str) -> int:
        """
        Estimate token count using tiktoken.

        This is an approximation and should not be treated as exact
        provider billing data.
        """
        if not text:
            return 0

        try:
            encoding = tiktoken.encoding_for_model(self.model)
        except KeyError:
            encoding = tiktoken.get_encoding("cl100k_base")

        return len(encoding.encode(text))

    @staticmethod
    def _extract_cached_tokens(response: Any) -> int:
        """
        Extract cached input token usage when available.
        """
        usage = getattr(response, "usage", None)

        if not usage:
            return 0

        details = getattr(usage, "prompt_tokens_details", None)

        if details is None:
            return 0

        return int(getattr(details, "cached_tokens", 0) or 0)

    def generate(self, prompt: PromptContextDTO) -> LLMResponseDTO:
        """
        Generate a non-streaming response.
        """
        messages = self._build_messages(prompt)
        start_time = time.perf_counter()

        def _call_api() -> Any:
            try:
                return self.client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    temperature=self.temperature,
                    max_tokens=self.max_tokens,
                )
            except Exception as exc:
                raise self._handle_api_error(exc) from exc

        response = self.retry_policy.execute(_call_api)

        latency_ms = (time.perf_counter() - start_time) * 1000.0

        if not response.choices:
            raise LLMException(
                "AI service returned no completion choices.",
                code=ErrorCode.LLM_ERROR.value,
                status_code=502,
            )

        content = response.choices[0].message.content or ""

        usage = getattr(response, "usage", None)

        if usage:
            prompt_tokens = int(usage.prompt_tokens or 0)
            completion_tokens = int(usage.completion_tokens or 0)
            total_tokens = int(usage.total_tokens or 0)
            cached_tokens = self._extract_cached_tokens(response)
            usage_source = "provider"
        else:
            prompt_tokens = sum(
                self._estimate_tokens(str(message["content"])) for message in messages
            )
            completion_tokens = self._estimate_tokens(content)
            total_tokens = prompt_tokens + completion_tokens
            cached_tokens = 0
            usage_source = "estimated"

        estimated_cost = self.calculate_cost(
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            cached_tokens=cached_tokens,
        )

        finish_reason = response.choices[0].finish_reason or "stop"

        return LLMResponseDTO(
            content=content,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
            latency_ms=latency_ms,
            finish_reason=finish_reason,
            model=self.model,
            estimated_cost_usd=estimated_cost,
            metadata={
                "provider": "openai",
                "usage_source": usage_source,
                "cached_tokens": cached_tokens,
                "template_version": prompt.template_version,
            },
        )

    def stream(self, prompt: PromptContextDTO) -> Iterator[str]:
        """
        Stream generated text.

        Retry policy covers stream initialization only.
        Once iteration has started, failures are propagated because
        retrying mid-stream could duplicate already-delivered tokens.
        """
        messages = self._build_messages(prompt)

        def _create_stream() -> Any:
            try:
                return self.client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    temperature=self.temperature,
                    max_tokens=self.max_tokens,
                    stream=True,
                    stream_options={"include_usage": True},
                )
            except Exception as exc:
                raise self._handle_api_error(exc) from exc

        stream_response = self.retry_policy.execute(_create_stream)

        try:
            for chunk in stream_response:
                if not chunk.choices:
                    continue

                delta_content = chunk.choices[0].delta.content

                if delta_content:
                    yield delta_content

        except Exception as exc:
            logger.error(
                "OpenAI stream iteration failed. model=%s error_type=%s",
                self.model,
                type(exc).__name__,
                exc_info=True,
            )
            raise self._handle_api_error(exc) from exc

    def calculate_cost(
        self,
        prompt_tokens: int,
        completion_tokens: int,
        embedding_tokens: int = 0,
        cached_tokens: int = 0,
    ) -> float:
        """
        Calculate estimated USD cost using configured model pricing.

        Unknown models fail closed rather than silently using another
        model's pricing.
        """
        del embedding_tokens

        pricing = self.PRICING_PER_MILLION_TOKENS.get(self.model)

        if pricing is None:
            raise ValueError(
                f"No pricing configuration available for model '{self.model}'. "
                "Update PRICING_PER_MILLION_TOKENS before enabling this model."
            )

        prompt_tokens = max(0, prompt_tokens)
        completion_tokens = max(0, completion_tokens)
        cached_tokens = max(0, min(cached_tokens, prompt_tokens))

        uncached_tokens = prompt_tokens - cached_tokens

        cost = (
            (uncached_tokens / 1_000_000.0) * pricing["input"]
            + (cached_tokens / 1_000_000.0) * pricing["cached_input"]
            + (completion_tokens / 1_000_000.0) * pricing["output"]
        )

        return round(cost, 8)
