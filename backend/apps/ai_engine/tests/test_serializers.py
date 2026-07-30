"""
Unit tests for AI Engine DRF serializers.
"""

import pytest

from apps.ai_engine.api.serializers import (
    IncidentAnalyzeRequestSerializer,
    IncidentAnalyzeResponseSerializer,
    RecommendationRequestSerializer,
    RecommendationResponseSerializer,
    SeverityPredictRequestSerializer,
    SeverityPredictResponseSerializer,
)


@pytest.mark.django_db
class TestIncidentAnalyzeSerializers:
    def test_valid_request_serializer(self):
        data = {
            "title": "API Gateway Failure",
            "description": "API Gateway responding with 504",
            "severity": "HIGH",
            "impact": "Customer login failure",
        }
        serializer = IncidentAnalyzeRequestSerializer(data=data)
        assert serializer.is_valid(), serializer.errors

    def test_invalid_request_missing_required(self):
        data = {"description": "Missing title"}
        serializer = IncidentAnalyzeRequestSerializer(data=data)
        assert not serializer.is_valid()
        assert "title" in serializer.errors

    def test_valid_response_serializer(self):
        data = {
            "summary": "High latency on gateway",
            "probable_root_cause": "Upstream timeout",
            "affected_components": ["Gateway"],
            "recommended_actions": ["Restart proxy"],
        }
        serializer = IncidentAnalyzeResponseSerializer(data=data)
        assert serializer.is_valid(), serializer.errors


@pytest.mark.django_db
class TestSeverityPredictSerializers:
    def test_valid_request_serializer(self):
        data = {
            "category": "infrastructure",
            "impact": "Data loss risk",
            "affected_users": 100,
            "description": "Disk full on replica",
        }
        serializer = SeverityPredictRequestSerializer(data=data)
        assert serializer.is_valid(), serializer.errors

    def test_invalid_negative_affected_users(self):
        data = {
            "category": "infrastructure",
            "impact": "Data loss risk",
            "affected_users": -5,
            "description": "Disk full on replica",
        }
        serializer = SeverityPredictRequestSerializer(data=data)
        assert not serializer.is_valid()
        assert "affected_users" in serializer.errors

    def test_valid_response_serializer(self):
        data = {
            "predicted_severity": "HIGH",
            "confidence_score": 0.92,
        }
        serializer = SeverityPredictResponseSerializer(data=data)
        assert serializer.is_valid(), serializer.errors


@pytest.mark.django_db
class TestRecommendationSerializers:
    def test_valid_request_serializer(self):
        data = {
            "title": "SQL Injection Alert",
            "description": "Anomalous queries detected.",
            "category": "security",
            "severity": "CRITICAL",
            "affected_components": ["Database", "WAF"],
        }
        serializer = RecommendationRequestSerializer(data=data)
        assert serializer.is_valid(), serializer.errors

    def test_valid_response_serializer(self):
        data = {
            "immediate_mitigation_steps": ["Block IP range"],
            "investigation_checklist": ["Check DB logs"],
            "prevention_recommendations": ["Update WAF rules"],
        }
        serializer = RecommendationResponseSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
