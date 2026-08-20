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

    def validate_title(self, value: str) -> str:
        value = value.strip()
        if len(value) < 3:
            raise serializers.ValidationError(
                "Incident title must be at least 3 characters long."
            )
        placeholder_titles = {
            "string",
            "test",
            "example",
            "demo",
            "placeholder",
            "untitled",
            "sample",
        }
        if value.lower() in placeholder_titles:
            raise serializers.ValidationError(
                f"Placeholder title '{value}' is not allowed."
            )
        return value

    def validate_description(self, value: str) -> str:
        value = value.strip()
        if len(value) < 10:
            raise serializers.ValidationError(
                "Incident description must be at least 10 characters long."
            )
        return value

    def validate_severity(self, value: str) -> str:
        value = value.strip().upper()
        valid_severities = {"CRITICAL", "HIGH", "MEDIUM", "LOW", "UNKNOWN", ""}
        if value and value not in valid_severities:
            raise serializers.ValidationError(f"Invalid severity level '{value}'.")
        return value


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

    def validate_category(self, value: str) -> str:
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Category cannot be empty.")
        return value

    def validate_impact(self, value: str) -> str:
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Impact description cannot be empty.")
        return value

    def validate_description(self, value: str) -> str:
        value = value.strip()
        if len(value) < 10:
            raise serializers.ValidationError(
                "Description must be at least 10 characters long."
            )
        return value

    def validate_affected_users(self, value: int) -> int:
        if value < 0:
            raise serializers.ValidationError(
                "Affected users count cannot be negative."
            )
        return value


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
        child=serializers.CharField(allow_blank=True), required=False, default=list
    )

    def validate_title(self, value: str) -> str:
        value = value.strip()
        if len(value) < 3:
            raise serializers.ValidationError(
                "Title must be at least 3 characters long."
            )
        placeholder_titles = {
            "string",
            "test",
            "example",
            "demo",
            "placeholder",
            "untitled",
            "sample",
        }
        if value.lower() in placeholder_titles:
            raise serializers.ValidationError(
                f"Placeholder title '{value}' is not allowed."
            )
        return value

    def validate_description(self, value: str) -> str:
        value = value.strip()
        if len(value) < 10:
            raise serializers.ValidationError(
                "Description must be at least 10 characters long."
            )
        return value

    def validate_severity(self, value: str) -> str:
        value = value.strip().upper()
        valid_severities = {"CRITICAL", "HIGH", "MEDIUM", "LOW", "UNKNOWN", ""}
        if value and value not in valid_severities:
            raise serializers.ValidationError(f"Invalid severity level '{value}'.")
        return value

    def validate_affected_components(self, value: list) -> list:
        cleaned = []
        for item in value:
            if isinstance(item, str):
                s = item.strip()
                if s and s not in cleaned:
                    cleaned.append(s)
        return cleaned


class RecommendationResponseSerializer(serializers.Serializer):
    """
    Serializer for recommendation engine response outputs.
    """

    immediate_mitigation_steps = serializers.ListField(child=serializers.CharField())
    investigation_checklist = serializers.ListField(child=serializers.CharField())
    prevention_recommendations = serializers.ListField(child=serializers.CharField())
    knowledge_citations = serializers.ListField(
        child=serializers.DictField(), required=False, default=list
    )
    rag_context_used = serializers.BooleanField(required=False, default=False)


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
            "id",
            "incident_id",
            "status",
            "summary",
            "severity_prediction",
            "risk_score",
            "confidence_score",
            "incident_category",
            "root_cause_analysis",
            "impact_analysis",
            "recommended_actions",
            "similar_incidents",
            "previous_resolutions",
            "knowledge_citations",
            "created_at",
            "updated_at",
            # Backward compatibility aliases
            "category",
            "root_cause",
            "impact",
            "recommendations",
        ]
        read_only_fields = fields


class IncidentAIAnalyzeTriggerSerializer(serializers.Serializer):
    """
    Serializer for manual AI analysis trigger response payload.
    """

    message = serializers.CharField()
    incident_id = serializers.UUIDField()
    status = serializers.CharField()
