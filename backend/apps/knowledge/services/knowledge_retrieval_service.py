"""
Service responsible for orchestrating document retrieval and prompt preparation
for enterprise RAG workflows.
"""

import logging
from typing import Any, Dict, List, Optional

from apps.accounts.models import Organization
from apps.knowledge.services.prompt_builder import PromptBuilder
from apps.knowledge.services.vector_search_service import VectorSearchService

logger = logging.getLogger(__name__)


class KnowledgeRetrievalService:
    """
    Orchestration service connecting VectorSearchService with PromptBuilder
    to retrieve knowledge chunks and prepare LLM execution contexts.
    """

    def __init__(self, vector_search_service: Optional[VectorSearchService] = None):
        self.vector_search = vector_search_service or VectorSearchService()

    def retrieve_context(
        self,
        query: str,
        organization: Organization,
        top_k: int = 5,
        filters: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Retrieve relevant knowledge chunks and construct a ready-to-execute RAG prompt payload.
        """
        filters = filters or {}
        document_id = filters.get("document_id")
        date_from = filters.get("date_from")
        date_to = filters.get("date_to")
        tags = filters.get("tags")
        min_similarity = float(filters.get("min_similarity", 0.0))

        chunks: List[Dict[str, Any]] = self.vector_search.search(
            query=query,
            organization=organization,
            top_k=top_k,
            document_id=document_id,
            date_from=date_from,
            date_to=date_to,
            tags=tags,
            min_similarity=min_similarity,
        )

        prompt_payload = PromptBuilder.build_rag_prompt(
            question=query,
            chunks=chunks,
        )

        return {
            "chunks": chunks,
            "prompt_payload": prompt_payload,
            "total_retrieved": len(chunks),
        }
