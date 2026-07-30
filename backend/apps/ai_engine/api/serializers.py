"""
Serializers for AI Engine REST API endpoints and models.
"""

from rest_framework import serializers

from apps.ai_engine.models import AIIncidentAnalysis, IncidentAnalysis


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


class IncidentAnalysisSerializer(serializers.ModelSerializer):
    """
    Serializer for IncidentAnalysis model returning standardized Phase 5 schema.
    """

    incident_id = serializers.UUIDField(source="incident.id", read_only=True)
    category = serializers.CharField(source="incident_category", read_only=True)
    root_cause = serializers.CharField(source="root_cause_analysis", read_only=True)
    impact = serializers.CharField(source="impact_analysis", read_only=True)
    recommendations = serializers.JSONField(
        source="recommended_actions", read_only=True
    )

    class Meta:
        model = IncidentAnalysis
        fields = [
            "incident_id",
            "status",
            "severity_prediction",
            "risk_score",
            "category",
            "root_cause",
            "impact",
            "recommendations",
            "confidence_score",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class IncidentAIAnalyzeTriggerSerializer(serializers.Serializer):
    """
    Serializer for manual AI analysis trigger response payload.
    """

    message = serializers.CharField()
    incident_id = serializers.UUIDField()
    status = serializers.CharField()
