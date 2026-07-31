"""
Tests for DRF serializers in the Enterprise RAG Knowledge Base app.
"""

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile

from apps.knowledge.serializers import (
    KnowledgeChatRequestSerializer,
    KnowledgeDocumentUploadSerializer,
    KnowledgeSearchRequestSerializer,
)


@pytest.mark.django_db
class TestKnowledgeSerializers:
    def test_upload_serializer_valid_txt(self):
        dummy_file = SimpleUploadedFile("policy.txt", b"Content")
        data = {
            "title": "IT Policy",
            "description": "General IT policy",
            "file": dummy_file,
            "file_type": "TXT",
        }
        serializer = KnowledgeDocumentUploadSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
        assert serializer.validated_data["file_type"] == "TXT"

    def test_upload_serializer_invalid_type(self):
        dummy_file = SimpleUploadedFile("unknown.bin", b"010101")
        data = {
            "title": "Invalid File",
            "file": dummy_file,
            "file_type": "EXE",
        }
        serializer = KnowledgeDocumentUploadSerializer(data=data)
        assert not serializer.is_valid()
        assert "file_type" in serializer.errors

    def test_upload_serializer_rejects_placeholder_titles(self):
        dummy_file = SimpleUploadedFile("policy.txt", b"Content")
        for placeholder in ("string", "test", "example", "demo"):
            data = {
                "title": placeholder,
                "file": dummy_file,
                "file_type": "TXT",
            }
            serializer = KnowledgeDocumentUploadSerializer(data=data)
            assert not serializer.is_valid()
            assert "title" in serializer.errors
            assert "not allowed" in str(serializer.errors["title"][0]).lower()

    def test_upload_serializer_rejects_short_titles(self):
        dummy_file = SimpleUploadedFile("policy.txt", b"Content")
        data = {
            "title": "Doc",
            "file": dummy_file,
            "file_type": "TXT",
        }
        serializer = KnowledgeDocumentUploadSerializer(data=data)
        assert not serializer.is_valid()
        assert "title" in serializer.errors
        assert "at least 5 characters" in str(serializer.errors["title"][0]).lower()

    def test_search_request_serializer_defaults(self):

        data = {"query": "How do I mitigate DDoS attacks?"}
        serializer = KnowledgeSearchRequestSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
        assert serializer.validated_data["top_k"] == 5
        assert serializer.validated_data["min_similarity"] == 0.65

    def test_chat_request_serializer_valid(self):
        data = {
            "question": "What is the procedure for ransomware containment?",
            "tags": ["security", "runbook"],
        }
        serializer = KnowledgeChatRequestSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
        assert len(serializer.validated_data["tags"]) == 2
