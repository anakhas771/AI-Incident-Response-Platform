"""
Ollama local LLM gateway implementation.

Provides an interface to a locally running Ollama server via its native /api/chat endpoint.
"""

import json
import logging
import time
from typing import Any, Iterator, List, Optional

import requests

from apps.knowledge.services.dtos.llm_response_dto import LLMResponseDTO
from apps.knowledge.services.dtos.prompt_dto import PromptContextDTO
from apps.knowledge.services.exceptions import ErrorCode, LLMException
from apps.knowledge.services.llm.base import BaseLLMGateway
from apps.knowledge.services.llm.retry_policy import RetryPolicy

logger = logging.getLogger(__name__)


class OllamaLLMGateway(BaseLLMGateway):
    """Local Ollama LLM gateway."""

    def __init__(
        self,
        base_url: str = "http://host.docker.internal:11434/v1",
        model: str = "qwen3:4b",
        temperature: float = 0.2,
        max_tokens: int = 768,
        timeout: int = 120,
        retry_policy: Optional[RetryPolicy] = None,
    ) -> None:
        if not base_url:
            raise ValueError("Ollama base URL is required.")
        if not model:
            raise ValueError("Ollama model is required.")
        if not 0.0 <= temperature <= 2.0:
            raise ValueError("temperature must be between 0.0 and 2.0.")
        if max_tokens <= 0:
            raise ValueError("max_tokens must be greater than zero.")
        if timeout <= 0:
            raise ValueError("timeout must be greater than zero.")

        self.base_url = base_url.replace("/v1", "").rstrip("/")
        self.model = model
        self.provider = "ollama"
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.timeout = timeout
        self.retry_policy = retry_policy or RetryPolicy()
        self.session = requests.Session()

    def _build_messages(self, prompt: PromptContextDTO) -> List[dict]:
        messages: List[dict] = []
        if prompt.system_prompt:
            messages.append({"role": "system", "content": prompt.system_prompt})
        if prompt.raw_history:
            for turn in prompt.raw_history:
                messages.append({"role": turn.role, "content": turn.content})
        if prompt.raw_user_message:
            final_user_content = prompt.raw_user_message
            if (
                prompt.context_text
                and prompt.context_text != "No relevant knowledge base documents found."
            ):
                final_user_content = (
                    "RETRIEVED KNOWLEDGE BASE CONTEXT:\n"
                    f"{prompt.context_text}\n\nCURRENT USER MESSAGE:\n"
                    f"{final_user_content}"
                )
            messages.append({"role": "user", "content": final_user_content})
        return messages

    def _handle_api_error(self, exc: Exception) -> LLMException:
        logger.exception("Ollama request failed", exc_info=exc)
        return LLMException(
            "Local AI service request failed.",
            code=ErrorCode.LLM_ERROR.value,
            status_code=502,
        )

    @staticmethod
    def _clean_content(text: str) -> str:
        if not text:
            return ""
        text = str(text).strip()
        if "</think>" in text:
            text = text.split("</think>", 1)[1]
        elif "<think>" in text:
            text = text.split("<think>", 1)[0]
        return text.strip()

    def generate(self, prompt: PromptContextDTO) -> LLMResponseDTO:
        messages = self._build_messages(prompt)
        start_time = time.perf_counter()
        payload = {
            "model": self.model,
            "messages": messages,
            "stream": False,
            "think": False,
            "keep_alive": "30m",
            "options": {
                "temperature": self.temperature,
                "num_predict": self.max_tokens,
                "think": False,
            },
        }

        def _call_api() -> Any:
            try:
                response = self.session.post(
                    f"{self.base_url}/api/chat", json=payload, timeout=self.timeout
                )
                response.raise_for_status()
                return response.json()
            except Exception as exc:
                raise self._handle_api_error(exc) from exc

        response_data = self.retry_policy.execute(_call_api)
        latency_ms = (time.perf_counter() - start_time) * 1000.0

        if not response_data or "message" not in response_data:
            raise LLMException(
                "Local AI service returned no completion choices.",
                code=ErrorCode.LLM_ERROR.value,
                status_code=502,
            )

        content = self._clean_content(
            response_data.get("message", {}).get("content", "")
        )
        prompt_tokens = response_data.get("prompt_eval_count", 0)
        completion_tokens = response_data.get("eval_count", 0)
        total_tokens = prompt_tokens + completion_tokens

        return LLMResponseDTO(
            content=content,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
            latency_ms=latency_ms,
            finish_reason=response_data.get("done_reason", "stop"),
            model=self.model,
            estimated_cost_usd=0.0,
            metadata={
                "provider": "ollama",
                "usage_source": "ollama",
                "local": True,
                "base_url": self.base_url,
                "template_version": prompt.template_version,
            },
        )

    def stream(self, prompt: PromptContextDTO) -> Iterator[str]:
        messages = self._build_messages(prompt)
        payload = {
            "model": self.model,
            "messages": messages,
            "stream": True,
            "think": False,
            "keep_alive": "30m",
            "options": {
                "temperature": self.temperature,
                "num_predict": self.max_tokens,
                "think": False,
            },
        }

        def _create_stream() -> Any:
            try:
                return self.session.post(
                    f"{self.base_url}/api/chat",
                    json=payload,
                    timeout=self.timeout,
                    stream=True,
                )
            except Exception as exc:
                raise self._handle_api_error(exc) from exc

        request_start = time.perf_counter()
        stream_response = self.retry_policy.execute(_create_stream)
        stream_response.raise_for_status()

        connection_ms = (time.perf_counter() - request_start) * 1000.0
        logger.info(
            "Ollama streaming connection established",
            extra={"model": self.model, "connection_ms": round(connection_ms, 2)},
        )

        first_token_time: Optional[float] = None
        token_count = 0
        output_chars = 0
        final_data: Optional[dict[str, Any]] = None

        try:
            for line in stream_response.iter_lines():
                if not line:
                    continue
                decoded_line = line.decode("utf-8")
                try:
                    data = json.loads(decoded_line)
                except json.JSONDecodeError:
                    continue

                final_data = data
                message = data.get("message") or {}
                chunk = message.get("content", "")
                if chunk:
                    now = time.perf_counter()
                    if first_token_time is None:
                        first_token_time = now
                        logger.info(
                            "Ollama first token received",
                            extra={
                                "model": self.model,
                                "ttft_ms": round((now - request_start) * 1000.0, 2),
                            },
                        )
                    token_count += 1
                    output_chars += len(chunk)
                    yield str(chunk)
                if data.get("done"):
                    break
        except GeneratorExit:
            logger.info(
                "Ollama streaming cancelled",
                extra={
                    "model": self.model,
                    "token_chunks": token_count,
                    "output_chars": output_chars,
                },
            )
            raise
        except Exception as exc:
            raise self._handle_api_error(exc) from exc
        finally:
            total_ms = (time.perf_counter() - request_start) * 1000.0
            performance: dict[str, Any] = {}
            if final_data:
                for key in ("prompt_eval_count", "eval_count"):
                    value = final_data.get(key)
                    if value is not None:
                        performance[key] = value
                duration_mappings = {
                    "prompt_eval_duration": "prompt_eval_duration_ms",
                    "eval_duration": "eval_duration_ms",
                    "total_duration": "ollama_total_duration_ms",
                    "load_duration": "load_duration_ms",
                }
                for source_key, output_key in duration_mappings.items():
                    value = final_data.get(source_key)
                    if value is not None:
                        performance[output_key] = round(value / 1_000_000, 2)

            logger.info(
                "Ollama streaming completed",
                extra={
                    "model": self.model,
                    "total_ms": round(total_ms, 2),
                    "connection_ms": round(connection_ms, 2),
                    "ttft_ms": (
                        round((first_token_time - request_start) * 1000.0, 2)
                        if first_token_time is not None
                        else None
                    ),
                    "token_chunks": token_count,
                    "output_chars": output_chars,
                    **performance,
                },
            )
            try:
                stream_response.close()
            except Exception:
                pass
