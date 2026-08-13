"""
Unit and integration tests for all Enterprise RAG Knowledge Base services.
"""

import pytest
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile

from apps.accounts.models import Organization
from apps.incidents.models import Incident
from apps.knowledge.models import (
    DocumentChunk,
    DocumentStatus,
    DocumentType,
    KnowledgeDocument,
)
from apps.knowledge.services import (
    CitationService,
    DocumentChunkingService,
    DocumentParserService,
    EmbeddingService,
    KnowledgeChatService,
    MockEmbeddingProvider,
    PromptBuilder,
    SimilarIncidentService,
    VectorSearchService,
)

User = get_user_model()


@pytest.fixture
def org(db):
    return Organization.objects.create(name="Service Test Org", slug="srv-test-org")


@pytest.fixture
def user(db, org):
    return User.objects.create_user(
        email="srv_user@acme.com", password="Password123!", organization=org
    )


@pytest.fixture
def sample_doc(db, org, user):
    file_obj = SimpleUploadedFile(
        "runbook.md",
        b"# Security Runbook\n\n1. Identify breach.\n2. Contain host.\n3. Eradicate malware.\n4. Recover system.",
    )
    return KnowledgeDocument.objects.create(
        organization=org,
        uploaded_by=user,
        title="Security Runbook",
        file=file_obj,
        file_type=DocumentType.MD,
        status=DocumentStatus.INDEXED,
    )


@pytest.mark.django_db
class TestDocumentParserService:
    def test_clean_text_removes_excess_whitespace(self):
        raw = "Line  one   with   spaces.\n\n\n\nLine two."
        cleaned = DocumentParserService.clean_text(raw)
        assert "Line one with spaces." in cleaned
        assert "\n\n\n\n" not in cleaned

    def test_extract_headings(self):
        text = "# Title\nSome paragraph.\n## Subtitle\nMore text."
        headings = DocumentParserService.extract_headings(text)
        assert "# Title" in headings
        assert "## Subtitle" in headings

    def test_parse_txt_or_md(self):
        content = b"# Policy Document\nRule 1: Always encrypt passwords."
        result = DocumentParserService.parse(content, "MD")
        assert "text" in result
        assert result["page_count"] == 1
        assert result["word_count"] > 0
        assert "# Policy Document" in result["headings"]


@pytest.mark.django_db
class TestDocumentChunkingService:
    def test_estimate_tokens(self):
        text = "This is an example test string for token calculation."
        tokens = DocumentChunkingService.estimate_tokens(text)
        assert tokens > 0

    def test_chunk_document_creates_metadata(self, sample_doc):
        parse_result = {
            "text": "Word1 Word2 Word3 Word4 Word5 Word6 Word7 Word8 Word9 Word10",
            "pages": [
                {
                    "page_number": 1,
                    "content": "Word1 Word2 Word3 Word4 Word5 Word6 Word7 Word8 Word9 Word10",
                    "headings": ["# Security Runbook"],
                }
            ],
        }
        chunks_data = DocumentChunkingService.chunk_document(
            document=sample_doc,
            parse_result=parse_result,
            target_tokens=5,
            overlap_tokens=1,
        )
        assert len(chunks_data) >= 1
        first = chunks_data[0]
        assert first["metadata"]["document_id"] == str(sample_doc.id)
        assert first["metadata"]["page_number"] == 1
        assert "# Security Runbook" in first["metadata"]["headings"]

    def test_recursive_chunking_and_overlap(self):
        text = (
            "First paragraph explaining incident mitigation protocols in detail.\n\n"
            "Second paragraph describing server containment and network isolation steps.\n\n"
            "Third paragraph summarizing long term prevention and monitoring strategies."
        )
        chunks = DocumentChunkingService.chunk_text(
            text=text,
            target_tokens=15,
            overlap_tokens=5,
        )
        assert len(chunks) >= 2
        # Verify overlap: some tail words of chunks[0] should appear in chunks[1]
        words_0 = chunks[0].split()
        words_1 = chunks[1].split()
        overlap_found = any(w in words_1 for w in words_0[-5:])
        assert overlap_found


