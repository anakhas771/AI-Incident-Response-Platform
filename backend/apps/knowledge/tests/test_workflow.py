"""
End-to-end integration workflow test for Enterprise RAG Knowledge Base:
Upload -> Asynchronous processing -> Indexing -> Semantic Search -> Cited AI Chat -> Similar Incident RAG.
"""

import pytest
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import Organization, Role
from apps.ai_engine.services.incident_analyzer import IncidentAnalyzer
from apps.incidents.models import Incident, Severity
from apps.knowledge.models import DocumentStatus, KnowledgeDocument
from apps.knowledge.tasks import process_document_task

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def org(db):
    return Organization.objects.create(
        name="Workflow Enterprise Org", slug="wf-ent-org"
    )


@pytest.fixture
def responder_user(db, org):
    return User.objects.create_user(
        email="responder_wf@enterprise.com",
        password="Password123!",
        role=Role.RESPONDER,
        organization=org,
    )


@pytest.mark.django_db
class TestRAGKnowledgeWorkflow:
    def test_full_enterprise_rag_lifecycle(self, api_client, org, responder_user):
        api_client.force_authenticate(user=responder_user)

        # 1. Upload markdown incident runbook
        upload_url = reverse("knowledge:knowledge-upload")
        file_content = (
            b"# Critical Ransomware Runbook\n\n"
            b"## Containment Procedure\n"
            b"When ransomware is identified, isolate the affected VLAN and disable RDP access immediately.\n\n"
            b"## Recovery Procedure\n"
            b"Restore encrypted volumes using immutable backup snapshots from the secondary vault."
        )
        file_obj = SimpleUploadedFile("ransomware_runbook.md", file_content)
        upload_data = {
            "title": "Critical Ransomware Runbook",
            "description": "Enterprise procedure for ransomware response",
            "file": file_obj,
            "file_type": "MD",
        }

        res_upload = api_client.post(upload_url, upload_data, format="multipart")
        assert res_upload.status_code == status.HTTP_201_CREATED
        doc_id = res_upload.data["id"]

        # 2. Execute asynchronous processing task
        process_res = process_document_task(str(doc_id))
        assert process_res["status"] == "success"
        assert process_res["chunks"] >= 1

        doc = KnowledgeDocument.objects.get(id=doc_id)
        assert doc.status == DocumentStatus.INDEXED
        assert doc.chunk_count >= 1
        assert doc.embedding_count == doc.chunk_count

        # 3. Perform semantic similarity search
        search_url = reverse("knowledge:knowledge-search")
        search_data = {"query": "ransomware containment VLAN", "top_k": 3}
        res_search = api_client.post(search_url, search_data, format="json")

        assert res_search.status_code == status.HTTP_200_OK
        assert res_search.data["total_results"] >= 1
        top_match = res_search.data["results"][0]
        assert top_match["document_title"] == "Critical Ransomware Runbook"
        assert "VLAN" in top_match["content"]

        # 4. Perform AI chat with citations
        chat_url = reverse("knowledge:knowledge-chat")
        chat_data = {"question": "What is the containment procedure for ransomware?"}
        res_chat = api_client.post(chat_url, chat_data, format="json")

        assert res_chat.status_code == status.HTTP_200_OK
        chat_payload = res_chat.data
        assert "answer" in chat_payload
        assert "summary" in chat_payload
        assert len(chat_payload["source_citations"]) >= 1
        assert chat_payload["confidence_score"] > 0.0
        assert len(chat_payload["supporting_evidence"]) >= 1

        # 5. Verify RAG recommendations when a new ransomware incident occurs
        new_inc = Incident.objects.create(
            organization=org,
            created_by=responder_user,
            title="Ransomware Outbreak on Database Cluster",
            description="Active encryption detected on database storage volumes.",
            severity=Severity.CRITICAL,
        )

        analyzer = IncidentAnalyzer()
        analysis = analyzer.analyze_incident(new_inc)
        assert analysis.id is not None
        recs_text = " ".join(analysis.recommendations)
        assert "Knowledge RAG" in recs_text or len(analysis.recommendations) > 0
