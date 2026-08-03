"""
Unit tests for Enterprise AI Copilot DRF serializers.
"""

import pytest

from apps.accounts.models import Organization, User
from apps.knowledge.models import ChatMessage, ChatSession, MessageRole
from apps.knowledge.serializers import (
    ChatMessageSerializer,
    ChatSessionCreateSerializer,
    ChatSessionSerializer,
    ChatSessionUpdateSerializer,
)


@pytest.mark.django_db
class TestCopilotSerializers:
    """
    Test suite for ChatSession and ChatMessage serializers.
    """

    def test_chat_session_serializer_output(self):
        org = Organization.objects.create(name="OpenAI Org 1", slug="openai-org-1")
        user = User.objects.create(email="architect@openai.com", organization=org)
        session = ChatSession.objects.create(
            organization=org,
            user=user,
            title="Production Incident #404",
            token_count=150,
        )

        serializer = ChatSessionSerializer(session)
        data = serializer.data

        assert data["id"] == str(session.id)
        assert str(data["organization"]) == str(org.id)
        assert str(data["user"]) == str(user.id)
        assert data["title"] == "Production Incident #404"
        assert data["token_count"] == 150
        assert "last_message_at" in data
        assert "created_at" in data
        assert "updated_at" in data

    def test_chat_session_create_serializer(self):
        serializer_default = ChatSessionCreateSerializer(data={})
        assert serializer_default.is_valid()
        assert serializer_default.validated_data.get("title", "New Chat") == "New Chat"

        serializer_custom = ChatSessionCreateSerializer(
            data={"title": "Custom Analysis"}
        )
        assert serializer_custom.is_valid()
        assert serializer_custom.validated_data["title"] == "Custom Analysis"

    def test_chat_session_update_serializer(self):
        serializer = ChatSessionUpdateSerializer(
            data={"title": "Updated Title", "is_archived": True}
        )
        assert serializer.is_valid()
        assert serializer.validated_data["title"] == "Updated Title"
        assert serializer.validated_data["is_archived"] is True

    def test_chat_message_serializer_output(self):
        org = Organization.objects.create(name="OpenAI Org 2", slug="openai-org-2")
        user = User.objects.create(email="architect2@openai.com", organization=org)
        session = ChatSession.objects.create(organization=org, user=user, title="Chat")
        msg = ChatMessage.objects.create(
            session=session,
            role=MessageRole.ASSISTANT,
            content="Based on the runbook...",
            tokens=45,
            prompt_tokens=20,
            completion_tokens=25,
            metadata={"model": "gemini-1.5-pro"},
        )

        serializer = ChatMessageSerializer(msg)
        data = serializer.data

        assert data["id"] == str(msg.id)
        assert str(data["session"]) == str(session.id)
        assert data["role"] == MessageRole.ASSISTANT
        assert data["content"] == "Based on the runbook..."
        assert data["tokens"] == 45
        assert data["prompt_tokens"] == 20
        assert data["completion_tokens"] == 25
        assert data["metadata"] == {"model": "gemini-1.5-pro"}
        assert "created_at" in data
