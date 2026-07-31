"""
Tests for RBAC and organization isolation permissions in Enterprise RAG Knowledge Base.
"""

from unittest.mock import MagicMock

import pytest
from django.contrib.auth import get_user_model

from apps.accounts.models import Organization
from apps.knowledge.models import DocumentType, KnowledgeDocument
from apps.knowledge.permissions import IsKnowledgeOrganizationMember

User = get_user_model()


@pytest.fixture
def org_a(db):
    return Organization.objects.create(name="Org A", slug="org-a")


@pytest.fixture
def org_b(db):
    return Organization.objects.create(name="Org B", slug="org-b")


@pytest.fixture
def user_a(db, org_a):
    return User.objects.create_user(
        email="user_a@org.com", password="Password123!", organization=org_a
    )


@pytest.fixture
def user_b(db, org_b):
    return User.objects.create_user(
        email="user_b@org.com", password="Password123!", organization=org_b
    )


@pytest.mark.django_db
class TestKnowledgePermissions:
    def test_has_permission_authenticated_with_org(self, user_a):
        perm = IsKnowledgeOrganizationMember()
        request = MagicMock()
        request.user = user_a
        assert perm.has_permission(request, None) is True

    def test_has_permission_unauthenticated(self):
        perm = IsKnowledgeOrganizationMember()
        request = MagicMock()
        request.user = None
        assert perm.has_permission(request, None) is False

    def test_has_object_permission_same_organization(self, org_a, user_a):
        perm = IsKnowledgeOrganizationMember()
        request = MagicMock()
        request.user = user_a
        doc = KnowledgeDocument.objects.create(
            organization=org_a,
            uploaded_by=user_a,
            title="Doc A",
            file="test.txt",
            file_type=DocumentType.TXT,
        )
        assert perm.has_object_permission(request, None, doc) is True

    def test_has_object_permission_different_organization(self, org_a, org_b, user_b):
        perm = IsKnowledgeOrganizationMember()
        request = MagicMock()
        request.user = user_b
        doc_a = KnowledgeDocument.objects.create(
            organization=org_a,
            title="Secret Doc A",
            file="secret.txt",
            file_type=DocumentType.TXT,
        )
        assert perm.has_object_permission(request, None, doc_a) is False
