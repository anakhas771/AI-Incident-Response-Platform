"""
Unit tests for Enterprise AI Copilot multi-tenant and user-scoping RBAC permissions.
"""

import pytest
from rest_framework.test import APIRequestFactory
from rest_framework.views import APIView

from apps.accounts.models import Organization, User
from apps.knowledge.models import ChatMessage, ChatSession, MessageRole
from apps.knowledge.permissions import IsCopilotSessionOwner


@pytest.mark.django_db
class TestCopilotPermissions:
    """
    Test suite for IsCopilotSessionOwner permission class.
    """

    def test_permission_granted_for_session_owner(self):
        org = Organization.objects.create(name="Stripe Org 1", slug="stripe-org-1")
        user = User.objects.create(email="user1@stripe.com", organization=org)
        session = ChatSession.objects.create(
            organization=org, user=user, title="Own Session"
        )

        factory = APIRequestFactory()
        request = factory.get("/api/v1/copilot/sessions/")
        request.user = user

        perm = IsCopilotSessionOwner()
        assert perm.has_permission(request, APIView())
        assert perm.has_object_permission(request, APIView(), session)

    def test_permission_denied_for_different_user_same_org(self):
        org = Organization.objects.create(name="Stripe Org 2", slug="stripe-org-2")
        owner = User.objects.create(email="owner2@stripe.com", organization=org)
        other_user = User.objects.create(email="other2@stripe.com", organization=org)
        session = ChatSession.objects.create(
            organization=org, user=owner, title="Owner Session"
        )

        factory = APIRequestFactory()
        request = factory.get("/api/v1/copilot/sessions/")
        request.user = other_user

        perm = IsCopilotSessionOwner()
        assert perm.has_permission(request, APIView())
        assert not perm.has_object_permission(request, APIView(), session)

    def test_permission_denied_for_different_organization(self):
        org1 = Organization.objects.create(name="Org 1", slug="org-1")
        org2 = Organization.objects.create(name="Org 2", slug="org-2")
        user1 = User.objects.create(email="user1@org1.com", organization=org1)
        user2 = User.objects.create(email="user2@org2.com", organization=org2)
        session = ChatSession.objects.create(
            organization=org1, user=user1, title="Org 1 Session"
        )

        factory = APIRequestFactory()
        request = factory.get("/api/v1/copilot/sessions/")
        request.user = user2

        perm = IsCopilotSessionOwner()
        assert perm.has_permission(request, APIView())
        assert not perm.has_object_permission(request, APIView(), session)

    def test_permission_on_chat_message(self):
        org = Organization.objects.create(name="Stripe Org 3", slug="stripe-org-3")
        user = User.objects.create(email="user3@stripe.com", organization=org)
        other_user = User.objects.create(email="other3@stripe.com", organization=org)
        session = ChatSession.objects.create(
            organization=org, user=user, title="Own Session"
        )
        message = ChatMessage.objects.create(
            session=session,
            role=MessageRole.USER,
            content="Hello",
        )

        factory = APIRequestFactory()
        request1 = factory.get("/api/v1/copilot/sessions/")
        request1.user = user

        request2 = factory.get("/api/v1/copilot/sessions/")
        request2.user = other_user

        perm = IsCopilotSessionOwner()
        assert perm.has_object_permission(request1, APIView(), message)
        assert not perm.has_object_permission(request2, APIView(), message)
