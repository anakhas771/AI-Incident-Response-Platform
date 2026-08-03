"""
Tests for ConversationMemoryService, budgeting, truncation, and summary strategy.
"""

import pytest

from apps.accounts.models import Organization, User
from apps.knowledge.models import ChatMessage, ChatSession, MessageRole
from apps.knowledge.services.config import CopilotSettings
from apps.knowledge.services.memory import ConversationMemoryService


@pytest.mark.django_db
class TestConversationMemoryService:
    def test_load_history_empty(self):
        org = Organization.objects.create(name="Stripe Memory", slug="stripe-memory")
        user = User.objects.create(email="lead@stripe.com", organization=org)
        session = ChatSession.objects.create(organization=org, user=user, title="Empty")

        service = ConversationMemoryService()
        ctx = service.load_history(session)

        assert ctx.session_id == str(session.id)
        assert len(ctx.messages) == 0
        assert ctx.total_tokens == 0
        assert not ctx.is_truncated

    def test_load_history_within_budget(self):
        org = Organization.objects.create(
            name="Stripe Memory 2", slug="stripe-memory-2"
        )
        user = User.objects.create(email="lead2@stripe.com", organization=org)
        session = ChatSession.objects.create(
            organization=org, user=user, title="Within Budget"
        )

        ChatMessage.objects.create(
            session=session,
            role=MessageRole.USER,
            content="Hello",
            tokens=5,
        )
        ChatMessage.objects.create(
            session=session,
            role=MessageRole.ASSISTANT,
            content="Hi there",
            tokens=10,
        )

        service = ConversationMemoryService()
        ctx = service.load_history(session)

        assert len(ctx.messages) == 2
        assert ctx.messages[0].content == "Hello"
        assert ctx.messages[1].content == "Hi there"
        assert ctx.total_tokens == 15
        assert not ctx.is_truncated

    def test_load_history_truncation_lifo(self):
        org = Organization.objects.create(
            name="Stripe Memory 3", slug="stripe-memory-3"
        )
        user = User.objects.create(email="lead3@stripe.com", organization=org)
        session = ChatSession.objects.create(
            organization=org, user=user, title="Truncation"
        )

        # 3 turns: oldest (M1), middle (M2), newest (M3)
        ChatMessage.objects.create(
            session=session,
            role=MessageRole.USER,
            content="M1 oldest",
            tokens=50,
        )
        ChatMessage.objects.create(
            session=session,
            role=MessageRole.ASSISTANT,
            content="M2 middle",
            tokens=50,
        )
        ChatMessage.objects.create(
            session=session,
            role=MessageRole.USER,
            content="M3 newest",
            tokens=50,
        )

        service = ConversationMemoryService()
        # Set max_tokens to 120 so M2 and M3 fit (total 100), but M1 would exceed budget
        ctx = service.load_history(session, max_tokens=120)

        # Expected: M1 dropped. Summary strategy prepended a system turn.
        # Messages: [Summary Turn, M2, M3]
        assert ctx.is_truncated
        assert len(ctx.messages) == 3
        assert ctx.messages[0].role == "system"
        assert ctx.messages[0].content == CopilotSettings.SUMMARY_PLACEHOLDER
        assert ctx.messages[1].content == "M2 middle"
        assert ctx.messages[2].content == "M3 newest"
