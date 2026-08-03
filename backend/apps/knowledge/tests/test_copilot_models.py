"""
Unit tests for Enterprise AI Copilot ChatSession, ChatMessage models, and TextChoices enums.
"""

import pytest
from django.utils import timezone

from apps.accounts.models import Organization, User
from apps.knowledge.models import (
    ChatMessage,
    ChatSession,
    ConfidenceLevel,
    MessageRole,
)


@pytest.mark.django_db
class TestCopilotModels:
    """
    Test suite for Copilot models and enums.
    """

    def test_message_role_enum_values(self):
        assert MessageRole.USER == "user"
        assert MessageRole.ASSISTANT == "assistant"
        assert MessageRole.SYSTEM == "system"
        assert MessageRole.TOOL == "tool"

    def test_confidence_level_enum_values(self):
        assert ConfidenceLevel.HIGH == "high"
        assert ConfidenceLevel.MEDIUM == "medium"
        assert ConfidenceLevel.LOW == "low"

    def test_create_chat_session(self):
        org = Organization.objects.create(
            name="Stripe Security", slug="stripe-security-1"
        )
        user = User.objects.create(
            email="security-lead@stripe.com",
            organization=org,
        )

        session = ChatSession.objects.create(
            organization=org,
            user=user,
            title="Incident RCA Conversation",
        )

        assert session.title == "Incident RCA Conversation"
        assert session.organization == org
        assert session.user == user
        assert session.token_count == 0
        assert not session.is_archived
        assert str(session) == f"Incident RCA Conversation ({user.email})"

    def test_create_chat_message(self):
        org = Organization.objects.create(
            name="Stripe Security", slug="stripe-security-2"
        )
        user = User.objects.create(
            email="security-lead@stripe.com",
            organization=org,
        )
        session = ChatSession.objects.create(
            organization=org,
            user=user,
            title="Log Analysis",
        )

        message = ChatMessage.objects.create(
            session=session,
            role=MessageRole.USER,
            content="What caused the authentication outage?",
            tokens=12,
            prompt_tokens=12,
            completion_tokens=0,
            metadata={"source": "test"},
        )

        assert message.session == session
        assert message.role == MessageRole.USER
        assert message.content == "What caused the authentication outage?"
        assert message.tokens == 12
        assert message.prompt_tokens == 12
        assert message.completion_tokens == 0
        assert message.metadata == {"source": "test"}
        assert str(message) == f"[{MessageRole.USER}] {message.content[:30]}"

    def test_chat_session_ordering(self):
        org = Organization.objects.create(
            name="Stripe Security", slug="stripe-security-3"
        )
        user = User.objects.create(
            email="security-lead@stripe.com",
            organization=org,
        )

        s1 = ChatSession.objects.create(
            organization=org,
            user=user,
            title="Session 1",
            last_message_at=timezone.now() - timezone.timedelta(hours=2),
        )
        s2 = ChatSession.objects.create(
            organization=org,
            user=user,
            title="Session 2",
            last_message_at=timezone.now(),
        )

        sessions = list(ChatSession.objects.all())
        assert sessions[0] == s2
        assert sessions[1] == s1
