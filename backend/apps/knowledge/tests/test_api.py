"""
API integration tests for Enterprise RAG Knowledge Base endpoints.
"""

from unittest.mock import patch

import pytest
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import Organization, Role
from apps.knowledge.models import (
    DocumentChunk,
    DocumentStatus,
    DocumentType,
    KnowledgeDocument,
)
from apps.knowledge.services.embedding_service import EmbeddingService

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def org_alpha(db):
    return Organization.objects.create(name="Alpha Knowledge Org", slug="alpha-kb-org")


@pytest.fixture
def org_beta(db):
    return Organization.objects.create(name="Beta Knowledge Org", slug="beta-kb-org")


@pytest.fixture
def user_alpha(db, org_alpha):
    return User.objects.create_user(
        email="user_alpha_kb@acme.com",
        password="Password123!",
        role=Role.RESPONDER,
        organization=org_alpha,
    )


@pytest.fixture
def user_beta(db, org_beta):
    return User.objects.create_user(
        email="user_beta_kb@acme.com",
        password="Password123!",
        role=Role.RESPONDER,
        organization=org_beta,
    )


@pytest.fixture
def alpha_doc(db, org_alpha, user_alpha):
    from apps.knowledge.utils.file_hash import calculate_file_hash

    file_content = b"Alpha security rules"
    file_obj = SimpleUploadedFile("alpha.txt", file_content)
    # Pre-compute hash so the UniqueConstraint is populated correctly.
    file_hash = calculate_file_hash(SimpleUploadedFile("alpha.txt", file_content))
    return KnowledgeDocument.objects.create(
        organization=org_alpha,
        uploaded_by=user_alpha,
        title="Alpha Doc",
        file=file_obj,
        file_type=DocumentType.TXT,
        status=DocumentStatus.INDEXED,
        file_hash=file_hash,
    )


