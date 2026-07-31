"""
Service for semantic similarity search over document embeddings with metadata filtering
and strict organization isolation.
"""

import logging
import math
from typing import Any, Dict, List, Optional, Tuple

from apps.accounts.models import Organization
from apps.knowledge.models import DocumentEmbedding, DocumentStatus
from apps.knowledge.services.embedding_service import EmbeddingService

logger = logging.getLogger(__name__)


class VectorSearchService:
    """
    Enterprise Top-K vector similarity search service with cosine similarity calculation,
    metadata filtering, and organization tenant isolation.
    """

    def __init__(self, embedding_service: Optional[EmbeddingService] = None):
        self.embedding_service = embedding_service or EmbeddingService()

    @staticmethod
    def calculate_cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
        """
        Compute cosine similarity between two numeric vectors.
        """
        if not vec_a or not vec_b or len(vec_a) != len(vec_b):
            return 0.0

        dot_product = sum(a * b for a, b in zip(vec_a, vec_b, strict=False))
        norm_a = math.sqrt(sum(a * a for a in vec_a))
        norm_b = math.sqrt(sum(b * b for b in vec_b))

        if norm_a == 0.0 or norm_b == 0.0:
            return 0.0
        return max(0.0, min(1.0, dot_product / (norm_a * norm_b)))

    @staticmethod
    def _format_result(emb: DocumentEmbedding, sim: float) -> Dict[str, Any]:
        chunk = emb.chunk
        doc = chunk.document
        return {
            "chunk_id": str(chunk.id),
            "document_id": str(doc.id),
            "document_title": doc.title,
            "chunk_index": chunk.chunk_index,
            "content": chunk.content,
            "similarity_score": round(sim, 4),
            "page_number": chunk.metadata.get("page_number", 1),
            "metadata": chunk.metadata,
        }

    def _build_query(self, organization: Organization) -> Any:
        """
        Build base queryset for indexed document embeddings in the organization.
        """
        return DocumentEmbedding.objects.filter(
            chunk__document__organization=organization,
            chunk__document__status=DocumentStatus.INDEXED,
        ).select_related("chunk", "chunk__document")

    def _apply_filters(
        self,
        qs: Any,
        document_id: Optional[str] = None,
        date_from: Any = None,
        date_to: Any = None,
        tags: Optional[List[str]] = None,
    ) -> Any:
        """
        Apply metadata and date filters to the document embeddings queryset.
        """
        if document_id:
            qs = qs.filter(chunk__document_id=document_id)
        if date_from:
            qs = qs.filter(chunk__document__created_at__gte=date_from)
        if date_to:
            qs = qs.filter(chunk__document__created_at__lte=date_to)
        if tags:
            qs = qs.filter(chunk__document__tags__name__in=tags).distinct()
        return qs

    def _format_results(
        self, scored_items: List[Tuple[float, Any]], top_k: int
    ) -> List[Dict[str, Any]]:
        """
        Deduplicate by document ID and format top-k scored embedding results.
        """
        results: List[Dict[str, Any]] = []
        seen_doc_ids = set()
        for sim, emb in scored_items:
            doc_id = str(emb.chunk.document_id)
            if doc_id not in seen_doc_ids:
                seen_doc_ids.add(doc_id)
                results.append(self._format_result(emb, sim))
                if len(results) >= top_k:
                    break
        return results

    def _fallback_search(
        self,
        qs: Any,
        query_vec: List[float],
        top_k: int,
        min_similarity: float,
    ) -> List[Dict[str, Any]]:
        scored = []
        for emb in qs.iterator():
            sim = self.calculate_cosine_similarity(query_vec, list(emb.embedding))
            if sim >= min_similarity:
                scored.append((sim, emb))

        scored.sort(key=lambda x: x[0], reverse=True)
        return self._format_results(scored, top_k)

    def _execute_search(
        self,
        qs: Any,
        query_vec: List[float],
        top_k: int,
        min_similarity: float,
    ) -> List[Dict[str, Any]]:
        """
        Execute vector similarity search using pgvector or fallback to Python cosine search.
        """
        try:
            from pgvector.django import CosineDistance

            pg_qs = qs.annotate(
                distance=CosineDistance("embedding", query_vec)
            ).order_by("distance")[: max(50, top_k * 10)]

            scored_items = []
            for emb in pg_qs:
                sim = max(0.0, min(1.0, 1.0 - float(getattr(emb, "distance", 1.0))))
                if sim >= min_similarity:
                    scored_items.append((sim, emb))

            return self._format_results(scored_items, top_k)
        except Exception:
            return self._fallback_search(qs, query_vec, top_k, min_similarity)

    def search(
        self,
        query: str,
        organization: Organization,
        top_k: int = 5,
        document_id: Optional[str] = None,
        date_from: Any = None,
        date_to: Any = None,
        tags: Optional[List[str]] = None,
        min_similarity: float = 0.65,
    ) -> List[Dict[str, Any]]:
        """
        Perform similarity search for a query across an organization's indexed knowledge documents.
        """
        if not query or not query.strip():
            return []

        qs = self._build_query(organization)
        qs = self._apply_filters(
            qs=qs,
            document_id=document_id,
            date_from=date_from,
            date_to=date_to,
            tags=tags,
        )

        query_vec = self.embedding_service.generate_embedding(query)
        return self._execute_search(
            qs=qs,
            query_vec=query_vec,
            top_k=top_k,
            min_similarity=min_similarity,
        )
