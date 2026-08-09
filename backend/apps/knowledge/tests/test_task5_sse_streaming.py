"""
Enterprise tests for Sprint 2 - Task 5: Server-Sent Events (SSE) Streaming API (POST /api/v1/copilot/stream/).
"""

import json

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import Organization, User
from apps.knowledge.api.copilot_views import format_sse_event
from apps.knowledge.models import ChatMessage, ChatSession
from apps.knowledge.services.dtos import StreamEventDTO
from apps.knowledge.services.orchestration.copilot_orchestrator import (
    CopilotOrchestrator,
)


@pytest.mark.django_db
class TestSSEStreamingAPI:
    """
    Test suite for POST /api/v1/copilot/stream/ SSE streaming endpoint.
    """

    @pytest.fixture
    def setup_data(self):
        org = Organization.objects.create(name="Stripe Streaming", slug="stripe-stream")
        user = User.objects.create_user(
            email="streamer@stripe.com",
            password="SecurePassword123!",
            organization=org,
        )
        session = ChatSession.objects.create(
            organization=org,
            user=user,
            title="Streaming Session",
        )
        client = APIClient()
        client.force_authenticate(user=user)
        return {
            "org": org,
            "user": user,
            "session": session,
            "client": client,
        }

    def test_sse_streaming_accept_header(self, setup_data):
        client = setup_data["client"]
        session = setup_data["session"]
        url = reverse("copilot:copilot-stream")

        payload = {
            "session_id": str(session.id),
            "message": "Test accept header",
        }
        response = client.post(
            url,
            payload,
            format="json",
            HTTP_ACCEPT="text/event-stream",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response["Content-Type"] == "text/event-stream"

    def test_sse_streaming_success_and_event_sequence(self, setup_data):
        client = setup_data["client"]
        session = setup_data["session"]
        url = reverse("copilot:copilot-stream")

        payload = {
            "session_id": str(session.id),
            "message": "Explain RAG vector similarity search.",
        }
        response = client.post(url, payload, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response["Content-Type"] == "text/event-stream"
        assert response["Cache-Control"] == "no-cache"
        assert response["X-Accel-Buffering"] == "no"

        raw_content = b"".join(response.streaming_content).decode("utf-8")
        blocks = [b.strip() for b in raw_content.split("\n\n") if b.strip()]

        events = []
        for block in blocks:
            if block.startswith(": heartbeat"):
                events.append({"event": "heartbeat", "data": "keep-alive"})
                continue
            lines = block.split("\n")
            event_type = None
            data_val = None
            for line in lines:
                if line.startswith("event: "):
                    event_type = line[7:].strip()
                elif line.startswith("data: "):
                    data_val = json.loads(line[6:].strip())
            if event_type:
                events.append({"event": event_type, "data": data_val})

        event_types = [e["event"] for e in events if e["event"] != "heartbeat"]

        # Verify event sequence: start -> token(s) -> citation -> confidence -> suggested_questions -> usage -> done
        assert event_types[0] == "start"
        assert "token" in event_types
        assert event_types[-5] == "citation"
        assert event_types[-4] == "confidence"
        assert event_types[-3] == "suggested_questions"
        assert event_types[-2] == "usage"
        assert event_types[-1] == "done"

        # Verify DB persistence after done
        messages = ChatMessage.objects.filter(session=session).order_by("created_at")
        assert messages.count() == 2
        assert messages[0].content == payload["message"]
        assert len(messages[1].content) > 0

    def test_sse_heartbeat_formatting(self):
        heartbeat_evt = StreamEventDTO(
            event_id=0,
            event_type="heartbeat",
            payload="keep-alive",
        )
        assert format_sse_event(heartbeat_evt) == ": heartbeat\n\n"

        token_evt = StreamEventDTO(
            event_id=1,
            event_type="token",
            payload="Hello",
        )
        formatted = format_sse_event(token_evt)
        assert "event: token" in formatted
        assert 'data: "Hello"' in formatted

    def test_sse_streaming_error_event_on_archived_session(self, setup_data):
        client = setup_data["client"]
        session = setup_data["session"]
        session.is_archived = True
        session.save()

        url = reverse("copilot:copilot-stream")
        response = client.post(
            url,
            {"session_id": str(session.id), "message": "Test error stream"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK

        raw_content = b"".join(response.streaming_content).decode("utf-8")
        assert "event: error" in raw_content
        assert "SESSION_ARCHIVED" in raw_content

    def test_sse_streaming_client_disconnect_abort_persistence(
        self, setup_data, monkeypatch
    ):
        session = setup_data["session"]
        orchestrator = CopilotOrchestrator()

        def mock_stream_disconnect(*args, **kwargs):
            raise GeneratorExit()

        monkeypatch.setattr(orchestrator.llm_gateway, "stream", mock_stream_disconnect)

        with pytest.raises(GeneratorExit):
            for _ in orchestrator.stream(session=session, message="Should not persist"):
                pass

        # Verify no incomplete turns were saved
        assert ChatMessage.objects.filter(session=session).count() == 0