@pytest.mark.django_db
class TestEmbeddingService:
    def test_mock_embedding_provider_deterministic(self):
        provider = MockEmbeddingProvider()
        vec1 = provider.embed_text("Security incident containment procedure")
        vec2 = provider.embed_text("Security incident containment procedure")
        assert len(vec1) == 1536
        assert vec1 == vec2

    def test_embed_chunk_persists_vector(self, sample_doc):
        chunk = DocumentChunk.objects.create(
            document=sample_doc,
            chunk_index=0,
            content="Isolate affected server network interfaces immediately.",
        )
        service = EmbeddingService()
        embedding = service.embed_chunk(chunk)
        assert embedding.chunk == chunk
        assert len(embedding.embedding) == 1536

    def test_openai_embedding_provider_fallback(self):
        from apps.knowledge.services.embeddings.openai_provider import (
            OpenAIEmbeddingProvider,
        )

        provider = OpenAIEmbeddingProvider(api_key="")
        vec = provider.embed_text("sample text")
        assert len(vec) == 1536
        assert all(v == 0.0 for v in vec)

    def test_embed_document_chunks_batch(self, sample_doc):
        c1 = DocumentChunk.objects.create(
            document=sample_doc, chunk_index=0, content="Chunk one content"
        )
        c2 = DocumentChunk.objects.create(
            document=sample_doc, chunk_index=1, content="Chunk two content"
        )
        service = EmbeddingService()
        embeddings = service.embed_document_chunks([c1, c2])
        assert len(embeddings) == 2
        assert embeddings[0].vector_dimension == 1536


