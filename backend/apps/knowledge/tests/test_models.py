"""
Tests for KnowledgeDocument, DocumentChunk, and DocumentEmbedding models.
"""

import pytest
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import IntegrityError

from apps.accounts.models import Organization
from apps.knowledge.models import (
    DocumentChunk,
    DocumentEmbedding,
    DocumentStatus,
    DocumentType,
    KnowledgeDocument,
)

User = get_user_model()


@pytest.fixture
def org(db):
    return Organization.objects.create(name="Acme Knowledge Org", slug="acme-kb-org")


@pytest.fixture
def user(db, org):
    return User.objects.create_user(
        email="kb_user@acme.com",
        password="Password123!",
        organization=org,
    )


@pytest.mark.django_db
class TestKnowledgeModels:
    def test_create_knowledge_document(self, org, user):
        dummy_file = SimpleUploadedFile("policy.txt", b"Security Policy Content")
        doc = KnowledgeDocument.objects.create(
            organization=org,
            uploaded_by=user,
            title="Security Policy",
            description="2026 Security Rules",
            file=dummy_file,
            file_type=DocumentType.TXT,
        )

        assert doc.status == DocumentStatus.UPLOADED
        assert doc.page_count == 0
        assert doc.word_count == 0
        assert "Security Policy" in str(doc)
        assert str(org.name) in str(doc)

    def test_create_document_chunk_and_embedding(self, org, user):
        dummy_file = SimpleUploadedFile("runbook.md", b"# Incident Runbook\nStep 1.")
        doc = KnowledgeDocument.objects.create(
            organization=org,
            uploaded_by=user,
            title="Incident Runbook",
            file=dummy_file,
            file_type=DocumentType.MD,
        )

        chunk = DocumentChunk.objects.create(
            document=doc,
            chunk_index=0,
            content="Step 1. Triage the incident immediately.",
            token_count=10,
            metadata={"page_number": 1, "headings": ["# Incident Runbook"]},
        )

        assert chunk.document == doc
        assert chunk.chunk_index == 0
        assert "Chunk #0" in str(chunk)

        embedding_vector = [0.1, -0.2, 0.5] + [0.0] * 1533
        embedding = DocumentEmbedding.objects.create(
            chunk=chunk,
            embedding=embedding_vector,
            embedding_model="mock-embed-v1",
            vector_dimension=1536,
        )

        assert embedding.chunk == chunk
        assert len(embedding.embedding) == 1536
        assert "Embedding for" in str(embedding)

    def test_chunk_unique_constraint(self, org, user):
        dummy_file = SimpleUploadedFile("test.txt", b"Test content")
        doc = KnowledgeDocument.objects.create(
            organization=org,
            uploaded_by=user,
            title="Test Doc",
            file=dummy_file,
            file_type=DocumentType.TXT,
        )

        DocumentChunk.objects.create(
            document=doc,
            chunk_index=0,
            content="First chunk",
        )

        with pytest.raises(IntegrityError):
            DocumentChunk.objects.create(
                document=doc,
                chunk_index=0,
                content="Duplicate index chunk",
            )

    def test_create_rag_query_log(self, org, user):
        from apps.knowledge.models import RAGQueryLog

        log = RAGQueryLog.objects.create(
            organization=org,
            user=user,
            question="What is the ransomware protocol?",
            retrieved_documents=[
                {"document_title": "Ransomware Runbook", "chunk_index": 0}
            ],
            similarity_scores=[0.85],
            answer="Summary of findings from Ransomware Runbook...",
            confidence_score=85,
        )

        assert log.organization == org
        assert log.user == user
        assert log.question == "What is the ransomware protocol?"
        assert len(log.retrieved_documents) == 1
        assert log.similarity_scores == [0.85]
        assert log.confidence_score == 85
        assert "RAGQueryLog" in str(log)
