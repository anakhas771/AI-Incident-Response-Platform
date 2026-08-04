"""
Enterprise tests for Sprint 2 - Task 5: RetryPolicy, TelemetryLogger stage timing, usage accounting, and cost estimation.
"""

import time

import pytest

from apps.knowledge.services.dtos.prompt_dto import PromptContextDTO
from apps.knowledge.services.exceptions import LLMException
from apps.knowledge.services.llm.mock_gateway import MockLLMGateway
from apps.knowledge.services.llm.retry_policy import RetryPolicy
from apps.knowledge.services.observability.telemetry_logger import TelemetryLogger


class TestRetryPolicy:
    """
    Test suite for exponential backoff, jitter, and transient failure detection.
    """

    def test_retry_policy_transient_error_retry_success(self):
        policy = RetryPolicy(max_retries=3, base_backoff=0.001)
        attempts = {"count": 0}

        def unstable_operation():
            attempts["count"] += 1
            if attempts["count"] < 2:
                raise LLMException("Rate limit exceeded 429", status_code=429)
            return "recovered_response"

        res = policy.execute(unstable_operation)
        assert res == "recovered_response"
        assert attempts["count"] == 2

    def test_retry_policy_exhausted_retries_raises(self):
        policy = RetryPolicy(max_retries=2, base_backoff=0.001)
        attempts = {"count": 0}

        def always_failing_operation():
            attempts["count"] += 1
            raise LLMException("503 Service Temporarily Unavailable", status_code=503)

        with pytest.raises(LLMException) as exc_info:
            policy.execute(always_failing_operation)

        assert "503 Service Temporarily Unavailable" in str(exc_info.value)
        assert attempts["count"] == 3  # 1 initial + 2 retries

    def test_retry_policy_non_transient_error_no_retry(self):
        policy = RetryPolicy(max_retries=3, base_backoff=0.001)
        attempts = {"count": 0}

        def non_transient_operation():
            attempts["count"] += 1
            raise LLMException("Invalid request parameters", status_code=400)

        with pytest.raises(LLMException):
            policy.execute(non_transient_operation)

        assert attempts["count"] == 1


class TestTelemetryAndGatewayUsage:
    """
    Test suite for TelemetryLogger and LLM gateway usage accounting and metadata.
    """

    def test_telemetry_logger_stage_timing(self):
        telemetry = TelemetryLogger()
        with telemetry.timer("retrieval"):
            time.sleep(0.005)

        assert "retrieval" in telemetry.stage_timings
        assert telemetry.stage_timings["retrieval"] >= 0.0

    def test_telemetry_logger_log_chat_turn_safe_logging(self):
        telemetry = TelemetryLogger()
        # Ensure log_chat_turn executes cleanly without sensitive prompt parameters
        telemetry.log_chat_turn(
            session_id="uuid-session-123",
            message_id="uuid-message-456",
            usage={"total_tokens": 150, "estimated_cost": 0.002},
            retries=1,
            error=None,
            provider_metadata={"provider": "mock", "model": "mock-gpt-model"},
        )
        assert telemetry.stage_timings == {}

    def test_mock_gateway_usage_cost_and_metadata(self):
        gateway = MockLLMGateway()
        prompt_ctx = PromptContextDTO(
            system_prompt="System",
            context_text="Context text for retrieval",
            history_text="",
            user_prompt="Explain security incidents",
            template_version="v1",
            estimated_tokens=25,
        )

        response = gateway.generate(prompt_ctx)
        assert response.prompt_tokens == 25
        assert response.completion_tokens > 0
        assert (
            response.total_tokens == response.prompt_tokens + response.completion_tokens
        )
        assert response.estimated_cost_usd >= 0.0
        assert response.metadata["provider"] == "mock"
        assert response.metadata["gateway"] == "mock"
        assert response.metadata["model"] == "mock-gpt-model"