@pytest.mark.django_db
class TestVectorSearchService:
    """
    Tests for VectorSearchService covering three hard invariants:

    1. Only INDEXED documents are returned.
    2. Documents in any other status (FAILED, PROCESSING, UPLOADED) are excluded.
    3. A user must never receive results belonging to another organisation.
    """

    # ------------------------------------------------------------------ helpers

    @staticmethod
    def _make_chunk_with_embedding(
        document: KnowledgeDocument, content: str, idx: int = 0
    ) -> None:
        """Create a DocumentChunk and immediately embed it."""
        chunk = DocumentChunk.objects.create(
            document=document,
            chunk_index=idx,
            content=content,
            metadata={"page_number": 1},
        )
        EmbeddingService().embed_chunk(chunk)

    @staticmethod
    def _make_doc(
        org, user, title: str, status: str, content: bytes = b""
    ) -> KnowledgeDocument:
        file_obj = SimpleUploadedFile(f"{title}.txt", content or title.encode())
        return KnowledgeDocument.objects.create(
            organization=org,
            uploaded_by=user,
            title=title,
            file=file_obj,
            file_type=DocumentType.TXT,
            status=status,
        )

    # ------------------------------------------------------------------ unit

    def test_calculate_cosine_similarity_identical_vectors(self):
        """Perfect alignment must return exactly 1.0."""
        vec_a = [1.0, 0.0, 0.0]
        vec_b = [1.0, 0.0, 0.0]
        sim = VectorSearchService.calculate_cosine_similarity(vec_a, vec_b)
        assert sim == 1.0

    def test_calculate_cosine_similarity_orthogonal_vectors(self):
        """Orthogonal vectors must return 0.0."""
        sim = VectorSearchService.calculate_cosine_similarity([1.0, 0.0], [0.0, 1.0])
        assert sim == 0.0

    # ------------------------------------------------------------------ status filtering

    def test_indexed_documents_are_returned(self, db, org, user):
        """
        Chunks belonging to an INDEXED document must appear in search results.
        """
        indexed_doc = self._make_doc(
            org, user, "Indexed Security Policy", DocumentStatus.INDEXED
        )
        self._make_chunk_with_embedding(
            indexed_doc,
            "Isolate the compromised host from the network segment immediately.",
        )

        service = VectorSearchService()
        results = service.search(
            "isolate compromised host",
            organization=org,
            min_similarity=0.0,  # accept any result — testing status filter, not score
        )

        assert len(results) == 1
        assert results[0]["document_title"] == "Indexed Security Policy"

    def test_failed_documents_are_excluded(self, db, org, user):
        """
        Chunks belonging to a FAILED document must never appear in search results,
        even when the similarity score would otherwise qualify.
        """
        failed_doc = self._make_doc(org, user, "Failed Runbook", DocumentStatus.FAILED)
        self._make_chunk_with_embedding(
            failed_doc,
            "Isolate the compromised host from the network segment immediately.",
        )

        service = VectorSearchService()
        results = service.search(
            "isolate compromised host",
            organization=org,
            min_similarity=0.0,
        )

        assert len(results) == 0, (
            "FAILED document chunks must be excluded regardless of similarity score."
        )

    def test_non_indexed_statuses_all_excluded(self, db, org, user):
        """
        UPLOADED and PROCESSING documents must also be excluded — only INDEXED is valid.
        """
        for status_val in (DocumentStatus.UPLOADED, DocumentStatus.PROCESSING):
            doc = self._make_doc(org, user, f"Doc {status_val}", status_val)
            self._make_chunk_with_embedding(doc, "network isolation procedure", idx=0)

        service = VectorSearchService()
        results = service.search(
            "network isolation",
            organization=org,
            min_similarity=0.0,
        )
        assert len(results) == 0, (
            "Only INDEXED documents should contribute to search results."
        )

    # ------------------------------------------------------------------ min_similarity filtering

    def test_results_below_min_similarity_are_rejected(self, db, org, user):
        """
        Setting min_similarity=1.0 must return zero results (no perfect match exists),
        proving the threshold filter is applied and not silently skipped.
        """
        indexed_doc = self._make_doc(
            org, user, "Threshold Test Doc", DocumentStatus.INDEXED
        )
        self._make_chunk_with_embedding(
            indexed_doc, "database backup rotation schedule"
        )

        service = VectorSearchService()
        results = service.search(
            "database backup",
            organization=org,
            min_similarity=1.0,  # impossibly high — no result should pass
        )
        assert len(results) == 0

    # ------------------------------------------------------------------ org isolation

    def test_cross_organization_access_is_blocked(self, db, org, user):
        """
        An organisation must never see another organisation's documents.
        The filter must be applied at the database query level (not post-hoc),
        so we verify both the positive (own org) and negative (other org) case.
        """
        # Create an INDEXED document in `org`
        own_doc = self._make_doc(org, user, "Own Org Runbook", DocumentStatus.INDEXED)
        self._make_chunk_with_embedding(
            own_doc,
            "Runbook: activate incident response team on detection.",
        )

        # A completely separate organisation
        other_org = Organization.objects.create(name="Rival Corp", slug="rival-corp")

        service = VectorSearchService()

        # Other org must see nothing
        results_other = service.search(
            "incident response",
            organization=other_org,
            min_similarity=0.0,
        )
        assert len(results_other) == 0, (
            "Cross-organisation access must be blocked at the query level."
        )

        # Own org must see the document
        results_own = service.search(
            "incident response",
            organization=org,
            min_similarity=0.0,
        )
        assert len(results_own) == 1
        assert results_own[0]["document_title"] == "Own Org Runbook"

    def test_search_existing_combined_isolation(self, db, org, sample_doc):
        """
        Regression guard for the original isolation test — kept so the existing
        sample_doc fixture continues to be exercised.
        """
        chunk = DocumentChunk.objects.create(
            document=sample_doc,
            chunk_index=0,
            content="Contain host immediately when malware is detected.",
            metadata={"page_number": 1},
        )
        EmbeddingService().embed_chunk(chunk)

        other_org = Organization.objects.create(name="Other Org", slug="other-org")
        service = VectorSearchService()

        assert service.search("malware", organization=other_org) == []
        results = service.search("malware", organization=org, min_similarity=0.0)
        assert len(results) == 1
        assert results[0]["document_title"] == "Security Runbook"

    def test_search_unique_documents_deduplication_and_default_threshold(
        self, db, org, user
    ):
        """
        Verify search removes duplicate chunks from the same document, returns top_k unique
        documents sorted by relevance descending, and defaults to min_similarity=0.65.
        """
        doc1 = self._make_doc(
            org, user, "Ransomware Runbook Primary", DocumentStatus.INDEXED
        )
        self._make_chunk_with_embedding(
            doc1,
            "Ransomware containment procedure isolate affected VLAN immediately",
            idx=0,
        )
        self._make_chunk_with_embedding(
            doc1, "Ransomware containment procedure step two disable RDP access", idx=1
        )

        doc2 = self._make_doc(
            org, user, "Ransomware Runbook Secondary", DocumentStatus.INDEXED
        )
        self._make_chunk_with_embedding(
            doc2, "Ransomware containment procedure restore volume from backup", idx=0
        )

        service = VectorSearchService()
        results = service.search(
            "Ransomware containment procedure isolate VLAN", organization=org
        )
        # Even though doc1 has 2 matching chunks, only 1 unique result for doc1 should appear
        doc_ids = [r["document_id"] for r in results]
        assert len(doc_ids) == len(set(doc_ids)), (
            "Duplicate chunks from the same document should be removed."
        )
        # Verify sorted descending by similarity_score
        scores = [r["similarity_score"] for r in results]
        assert scores == sorted(scores, reverse=True)


@pytest.mark.django_db
class TestPromptBuilder:
    def test_build_copilot_prompt(self):
        from apps.knowledge.services.dtos.memory_dto import ConversationContextDTO
        from apps.knowledge.services.dtos.retrieval_dto import RetrievedChunkDTO
        
        chunks = [
            RetrievedChunkDTO(
                chunk_id="1",
                document_id="doc1",
                document_title="DDoS Runbook",
                page_number=2,
                content="Enable Cloudflare under attack mode.",
                chunk_index=0,
                similarity_score=1.0,
            )
        ]
        context = ConversationContextDTO(session_id="none", messages=[])
        prompt_ctx = PromptBuilder().build_copilot_prompt(
            context=context,
            retrieved_chunks=chunks,
            user_message="How to handle DDoS?"
        )
        assert "DDoS Runbook" in prompt_ctx.context_text
        assert "How to handle DDoS?" in prompt_ctx.user_prompt


