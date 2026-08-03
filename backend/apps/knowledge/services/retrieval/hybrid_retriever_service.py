"""
Hybrid retriever service combining vector database search and keyword search.
"""

from typing import List, Optional

from apps.accounts.models import Organization
from apps.knowledge.services.config import CopilotSettings
from apps.knowledge.services.dtos.retrieval_dto import RetrievedChunkDTO
from apps.knowledge.services.vector_search_service import VectorSearchService


class HybridRetrieverService:
    """
    Orchestrates semantic vector retrieval and BM25/keyword keyword stubs.
    """

    def __init__(self, vector_search: Optional[VectorSearchService] = None) -> None:
        self.vector_search = vector_search or VectorSearchService()

    def _keyword_search_stub(
        self, query: str, organization: Organization, top_k: int
    ) -> List[RetrievedChunkDTO]:
        """
        Stub for future database-level keyword search (BM25 or full-text search).
        """
        return []

    def retrieve(
        self,
        query: str,
        organization: Organization,
        top_k: int = CopilotSettings.DEFAULT_TOP_K,
    ) -> List[RetrievedChunkDTO]:
        """
        Execute semantic vector search and merge with keyword search results.
        """
        # 1. Fetch semantic vector search results
        vector_results = self.vector_search.search(
            query=query,
            organization=organization,
            top_k=top_k,
            min_similarity=CopilotSettings.MIN_SIMILARITY_THRESHOLD,
        )

        vector_chunks = []
        for r in vector_results:
            vector_chunks.append(
                RetrievedChunkDTO(
                    chunk_id=r.get("chunk_id", ""),
                    document_id=r.get("document_id", ""),
                    document_title=r.get("document_title", ""),
                    chunk_index=r.get("chunk_index", 0),
                    content=r.get("content", ""),
                    similarity_score=r.get("similarity_score", 0.0),
                    page_number=r.get("page_number", 1),
                    metadata=r.get("metadata", {}),
                )
            )

        # 2. Fetch keyword search results if hybrid search is enabled
        keyword_chunks: List[RetrievedChunkDTO] = []
        if CopilotSettings.ENABLE_HYBRID_SEARCH:
            keyword_chunks = self._keyword_search_stub(query, organization, top_k)

        # 3. Merge and deduplicate results (retaining highest similarity scores)
        merged_chunks = self._merge_results(vector_chunks, keyword_chunks)

        return merged_chunks[:top_k]

    def _merge_results(
        self,
        vector_chunks: List[RetrievedChunkDTO],
        keyword_chunks: List[RetrievedChunkDTO],
    ) -> List[RetrievedChunkDTO]:
        """
        Merge vector and keyword chunks, deduplicating by chunk_id and keeping the highest similarity.
        """
        seen_chunks = {}
        for chunk in vector_chunks + keyword_chunks:
            if chunk.chunk_id not in seen_chunks:
                seen_chunks[chunk.chunk_id] = chunk
            else:
                existing = seen_chunks[chunk.chunk_id]
                if chunk.similarity_score > existing.similarity_score:
                    seen_chunks[chunk.chunk_id] = chunk

        # Return sorted by similarity score descending
        return sorted(
            seen_chunks.values(),
            key=lambda x: x.similarity_score,
            reverse=True,
        )
