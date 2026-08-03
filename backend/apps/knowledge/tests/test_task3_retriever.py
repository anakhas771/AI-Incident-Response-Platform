"""
Tests for HybridRetrieverService pipeline, merging, and deduplication.
"""

from unittest.mock import MagicMock

import pytest

from apps.accounts.models import Organization
from apps.knowledge.services.dtos import RetrievedChunkDTO
from apps.knowledge.services.retrieval import HybridRetrieverService
from apps.knowledge.services.vector_search_service import VectorSearchService


@pytest.mark.django_db
class TestHybridRetrieverService:
    def test_retrieve_pipeline_converts_to_dtos(self):
        org = Organization.objects.create(name="Stripe Retrieval", slug="stripe-ret")
        vector_search_mock = MagicMock(spec=VectorSearchService)
        vector_search_mock.search.return_value = [
            {
                "chunk_id": "chunk-1",
                "document_id": "doc-1",
                "document_title": "Security Guide",
                "chunk_index": 2,
                "content": "Perform log audit.",
                "similarity_score": 0.88,
                "page_number": 5,
                "metadata": {"tags": ["sec"]},
            }
        ]

        retriever = HybridRetrieverService(vector_search=vector_search_mock)
        chunks = retriever.retrieve("log audit", org)

        assert len(chunks) == 1
        chunk = chunks[0]
        assert isinstance(chunk, RetrievedChunkDTO)
        assert chunk.chunk_id == "chunk-1"
        assert chunk.document_title == "Security Guide"
        assert chunk.similarity_score == 0.88
        assert chunk.page_number == 5

    def test_hybrid_merge_and_deduplicate(self):
        retriever = HybridRetrieverService()

        # Build duplicate and non-duplicate RetrievedChunkDTOs
        c1 = RetrievedChunkDTO("c-1", "d-1", "Doc 1", 0, "Content 1", 0.85, 1, {})
        c2 = RetrievedChunkDTO(
            "c-1",
            "d-1",
            "Doc 1",
            0,
            "Content 1",
            0.92,
            1,
            {},
        )  # Higher similarity
        c3 = RetrievedChunkDTO("c-2", "d-2", "Doc 2", 1, "Content 2", 0.75, 2, {})

        merged = retriever._merge_results([c1], [c2, c3])
        assert len(merged) == 2
        assert merged[0].chunk_id == "c-1"
        assert merged[0].similarity_score == 0.92  # Kept the higher similarity score
        assert merged[1].chunk_id == "c-2"
        assert merged[1].similarity_score == 0.75

    def test_empty_retrieval(self):
        org = Organization.objects.create(
            name="Stripe Retrieval 3", slug="stripe-ret-3"
        )
        vector_search_mock = MagicMock(spec=VectorSearchService)
        vector_search_mock.search.return_value = []

        retriever = HybridRetrieverService(vector_search=vector_search_mock)
        chunks = retriever.retrieve("not found", org)
        assert len(chunks) == 0
