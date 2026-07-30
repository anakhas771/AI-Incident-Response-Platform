"""
Serializers for AI Engine REST API endpoints and models.
"""

from rest_framework import serializers

from apps.ai_engine.models import AIIncidentAnalysis


class IncidentAnalyzeRequestSerializer(serializers.Serializer):
    """
    Serializer for incident analysis request payloads.
    """

    title = serializers.CharField(max_length=255, required=True)
    description = serializers.CharField(required=True)
    logs = serializers.CharField(required=False, allow_blank=True, default="")
    severity = serializers.CharField(
        max_length=50, required=False, allow_blank=True, default=""
    )
    impact = serializers.CharField(
        max_length=255, required=False, allow_blank=True, default=""
    )


class IncidentAnalyzeResponseSerializer(serializers.Serializer):
    """
    Serializer for incident analysis response outputs.
    """

    summary = serializers.CharField()
    probable_root_cause = serializers.CharField(required=False)
    root_cause = serializers.CharField(required=False)
    affected_components = serializers.ListField(
        child=serializers.CharField(), required=False, default=list
    )
    recommended_actions = serializers.ListField(
        child=serializers.CharField(), required=False, default=list
    )
    recommendations = serializers.ListField(
        child=serializers.CharField(), required=False, default=list
    )
    severity_prediction = serializers.CharField(required=False)
    risk_score = serializers.FloatField(required=False)
    confidence_score = serializers.FloatField(required=False)


class SeverityPredictRequestSerializer(serializers.Serializer):
    """
    Serializer for severity prediction request payloads.
    """

    category = serializers.CharField(max_length=100, required=True)
    impact = serializers.CharField(max_length=255, required=True)
    affected_users = serializers.IntegerField(min_value=0, required=True)
    description = serializers.CharField(required=True)


class SeverityPredictResponseSerializer(serializers.Serializer):
    """
    Serializer for severity prediction response outputs.
    """

    predicted_severity = serializers.CharField()
    confidence_score = serializers.FloatField(min_value=0.0, max_value=1.0)


class RecommendationRequestSerializer(serializers.Serializer):
    """
    Serializer for recommendation engine request payloads.
    """

    title = serializers.CharField(max_length=255, required=True)
    description = serializers.CharField(required=True)
    category = serializers.CharField(
        max_length=100, required=False, allow_blank=True, default=""
    )
    severity = serializers.CharField(
        max_length=50, required=False, allow_blank=True, default=""
    )
    affected_components = serializers.ListField(
        child=serializers.CharField(), required=False, default=list
    )


class RecommendationResponseSerializer(serializers.Serializer):
    """
    Serializer for recommendation engine response outputs.
    """

    immediate_mitigation_steps = serializers.ListField(child=serializers.CharField())
    investigation_checklist = serializers.ListField(child=serializers.CharField())
    prevention_recommendations = serializers.ListField(child=serializers.CharField())


class AIIncidentAnalysisSerializer(serializers.ModelSerializer):
    """
    Serializer for persistent AIIncidentAnalysis model records.
    """

    class Meta:
        model = AIIncidentAnalysis
        fields = [
            "id",
            "incident",
            "summary",
            "root_cause",
            "severity_prediction",
            "risk_score",
            "confidence_score",
            "recommendations",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields
