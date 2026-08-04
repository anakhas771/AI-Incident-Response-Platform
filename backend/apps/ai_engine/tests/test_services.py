"""
Unit tests for AI Engine services (LLMClient, IncidentAnalyzer, SeverityPredictor, RecommendationEngine).
Covers provider abstraction, structured JSON validation, retry logic, timeout handling, and confidence scoring.
"""

import json
import socket
import urllib.error
from unittest.mock import MagicMock

import pytest

from apps.ai_engine.services import (
    IncidentAnalyzer,
    LLMClient,
    RecommendationEngine,
    SeverityPredictor,
)
from apps.ai_engine.services.llm_client import LLMClientError


@pytest.mark.django_db
class TestLLMClient:
    def test_default_initialization(self, monkeypatch):
        monkeypatch.setenv("AI_PROVIDER", "mock")
        monkeypatch.setenv("AI_MODEL", "test-model")
        client = LLMClient()
        assert client.provider == "mock"
        assert client.model == "test-model"
        assert client.max_retries == 3
        assert client.timeout == 15

    def test_custom_initialization(self):
        client = LLMClient(
            provider="openai",
            api_key="sk-test",
            model="gpt-4-turbo",
            max_retries=5,
            retry_delay=0.2,
            timeout=10,
        )
        assert client.provider == "openai"
        assert client.api_key == "sk-test"
        assert client.max_retries == 5
        assert client.timeout == 10

    def test_generate_response_mock(self):
        client = LLMClient(provider="mock")
        response = client.generate_response("Test prompt")
        assert isinstance(response, str)
        assert len(response) > 0

    def test_generate_json_mock(self):
        client = LLMClient(provider="mock")
        data = client.generate_json("Test prompt for incident")
        assert isinstance(data, dict)
        assert (
            "summary" in data
            or "predicted_severity" in data
            or "immediate_mitigation_steps" in data
        )

    def test_generate_json_expected_keys_validation(self):
        client = LLMClient(provider="mock")
        with pytest.raises(LLMClientError, match="Response JSON missing required keys"):
            client.generate_json(
                "Test prompt for incident",
                expected_keys=["summary", "non_existent_key_123"],
            )

    def test_invalid_prompt_raises_error(self):
        client = LLMClient(provider="mock")
        with pytest.raises(LLMClientError):
            client.generate_response("")
        with pytest.raises(LLMClientError):
            client.generate_response("   ")

    def test_openai_provider_success(self, monkeypatch):
        client = LLMClient(provider="openai", api_key="test-key", model="gpt-4-turbo")
        mock_response = MagicMock()
        payload = {
            "choices": [
                {"message": {"content": json.dumps({"status": "ok", "value": 42})}}
            ]
        }
        mock_response.read.return_value = json.dumps(payload).encode("utf-8")
        mock_response.__enter__.return_value = mock_response

        def mock_urlopen(request, timeout=None):
            assert timeout == client.timeout
            return mock_response

        monkeypatch.setattr("urllib.request.urlopen", mock_urlopen)
        res = client.generate_json("Test OpenAI call")
        assert res["status"] == "ok"
        assert res["value"] == 42

    def test_anthropic_provider_success(self, monkeypatch):
        client = LLMClient(
            provider="anthropic", api_key="test-key", model="claude-3-sonnet"
        )
        mock_response = MagicMock()
        payload = {
            "content": [
                {"text": json.dumps({"provider": "anthropic", "confidence": 0.95})}
            ]
        }
        mock_response.read.return_value = json.dumps(payload).encode("utf-8")
        mock_response.__enter__.return_value = mock_response

        def mock_urlopen(request, timeout=None):
            return mock_response

        monkeypatch.setattr("urllib.request.urlopen", mock_urlopen)
        res = client.generate_json("Test Anthropic call")
        assert res["provider"] == "anthropic"
        assert res["confidence"] == 0.95

    def test_retry_logic_succeeds_on_retry(self, monkeypatch):
        client = LLMClient(
            provider="openai",
            api_key="test-key",
            max_retries=2,
            retry_delay=0.01,
        )
        attempts = {"count": 0}
        mock_response = MagicMock()
        payload = {"choices": [{"message": {"content": json.dumps({"retried": True})}}]}
        mock_response.read.return_value = json.dumps(payload).encode("utf-8")
        mock_response.__enter__.return_value = mock_response

        def flaky_urlopen(request, timeout=None):
            attempts["count"] += 1
            if attempts["count"] == 1:
                raise urllib.error.URLError("Temporary network timeout")
            return mock_response

        monkeypatch.setattr("urllib.request.urlopen", flaky_urlopen)
        res = client.generate_json("Test retry call")
        assert attempts["count"] == 2
        assert res["retried"] is True

    def test_retry_logic_exhaustion_no_fallback(self, monkeypatch):
        client = LLMClient(
            provider="openai",
            api_key="test-key",
            max_retries=1,
            retry_delay=0.01,
            fallback_to_mock=False,
        )

        def failing_urlopen(request, timeout=None):
            raise socket.timeout("Socket connection timed out")

        monkeypatch.setattr("urllib.request.urlopen", failing_urlopen)
        with pytest.raises(LLMClientError, match="exhausted retries"):
            client.generate_response("Test timeout error")

    def test_retry_logic_exhaustion_fallback_mock(self, monkeypatch):
        client = LLMClient(
            provider="openai",
            api_key="test-key",
            max_retries=1,
            retry_delay=0.01,
            fallback_to_mock=True,
        )

        def failing_urlopen(request, timeout=None):
            raise socket.timeout("Socket connection timed out")

        monkeypatch.setattr("urllib.request.urlopen", failing_urlopen)
        res = client.generate_response("Test title: Outage incident")
        assert "Automated AI summary" in res


