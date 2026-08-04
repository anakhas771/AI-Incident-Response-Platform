"""
Tests for Celery tasks in the Enterprise RAG Knowledge Base app.
"""

from unittest.mock import patch

import pytest
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile

from apps.accounts.models import Organization
from apps.knowledge.models import (
    DocumentChunk,
    DocumentStatus,
    DocumentType,
    KnowledgeDocument,
)
from apps.knowledge.tasks import (
    delete_document_embeddings_task,
    process_document_task,
    reindex_document_task,
    retry_failed_documents_task,
)

User = get_user_model()


@pytest.fixture
def org(db):
    return Organization.objects.create(name="Task Test Org", slug="task-test-org")


@pytest.fixture
def user(db, org):
    return User.objects.create_user(
        email="task_user@acme.com", password="Password123!", organization=org
    )


@pytest.fixture
def uploaded_doc(db, org, user):
    file_obj = SimpleUploadedFile(
        "runbook.md",
        b"# Incident Runbook\n\n1. Contain immediately.\n2. Eradicate malware.",
    )
    return KnowledgeDocument.objects.create(
        organization=org,
        uploaded_by=user,
        title="Incident Runbook",
        file=file_obj,
        file_type=DocumentType.MD,
        status=DocumentStatus.UPLOADED,
    )


@pytest.mark.django_db
class TestKnowledgeTasks:
    def test_process_document_task_success(self, uploaded_doc):
        res = process_document_task(str(uploaded_doc.id))
        uploaded_doc.refresh_from_db()

        assert res["status"] == "success"
        assert uploaded_doc.status == DocumentStatus.INDEXED
        assert uploaded_doc.chunk_count > 0
        assert uploaded_doc.embedding_count == uploaded_doc.chunk_count
        assert DocumentChunk.objects.filter(document=uploaded_doc).count() > 0

    def test_process_document_task_not_found(self):
        res = process_document_task("00000000-0000-0000-0000-000000000000")
        assert res["status"] == "error"

    def test_reindex_document_task(self, uploaded_doc):
        process_document_task(str(uploaded_doc.id))
        uploaded_doc.refresh_from_db()
        assert uploaded_doc.status == DocumentStatus.INDEXED

        res = reindex_document_task(str(uploaded_doc.id))
        uploaded_doc.refresh_from_db()

        assert res["status"] == "success"
        assert uploaded_doc.status == DocumentStatus.INDEXED

    def test_delete_document_embeddings_task(self, uploaded_doc):
        process_document_task(str(uploaded_doc.id))
        assert DocumentChunk.objects.filter(document=uploaded_doc).count() > 0

        res = delete_document_embeddings_task(str(uploaded_doc.id))
        assert res["status"] == "success"
        assert DocumentChunk.objects.filter(document=uploaded_doc).count() == 0

    @patch("apps.knowledge.tasks.process_document_task.delay")
    def test_retry_failed_documents_task(self, mock_delay, uploaded_doc):
        uploaded_doc.status = DocumentStatus.FAILED
        uploaded_doc.save(update_fields=["status"])

        res = retry_failed_documents_task()
        assert res["status"] == "success"
        assert res["retried_count"] == 1
        mock_delay.assert_called_once_with(str(uploaded_doc.id))