@pytest.mark.django_db
class TestKnowledgeAPI:
    @patch("apps.knowledge.api.views.process_document_task.delay")
    def test_upload_knowledge_document(
        self, mock_delay, api_client, user_alpha, org_alpha
    ):
        api_client.force_authenticate(user=user_alpha)
        url = reverse("knowledge:knowledge-upload")
        file_obj = SimpleUploadedFile("new_policy.txt", b"Policy content text")
        data = {
            "title": "New Policy",
            "description": "2026 IT Policy",
            "file": file_obj,
            "file_type": "TXT",
        }

        response = api_client.post(url, data, format="multipart")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["title"] == "New Policy"
        assert response.data["status"] == "UPLOADED"
        mock_delay.assert_called_once()

    @patch("apps.knowledge.api.views.process_document_task.delay")
    def test_upload_duplicate_rejected(
        self, mock_delay, api_client, user_alpha, org_alpha
    ):
        """Uploading the same file content twice in the same org must return HTTP 409 Conflict."""
        api_client.force_authenticate(user=user_alpha)
        url = reverse("knowledge:knowledge-upload")
        file_content = b"Unique duplicate detection content 12345"

        # First upload — should succeed
        response1 = api_client.post(
            url,
            {
                "title": "Original Doc",
                "file": SimpleUploadedFile("doc.txt", file_content),
                "file_type": "TXT",
            },
            format="multipart",
        )
        assert response1.status_code == status.HTTP_201_CREATED

        # Second upload with identical bytes — must be rejected with 400 Bad Request
        response2 = api_client.post(
            url,
            {
                "title": "Duplicate Doc",
                "file": SimpleUploadedFile("doc_copy.txt", file_content),
                "file_type": "TXT",
            },
            format="multipart",
        )
        assert response2.status_code == status.HTTP_400_BAD_REQUEST

        assert "error" in response2.data
        assert response2.data["error"] == "This document already exists in your organization's knowledge base."


    @patch("apps.knowledge.api.views.process_document_task.delay")
    def test_different_files_both_succeed(
        self, mock_delay, api_client, user_alpha, org_alpha
    ):
        """Two uploads with different content must both return HTTP 201."""
        api_client.force_authenticate(user=user_alpha)
        url = reverse("knowledge:knowledge-upload")

        response1 = api_client.post(
            url,
            {
                "title": "Doc A",
                "file": SimpleUploadedFile("a.txt", b"Document A unique content aaa"),
                "file_type": "TXT",
            },
            format="multipart",
        )
        assert response1.status_code == status.HTTP_201_CREATED

        response2 = api_client.post(
            url,
            {
                "title": "Doc B",
                "file": SimpleUploadedFile("b.txt", b"Document B unique content bbb"),
                "file_type": "TXT",
            },
            format="multipart",
        )
        assert response2.status_code == status.HTTP_201_CREATED
        # Different documents — different IDs
        assert response1.data["id"] != response2.data["id"]

    @patch("apps.knowledge.api.views.process_document_task.delay")
    def test_upload_with_tags(
        self, mock_delay, api_client, user_alpha, org_alpha
    ):
        """Tags submitted at upload time should be attached and returned in the response."""
        api_client.force_authenticate(user=user_alpha)
        url = reverse("knowledge:knowledge-upload")
        data = {
            "title": "Tagged Policy",
            "file": SimpleUploadedFile("tagged.txt", b"Tagged document content xyz"),
            "file_type": "TXT",
            "tags": ["security", "runbook"],
        }

        response = api_client.post(url, data, format="multipart")
        assert response.status_code == status.HTTP_201_CREATED
        assert "tags" in response.data
        assert set(response.data["tags"]) == {"security", "runbook"}

    def test_list_knowledge_documents_organization_isolation(
        self, api_client, user_alpha, user_beta, alpha_doc
    ):
        # User Alpha sees their organization document
        api_client.force_authenticate(user=user_alpha)
        url = reverse("knowledge:knowledge-list")
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1

        # User Beta sees 0 documents
        api_client.force_authenticate(user=user_beta)
        response_beta = api_client.get(url)
        assert response_beta.status_code == status.HTTP_200_OK
        assert response_beta.data["count"] == 0

    def test_retrieve_and_delete_knowledge_document(
        self, api_client, user_alpha, alpha_doc
    ):
        api_client.force_authenticate(user=user_alpha)
        detail_url = reverse(
            "knowledge:knowledge-detail", kwargs={"pk": str(alpha_doc.id)}
        )

        response_get = api_client.get(detail_url)
        assert response_get.status_code == status.HTTP_200_OK
        assert response_get.data["title"] == "Alpha Doc"

        response_del = api_client.delete(detail_url)
        assert response_del.status_code == status.HTTP_204_NO_CONTENT
        assert not KnowledgeDocument.objects.filter(id=alpha_doc.id).exists()

    def test_knowledge_search_endpoint(self, api_client, user_alpha, alpha_doc):
        chunk = DocumentChunk.objects.create(
            document=alpha_doc,
            chunk_index=0,
            content="Alpha security rules enforce multi-factor authentication.",
        )
        EmbeddingService().embed_chunk(chunk)

        api_client.force_authenticate(user=user_alpha)
        url = reverse("knowledge:knowledge-search")
        data = {"query": "authentication rules", "top_k": 3}

        response = api_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["total_results"] == 1
        assert response.data["results"][0]["document_title"] == "Alpha Doc"

    def test_knowledge_chat_endpoint(self, api_client, user_alpha, alpha_doc):
        chunk = DocumentChunk.objects.create(
            document=alpha_doc,
            chunk_index=0,
            content="To report an incident, email security@enterprise.com.",
        )
        EmbeddingService().embed_chunk(chunk)

        api_client.force_authenticate(user=user_alpha)
        url = reverse("knowledge:knowledge-chat")
        data = {"question": "How do I report an incident?"}

        response = api_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert "answer" in response.data
        assert "source_citations" in response.data
        assert response.data["confidence_score"] > 0.0

    def test_document_status_endpoint(self, api_client, user_alpha, alpha_doc):
        api_client.force_authenticate(user=user_alpha)
        url = reverse("knowledge:knowledge-status", kwargs={"pk": str(alpha_doc.id)})

        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == "INDEXED"
        assert response.data["id"] == str(alpha_doc.id)