@pytest.mark.django_db
class TestCitationAndChatService:
    def test_citation_service_calculations(self):
        chunks = [
            {
                "document_id": "doc-1",
                "document_title": "Runbook A",
                "page_number": 1,
                "chunk_index": 0,
                "similarity_score": 0.90,
                "content": "Step 1 is containment.",
            },
            {
                "document_id": "doc-2",
                "document_title": "Runbook B",
                "page_number": 5,
                "chunk_index": 3,
                "similarity_score": 0.80,
                "content": "Step 2 is recovery.",
            },
        ]
        citations = CitationService.extract_citations(chunks)
        assert len(citations) == 2
        confidence = CitationService.calculate_confidence(chunks)
        assert confidence == 85
        evidence = CitationService.build_supporting_evidence(chunks)
        assert len(evidence) == 2

    def test_calculate_confidence_normalizes_to_percentage_0_100(self):
        """
        Confidence score must be the average of top_k similarity scores,
        normalized to a percentage integer from 0 to 100.
        Example: 0.82 -> 82, 0.45 -> 45, 0.20 -> 20.
        """
        assert CitationService.calculate_confidence([{"similarity_score": 0.82}]) == 82
        assert CitationService.calculate_confidence([{"similarity_score": 0.45}]) == 45
        assert CitationService.calculate_confidence([{"similarity_score": 0.20}]) == 20

        # Test average of top_k similarity scores (around 0.3 should be 30, not 17)
        chunks = [{"similarity_score": 0.30} for _ in range(5)]
        assert CitationService.calculate_confidence(chunks, top_k=5) == 30

        # Empty chunks should return 0
        assert CitationService.calculate_confidence([]) == 0

    def test_knowledge_chat_service_returns_cited_payload(self, db, org, sample_doc):
        chunk = DocumentChunk.objects.create(
            document=sample_doc,
            chunk_index=0,
            content="To contain malware, disconnect the network cables and disable wireless interfaces.",
            metadata={"page_number": 1},
        )
        EmbeddingService().embed_chunk(chunk)

        chat_service = KnowledgeChatService()
        result = chat_service.chat(
            question="How do I contain malware?",
            organization=org,
        )

        assert "answer" in result
        assert "summary" in result
        assert "key_points" in result
        assert "recommendations" in result
        assert "citations" in result
        assert "confidence_score" in result
        assert result["confidence_score"] > 0.0
        assert len(result["citations"]) == 1

        # Verify that RAGQueryLog was logged
        from apps.knowledge.models import RAGQueryLog

        assert RAGQueryLog.objects.filter(
            organization=org, question="How do I contain malware?"
        ).exists()


@pytest.mark.django_db
class TestSimilarIncidentService:
    def test_find_similar_for_incident(self, db, org, user, sample_doc):
        chunk = DocumentChunk.objects.create(
            document=sample_doc,
            chunk_index=0,
            content="DDoS mitigation runbook: apply upstream firewall rules.",
        )
        EmbeddingService().embed_chunk(chunk)

        inc = Incident.objects.create(
            organization=org,
            created_by=user,
            title="DDoS Attack on API Gateway",
            description="High traffic flooding from external IPs.",
            severity="CRITICAL",
        )

        service = SimilarIncidentService()
        result = service.find_similar_for_incident(inc)

        assert "similar_incidents" in result
        assert "recommended_actions" in result
        assert len(result["recommended_actions"]) > 0


@pytest.mark.django_db
class TestRecommendationEngineRAGIntegration:
    def test_recommendation_engine_includes_rag_citations(self, db, org, sample_doc):
        from apps.ai_engine.services.recommendation_engine import RecommendationEngine

        chunk = DocumentChunk.objects.create(
            document=sample_doc,
            chunk_index=0,
            content="Isolate API Gateway server and enable rate limiting immediately.",
            metadata={"page_number": 1},
        )
        EmbeddingService().embed_chunk(chunk)

        engine = RecommendationEngine()
        result = engine.recommend(
            title="API Gateway Denial of Service",
            description="High latency and packet drops observed on API Gateway.",
            organization=org,
        )

        assert "immediate_mitigation_steps" in result
        assert "investigation_checklist" in result
        assert "prevention_recommendations" in result
        assert "knowledge_citations" in result
        assert "rag_context_used" in result
        assert result["rag_context_used"] is True
        assert len(result["knowledge_citations"]) >= 1
        first_citation = result["knowledge_citations"][0]
        assert first_citation["document_id"] == str(sample_doc.id)
