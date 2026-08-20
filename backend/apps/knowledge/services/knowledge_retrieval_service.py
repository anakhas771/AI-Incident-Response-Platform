"""
Service responsible for orchestrating document retrieval and prompt preparation
for enterprise RAG workflows.
"""

import logging
from typing import Any, Dict, List, Optional

from apps.accounts.models import Organization
from apps.knowledge.services.dtos.memory_dto import ConversationContextDTO
from apps.knowledge.services.dtos.retrieval_dto import RetrievedChunkDTO
from apps.knowledge.services.prompts.prompt_builder import PromptBuilder
from apps.knowledge.services.vector_search_service import VectorSearchService

logger = logging.getLogger(__name__)


class KnowledgeRetrievalService:
    """
    Orchestration service connecting VectorSearchService with PromptBuilder
    to retrieve knowledge chunks and prepare LLM execution contexts.
    """

    def __init__(
        self,
        vector_search_service: Optional[VectorSearchService] = None,
        prompt_builder: Optional[PromptBuilder] = None,
    ):
        self.vector_search = vector_search_service or VectorSearchService()
        self.prompt_builder = prompt_builder or PromptBuilder()

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

        # Map chunks to DTOs
        retrieved_dtos = [
            RetrievedChunkDTO(
                chunk_id=str(c.get("chunk_id", f"chunk-{c.get('chunk_index', 0)}")),
                document_id=str(c.get("document_id", "")),
                document_title=str(c.get("document_title", "Unknown Document")),
                page_number=int(c.get("page_number", 1)),
                content=str(c.get("content", "")),
                similarity_score=float(c.get("similarity", 0.0)),
                chunk_index=int(c.get("chunk_index", 0)),
            )
            for c in chunks
        ]

        # Use new PromptBuilder
        prompt_ctx = self.prompt_builder.build_copilot_prompt(
            context=ConversationContextDTO(
                session_id="none", messages=[]
            ),  # No history for pure retrieval
            retrieved_chunks=retrieved_dtos,
            user_message=query,
            version="v1",
        )

        prompt_payload = {
            "system_prompt": prompt_ctx.system_prompt,
            "user_prompt": prompt_ctx.user_prompt,
            "context_text": prompt_ctx.context_text,
        }

        return {
            "chunks": chunks,
            "prompt_payload": prompt_payload,
            "total_retrieved": len(chunks),
        }