@pytest.mark.django_db
class TestIncidentAnalyzer:
    def test_analyze_incident_structure(self):
        analyzer = IncidentAnalyzer(llm_client=LLMClient(provider="mock"))
        result = analyzer.analyze(
            title="Database Connection Timeout",
            description="High latency and timeouts on primary DB.",
            logs="ERROR 504 Gateway Timeout",
            severity="HIGH",
            impact="Checkout failure",
        )
        assert isinstance(result, dict)
        assert "summary" in result
        assert "probable_root_cause" in result
        assert isinstance(result["affected_components"], list)
        assert isinstance(result["recommended_actions"], list)
        assert 0.0 <= result["confidence_score"] <= 1.0
        assert 0.0 <= result["risk_score"] <= 100.0

    def test_calculate_risk_score(self):
        analyzer = IncidentAnalyzer(llm_client=LLMClient(provider="mock"))
        critical_score = analyzer.calculate_risk_score(
            "CRITICAL", "data loss outage", 0.95
        )
        low_score = analyzer.calculate_risk_score("LOW", "minor minimal issue", 0.70)
        assert critical_score > low_score
        assert 0.0 <= critical_score <= 100.0
        assert 0.0 <= low_score <= 100.0

    def test_analyze_validation_error(self):
        analyzer = IncidentAnalyzer(llm_client=LLMClient(provider="mock"))
        with pytest.raises(ValueError, match="title must be a non-empty string"):
            analyzer.analyze(title="", description="Valid description")
        with pytest.raises(ValueError, match="description must be a non-empty string"):
            analyzer.analyze(title="Valid title", description="   ")


@pytest.mark.django_db
class TestSeverityPredictor:
    def test_predict_severity_structure(self):
        predictor = SeverityPredictor(llm_client=LLMClient(provider="mock"))
        result = predictor.predict(
            category="infrastructure",
            impact="Complete outage",
            affected_users=5000,
            description="Database cluster unreachable.",
        )
        assert isinstance(result, dict)
        assert result["predicted_severity"] in {"CRITICAL", "HIGH", "MEDIUM", "LOW"}
        assert 0.0 <= result["confidence_score"] <= 1.0

    def test_predict_validation_error(self):
        predictor = SeverityPredictor(llm_client=LLMClient(provider="mock"))
        with pytest.raises(ValueError, match="category must be a non-empty string"):
            predictor.predict(
                category="",
                impact="Outage",
                affected_users=10,
                description="Valid description",
            )
        with pytest.raises(ValueError, match="description must be a non-empty string"):
            predictor.predict(
                category="network",
                impact="Outage",
                affected_users=10,
                description="  ",
            )
        with pytest.raises(ValueError, match="count cannot be negative"):
            predictor.predict(
                category="network",
                impact="Outage",
                affected_users=-5,
                description="Valid description",
            )


@pytest.mark.django_db
class TestRecommendationEngine:
    def test_recommend_structure(self):
        engine = RecommendationEngine(llm_client=LLMClient(provider="mock"))
        result = engine.recommend(
            title="API Gateway Outage",
            description="502 Bad Gateway responses.",
            category="infrastructure",
            severity="CRITICAL",
            affected_components=["Gateway", "Auth"],
        )
        assert isinstance(result, dict)
        assert isinstance(result["immediate_mitigation_steps"], list)
        assert isinstance(result["investigation_checklist"], list)
        assert isinstance(result["prevention_recommendations"], list)
        assert len(result["immediate_mitigation_steps"]) > 0

    def test_recommend_validation_error(self):
        engine = RecommendationEngine(llm_client=LLMClient(provider="mock"))
        with pytest.raises(ValueError, match="title must be a non-empty string"):
            engine.recommend(title="", description="Valid description")
        with pytest.raises(ValueError, match="description must be a non-empty string"):
            engine.recommend(title="Valid title", description="   ")
