import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.accounts.models import Organization, User
from apps.knowledge.models import ChatMessage, ChatSession, MessageRole
from apps.knowledge.services.dtos import LLMResponseDTO


@pytest.mark.django_db
class TestProductionHardening:
    @pytest.fixture
    def setup_data(self):
        org = Organization.objects.create(name="Hardening Org")
        user = User.objects.create_user(
            email="hardening@example.com",
            password="test",
            organization=org,
        )
        session = ChatSession.objects.create(
            organization=org,
            user=user,
            title="Hardening Session",
        )
        client = APIClient()
        client.force_authenticate(user=user)
        return {
            "org": org,
            "user": user,
            "session": session,
            "client": client,
        }

    def test_sync_empty_llm_response_returns_502(self, setup_data, monkeypatch):
        client = setup_data["client"]
        session = setup_data["session"]

        # Mock the LLM to return an empty response
        def mock_generate(*args, **kwargs):
            return LLMResponseDTO(
                content="",
                prompt_tokens=10,
                completion_tokens=0,
                total_tokens=10,
                latency_ms=100.0,
                finish_reason="stop",
                model="mock",
                estimated_cost_usd=0.0,
                metadata={},
            )

        from apps.knowledge.services.llm.mock_gateway import MockLLMGateway

        monkeypatch.setattr(MockLLMGateway, "generate", mock_generate)

        url = reverse("copilot:copilot-chat")
        response = client.post(
            url,
            {"session_id": str(session.id), "message": "Trigger empty"},
            format="json",
        )

        assert response.status_code == 502
        assert response.data.get("code") == "LLM_ERROR"

        # Verify user message is persisted but assistant message is not
        messages = ChatMessage.objects.filter(session=session).order_by("created_at")
        assert messages.count() == 1
        assert messages[0].role == MessageRole.USER
        assert messages[0].content == "Trigger empty"

    def test_stream_empty_llm_response_returns_error_event(
        self, setup_data, monkeypatch
    ):
        client = setup_data["client"]
        session = setup_data["session"]

        def mock_stream(*args, **kwargs):
            # Yield nothing (simulating empty stream)
            return iter([])

        from apps.knowledge.services.llm.mock_gateway import MockLLMGateway

        monkeypatch.setattr(MockLLMGateway, "stream", mock_stream)

        url = reverse("copilot:copilot-stream")
        response = client.post(
            url,
            {"session_id": str(session.id), "message": "Trigger empty stream"},
            format="json",
        )

        assert response.status_code == 200
        if getattr(response, "is_async", False):
            from asgiref.sync import async_to_sync

            async def consume():
                return b"".join([chunk async for chunk in response.streaming_content])

            content = async_to_sync(consume)().decode("utf-8")
        else:
            content = b"".join(response.streaming_content).decode("utf-8")

        # Should contain 'start' and 'error' events, not 'done'
        assert "event: start" in content
        assert "event: error" in content
        assert "LLM_ERROR" in content
        assert "event: done" not in content

        # Verify user message is persisted but assistant message is not
        messages = ChatMessage.objects.filter(session=session).order_by("created_at")
        assert messages.count() == 1
        assert messages[0].role == MessageRole.USER
        assert messages[0].content == "Trigger empty stream"
