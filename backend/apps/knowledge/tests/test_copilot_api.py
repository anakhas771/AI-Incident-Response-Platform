"""
API tests for Enterprise AI Copilot session and message REST endpoints.
"""

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import Organization, User
from apps.knowledge.models import ChatMessage, ChatSession, MessageRole


@pytest.mark.django_db
class TestCopilotAPI:
    """
    Test suite for Enterprise AI Copilot REST API endpoints.
    """

    @pytest.fixture
    def setup_data(self):
        org = Organization.objects.create(name="Stripe Security", slug="stripe-sec")
        other_org = Organization.objects.create(name="Other Corp", slug="other-corp")

        user = User.objects.create_user(
            email="security-lead@stripe.com",
            password="SecurePassword123!",
            organization=org,
        )
        other_user = User.objects.create_user(
            email="other@stripe.com",
            password="SecurePassword123!",
            organization=org,
        )
        external_user = User.objects.create_user(
            email="hacker@other.com",
            password="SecurePassword123!",
            organization=other_org,
        )

        client = APIClient()
        client.force_authenticate(user=user)

        return {
            "org": org,
            "other_org": other_org,
            "user": user,
            "other_user": other_user,
            "external_user": external_user,
            "client": client,
        }

    def test_create_session_endpoint(self, setup_data):
        client = setup_data["client"]
        url = reverse("copilot:session-list-create")

        response = client.post(url, {"title": "New RCA Chat"}, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["title"] == "New RCA Chat"
        assert str(response.data["organization"]) == str(setup_data["org"].id)
        assert str(response.data["user"]) == str(setup_data["user"].id)

    def test_list_sessions_endpoint_scoping(self, setup_data):
        client = setup_data["client"]
        org = setup_data["org"]
        user = setup_data["user"]
        other_user = setup_data["other_user"]
        external_user = setup_data["external_user"]

        s1 = ChatSession.objects.create(organization=org, user=user, title="My Chat 1")
        s2 = ChatSession.objects.create(
            organization=org, user=user, title="My Chat 2", is_archived=True
        )
        ChatSession.objects.create(
            organization=org, user=other_user, title="Other User Chat"
        )
        ChatSession.objects.create(
            organization=setup_data["other_org"],
            user=external_user,
            title="External Chat",
        )

        url = reverse("copilot:session-list-create")

        res_all = client.get(url)
        assert res_all.status_code == status.HTTP_200_OK
        results = res_all.data["results"] if "results" in res_all.data else res_all.data
        assert len(results) == 2
        session_ids = [s["id"] for s in results]
        assert str(s1.id) in session_ids
        assert str(s2.id) in session_ids

        res_archived = client.get(url, {"is_archived": "true"})
        assert res_archived.status_code == status.HTTP_200_OK
        results_archived = (
            res_archived.data["results"]
            if "results" in res_archived.data
            else res_archived.data
        )
        assert len(results_archived) == 1
        assert results_archived[0]["id"] == str(s2.id)

    def test_retrieve_session_endpoint(self, setup_data):
        client = setup_data["client"]
        session = ChatSession.objects.create(
            organization=setup_data["org"],
            user=setup_data["user"],
            title="My Session Detail",
        )

        url = reverse("copilot:session-detail", kwargs={"id": session.id})
        response = client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["title"] == "My Session Detail"

    def test_retrieve_other_user_session_denied(self, setup_data):
        client = setup_data["client"]
        session = ChatSession.objects.create(
            organization=setup_data["org"],
            user=setup_data["other_user"],
            title="Private Session",
        )

        url = reverse("copilot:session-detail", kwargs={"id": session.id})
        response = client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_patch_session_endpoint(self, setup_data):
        client = setup_data["client"]
        session = ChatSession.objects.create(
            organization=setup_data["org"],
            user=setup_data["user"],
            title="Original Title",
        )

        url = reverse("copilot:session-detail", kwargs={"id": session.id})
        response = client.patch(
            url,
            {"title": "Renamed Title", "is_archived": True},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["title"] == "Renamed Title"
        assert response.data["is_archived"] is True

        session.refresh_from_db()
        assert session.title == "Renamed Title"
        assert session.is_archived is True

    def test_delete_session_endpoint(self, setup_data):
        client = setup_data["client"]
        session = ChatSession.objects.create(
            organization=setup_data["org"],
            user=setup_data["user"],
            title="To Delete",
        )
        ChatMessage.objects.create(
            session=session,
            role=MessageRole.USER,
            content="Hello",
        )

        url = reverse("copilot:session-detail", kwargs={"id": session.id})
        response = client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not ChatSession.objects.filter(id=session.id).exists()
        assert not ChatMessage.objects.filter(session_id=session.id).exists()

    def test_list_messages_endpoint(self, setup_data):
        client = setup_data["client"]
        session = ChatSession.objects.create(
            organization=setup_data["org"],
            user=setup_data["user"],
            title="Conversation",
        )
        m1 = ChatMessage.objects.create(
            session=session,
            role=MessageRole.USER,
            content="Hello Copilot",
            tokens=5,
        )
        m2 = ChatMessage.objects.create(
            session=session,
            role=MessageRole.ASSISTANT,
            content="Hello Enterprise User!",
            tokens=10,
        )

        url = reverse("copilot:session-messages", kwargs={"id": session.id})
        response = client.get(url)
        assert response.status_code == status.HTTP_200_OK
        results = (
            response.data["results"] if "results" in response.data else response.data
        )
        assert len(results) == 2
        assert results[0]["id"] == str(m1.id)
        assert results[1]["id"] == str(m2.id)

    def test_list_messages_other_user_denied(self, setup_data):
        client = setup_data["client"]
        session = ChatSession.objects.create(
            organization=setup_data["org"],
            user=setup_data["other_user"],
            title="Private",
        )

        url = reverse("copilot:session-messages", kwargs={"id": session.id})
        response = client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_create_message_endpoint(self, setup_data):
        client = setup_data["client"]
        session = ChatSession.objects.create(
            organization=setup_data["org"],
            user=setup_data["user"],
            title="My Active Chat",
        )

        url = reverse("copilot:session-messages", kwargs={"id": session.id})
        response = client.post(
            url, {"content": "Explain how to debug database timeouts"}, format="json"
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["content"] is not None
        assert "Mock response" in response.data["content"]
        assert response.data["role"] == "assistant"
        assert response.data["citations"] == []
        assert response.data["confidence"]["level"] == "low"
