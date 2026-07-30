"""
Unit tests for AI Engine services (LLMClient, IncidentAnalyzer, SeverityPredictor, RecommendationEngine).
"""

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

    def test_invalid_prompt_raises_error(self):
        client = LLMClient(provider="mock")
        with pytest.raises(LLMClientError):
            client.generate_response("")  # Empty prompt should raise error


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
