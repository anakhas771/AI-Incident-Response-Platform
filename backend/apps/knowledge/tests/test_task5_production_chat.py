"""
Enterprise tests for Sprint 2 - Task 5: Production Chat API (POST /api/v1/copilot/chat/).
"""

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import Organization, User
from apps.knowledge.models import ChatMessage, ChatSession, MessageRole
from apps.knowledge.services.config import CopilotSettings


@pytest.mark.django_db
class TestProductionChatAPI:
    """
    Test suite for POST /api/v1/copilot/chat/ endpoint.
    """

    @pytest.fixture
    def setup_data(self):
        org = Organization.objects.create(name="Acme Corp", slug="acme-chat")
        other_org = Organization.objects.create(name="Other Corp", slug="other-chat")

        user = User.objects.create_user(
            email="user@acme.com",
            password="SecurePassword123!",
            organization=org,
        )
        other_user = User.objects.create_user(
            email="other@acme.com",
            password="SecurePassword123!",
            organization=org,
        )
        external_user = User.objects.create_user(
            email="user@other.com",
            password="SecurePassword123!",
            organization=other_org,
        )

        session = ChatSession.objects.create(
            organization=org,
            user=user,
            title="Production Chat Session",
        )

        client = APIClient()
        client.force_authenticate(user=user)

        return {
            "org": org,
            "other_org": other_org,
            "user": user,
            "other_user": other_user,
            "external_user": external_user,
            "session": session,
            "client": client,
        }

    def test_production_chat_success(self, setup_data):
        client = setup_data["client"]
        session = setup_data["session"]
        url = reverse("copilot:copilot-chat")

        payload = {
            "session_id": str(session.id),
            "message": "How do we handle database failover in production?",
        }
        response = client.post(url, payload, format="json")
        assert response.status_code == status.HTTP_200_OK

        data = response.data
        assert data["session_id"] == str(session.id)
        assert data["role"] == "assistant"
        assert "content" in data and len(data["content"]) > 0
        assert "citations" in data
        assert "confidence" in data
        assert "suggested_questions" in data
        assert "usage" in data
        assert data["usage"]["total_tokens"] > 0
        assert data["usage"]["provider"] == "mock"

        # Verify DB persistence
        messages = ChatMessage.objects.filter(session=session).order_by("created_at")
        assert messages.count() == 2
        assert messages[0].role == MessageRole.USER
        assert messages[0].content == payload["message"]
        assert messages[1].role == MessageRole.ASSISTANT
        assert messages[1].content == data["content"]

    def test_production_chat_empty_prompt_validation(self, setup_data):
        client = setup_data["client"]
        session = setup_data["session"]
        url = reverse("copilot:copilot-chat")

        response = client.post(
            url,
            {"session_id": str(session.id), "message": "   "},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_production_chat_prompt_too_long_validation(self, setup_data):
        client = setup_data["client"]
        session = setup_data["session"]
        url = reverse("copilot:copilot-chat")

        long_msg = "X" * (CopilotSettings.MAX_MESSAGE_LENGTH + 1)
        response = client.post(
            url,
            {"session_id": str(session.id), "message": long_msg},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_production_chat_archived_session(self, setup_data):
        client = setup_data["client"]
        session = setup_data["session"]
        session.is_archived = True
        session.save()

        url = reverse("copilot:copilot-chat")
        response = client.post(
            url,
            {"session_id": str(session.id), "message": "Can I chat?"},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data.get("code") == "SESSION_ARCHIVED"

    def test_production_chat_multi_tenant_isolation(self, setup_data):
        session = setup_data["session"]
        external_user = setup_data["external_user"]

        client = APIClient()
        client.force_authenticate(user=external_user)
        url = reverse("copilot:copilot-chat")

        response = client.post(
            url,
            {"session_id": str(session.id), "message": "Hello from other org?"},
            format="json",
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_production_chat_non_owner_isolation(self, setup_data):
        session = setup_data["session"]
        other_user = setup_data["other_user"]

        client = APIClient()
        client.force_authenticate(user=other_user)
        url = reverse("copilot:copilot-chat")

        response = client.post(
            url,
            {
                "session_id": str(session.id),
                "message": "Hello from same org other user?",
            },
            format="json",
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND
