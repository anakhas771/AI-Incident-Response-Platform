from typing import Any, cast

from rest_framework import serializers

from apps.accounts.models import User

from .models import (
    Attachment,
    Category,
    Comment,
    Incident,
    IncidentEvent,
    Severity,
    Status,
)


class UserMinimalSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = ["id", "email", "full_name", "role"]


class CommentSerializer(serializers.ModelSerializer):
    author = UserMinimalSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ["id", "incident", "author", "message", "created_at"]
        read_only_fields = ["id", "incident", "author", "created_at"]


class AttachmentSerializer(serializers.ModelSerializer):
    uploaded_by = UserMinimalSerializer(read_only=True)

    class Meta:
        model = Attachment
        fields = [
            "id",
            "incident",
            "uploaded_by",
            "file",
            "filename",
            "uploaded_at",
        ]
        read_only_fields = ["id", "incident", "uploaded_by", "uploaded_at"]


class IncidentEventSerializer(serializers.ModelSerializer):
    user = UserMinimalSerializer(read_only=True)

    class Meta:
        model = IncidentEvent
        fields = [
            "id",
            "incident",
            "user",
            "event_type",
            "message",
            "metadata",
            "created_at",
        ]
        read_only_fields = fields


class IncidentListSerializer(serializers.ModelSerializer):
    created_by = UserMinimalSerializer(read_only=True)
    assigned_to = UserMinimalSerializer(read_only=True)

    class Meta:
        model = Incident
        fields = [
            "id",
            "title",
            "severity",
            "status",
            "category",
            "created_by",
            "assigned_to",
            "created_at",
            "updated_at",
        ]


class IncidentDetailSerializer(serializers.ModelSerializer):
    created_by = UserMinimalSerializer(read_only=True)
    assigned_to = UserMinimalSerializer(read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    attachments = AttachmentSerializer(many=True, read_only=True)
    events = IncidentEventSerializer(many=True, read_only=True)
    is_resolved = serializers.BooleanField(read_only=True)
    is_closed = serializers.BooleanField(read_only=True)

    class Meta:
        model = Incident
        fields = [
            "id",
            "title",
            "description",
            "severity",
            "status",
            "category",
            "created_by",
            "assigned_to",
            "resolved_at",
            "closed_at",
            "created_at",
            "updated_at",
            "is_resolved",
            "is_closed",
            "comments",
            "attachments",
            "events",
        ]
        read_only_fields = [
            "id",
            "created_by",
            "resolved_at",
            "closed_at",
            "created_at",
            "updated_at",
        ]


class IncidentCreateUpdateSerializer(serializers.ModelSerializer):
    assigned_to_id = serializers.UUIDField(
        required=False, allow_null=True, write_only=True
    )

    class Meta:
        model = Incident
        fields = [
            "title",
            "description",
            "severity",
            "status",
            "category",
            "assigned_to_id",
        ]

    def validate_severity(self, value: str) -> str:
        if value not in Severity.values:
            raise serializers.ValidationError(f"Invalid severity option '{value}'.")
        return value

    def validate_status(self, value: str) -> str:
        if value not in Status.values:
            raise serializers.ValidationError(f"Invalid status option '{value}'.")
        return value

    def validate_category(self, value: str) -> str:
        if value not in Category.values:
            raise serializers.ValidationError(f"Invalid category option '{value}'.")
        return value

    def validate_assigned_to_id(self, value: Any) -> Any:
        if value:
            user = cast(User, self.context["request"].user)
            try:
                assignee = User.objects.get(id=value)
                if assignee.organization != user.organization:
                    raise serializers.ValidationError(
                        "Cannot assign incident to user from another organization."
                    )
            except User.DoesNotExist as err:
                raise serializers.ValidationError(
                    "Assigned user does not exist."
                ) from err
        return value


class IncidentAssignSerializer(serializers.Serializer):
    assigned_to_id = serializers.UUIDField(required=False, allow_null=True)

    def validate_assigned_to_id(self, value: Any) -> Any:
        if value:
            user = cast(User, self.context["request"].user)
            try:
                assignee = User.objects.get(id=value)
                if assignee.organization != user.organization:
                    raise serializers.ValidationError(
                        "Cannot assign incident to a user outside your organization."
                    )
            except User.DoesNotExist as err:
                raise serializers.ValidationError(
                    "Assigned user does not exist."
                ) from err
        return value


class IncidentStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Status.choices)
