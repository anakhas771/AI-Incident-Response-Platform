"""
Tests for ReRankerService sorting, thresholding, and limit logic.
"""

from apps.knowledge.services.dtos import RetrievedChunkDTO
from apps.knowledge.services.retrieval import ReRankerService


def test_reranker_sorting_and_threshold():
    c1 = RetrievedChunkDTO("chunk-1", "doc-1", "Title", 0, "Content 1", 0.60, 1, {})
    c2 = RetrievedChunkDTO("chunk-2", "doc-2", "Title", 1, "Content 2", 0.85, 2, {})
    c3 = RetrievedChunkDTO("chunk-3", "doc-3", "Title", 2, "Content 3", 0.70, 3, {})

    reranker = ReRankerService()

    # If threshold is 0.65: c1 (0.60) is dropped.
    # Sorted remaining: c2 (0.85), then c3 (0.70)
    results = reranker.rerank([c1, c2, c3], threshold=0.65, top_k=5)

    assert len(results) == 2
    assert results[0].chunk_id == "chunk-2"
    assert results[1].chunk_id == "chunk-3"


def test_reranker_top_k():
    c1 = RetrievedChunkDTO("chunk-1", "doc-1", "Title", 0, "Content 1", 0.90, 1, {})
    c2 = RetrievedChunkDTO("chunk-2", "doc-2", "Title", 1, "Content 2", 0.85, 2, {})
    c3 = RetrievedChunkDTO("chunk-3", "doc-3", "Title", 2, "Content 3", 0.80, 3, {})

    reranker = ReRankerService()

    # Limit to top_k = 2
    results = reranker.rerank([c1, c2, c3], threshold=0.50, top_k=2)

    assert len(results) == 2
    assert results[0].chunk_id == "chunk-1"
    assert results[1].chunk_id == "chunk-2"
