"""
Tests for CopilotOrchestrator and Task 4 post-processing services.
"""

import pytest

from apps.accounts.models import Organization, User
from apps.knowledge.models import ChatSession, MessageRole
from apps.knowledge.services import CopilotCitationService
from apps.knowledge.services.confidence import ConfidenceEngine
from apps.knowledge.services.dtos import (
    ConversationContextDTO,
    RetrievedChunkDTO,
)
from apps.knowledge.services.orchestration import (
    CopilotOrchestrator,
    SuggestedQuestionsService,
)


@pytest.mark.django_db
class TestCopilotOrchestratorAndServices:
    def test_suggested_questions_service_rules(self):
        service = SuggestedQuestionsService()
        context = ConversationContextDTO(session_id="session-1")

        # 1. Test database keyword
        c1 = RetrievedChunkDTO(
            "c1", "d1", "DB Playbook", 0, "How to fix database connections", 0.90, 1, {}
        )
        questions = service.generate_questions(context, [c1])
        assert (
            "db" in "".join(questions).lower()
            or "database" in "".join(questions).lower()
        )
        assert len(questions) == 3

        # 2. Test security keyword
        c2 = RetrievedChunkDTO(
            "c2", "d2", "Auth Policy", 0, "Rotate compromised credentials", 0.85, 2, {}
        )
        questions_sec = service.generate_questions(context, [c2])
        assert (
            "keys" in "".join(questions_sec).lower()
            or "credentials" in "".join(questions_sec).lower()
        )

        # 3. Test generic defaults
        questions_empty = service.generate_questions(context, [])
        assert len(questions_empty) == 2

    def test_confidence_engine_scoring(self):
        engine = ConfidenceEngine()

        # Test High (avg similarity >= 0.85)
        c1 = RetrievedChunkDTO("c1", "d1", "Title", 0, "Content", 0.90, 1, {})
        c2 = RetrievedChunkDTO("c2", "d2", "Title", 1, "Content", 0.86, 2, {})
        conf_high = engine.calculate_confidence([c1, c2])
        assert conf_high.level == "high"
        assert conf_high.score == 88

        # Test Medium (avg similarity >= 0.70)
        c3 = RetrievedChunkDTO("c3", "d3", "Title", 0, "Content", 0.75, 1, {})
        conf_med = engine.calculate_confidence([c3])
        assert conf_med.level == "medium"

        # Test Low
        c4 = RetrievedChunkDTO("c4", "d4", "Title", 0, "Content", 0.50, 1, {})
        conf_low = engine.calculate_confidence([c4])
        assert conf_low.level == "low"

    def test_citation_service_parsing(self):
        service = CopilotCitationService()
        chunk = RetrievedChunkDTO(
            "c-1",
            "d-1",
            "Policy",
            0,
            "A database outage checklist. Steps to recover.",
            0.95,
            2,
            {"version": "2.1"},
        )
        citations = service.extract_citations([chunk], "Mock LLM Response")

        assert len(citations) == 1
        cit = citations[0]
        assert cit.document_id == "d-1"
        assert cit.document_title == "Policy"
        assert cit.highlight_end == len("A database outage checklist")
        assert cit.source_url == "/api/v1/knowledge/documents/d-1/"
        assert cit.version == "2.1"

    def test_orchestrator_execution(self):
        org = Organization.objects.create(name="Stripe Orc", slug="stripe-orc")
        user = User.objects.create(email="lead-orc@stripe.com", organization=org)
        session = ChatSession.objects.create(
            organization=org, user=user, title="Copilot Chat"
        )

        orchestrator = CopilotOrchestrator()
        response = orchestrator.execute_turn(session, "How to fix the database outage?")

        # Verify orchestrator return DTO
        assert response.session_id == str(session.id)
        assert response.role == MessageRole.ASSISTANT
        assert "Mock response" in response.content
        assert response.tokens > 0
        assert len(response.citations) == 0
        assert response.confidence.level == "low"  # No database chunks created in test

        # Verify messages saved to DB
        messages = list(session.messages.order_by("created_at"))
        assert len(messages) == 2
        assert messages[0].role == MessageRole.USER
        assert messages[0].content == "How to fix the database outage?"
        assert messages[1].role == MessageRole.ASSISTANT
        assert messages[1].content == response.content

        # Verify session metadata updated
        session.refresh_from_db()
        assert session.last_message_preview == response.content[:255]
        assert session.token_count == response.tokens
