"""
Service for discovering similar past incidents and knowledge base recommendations
when a new incident occurs.
"""

import logging
import re
from typing import Any, Dict, List, Optional

from apps.incidents.models import Incident
from apps.knowledge.services.citation_service import CitationService
from apps.knowledge.services.embedding_service import EmbeddingService
from apps.knowledge.services.vector_search_service import VectorSearchService

logger = logging.getLogger(__name__)

_PDF_ARTIFACT_RE = re.compile(
    r"(?:xref\s+\d+\s+\d+.*|trailer\s*<<.*|startxref\s+\d+.*|endstream.*|endobj.*)$",
    re.IGNORECASE | re.DOTALL,
)


def _clean_knowledge_excerpt(value: Any, limit: int = 260) -> str:
    """Return a concise, human-readable knowledge excerpt without PDF internals."""
    text = " ".join(str(value or "").split())
    if not text:
        return ""

    # Drop common PDF trailer/object noise that should never reach the operator UI.
    match = _PDF_ARTIFACT_RE.search(text)
    if match and match.start() > 30:
        text = text[: match.start()].strip()

    for marker in ("endstream", "endobj", "xref", "trailer <<", "startxref"):
        marker_index = text.lower().find(marker)
        if marker_index > 30:
            text = text[:marker_index].strip()

    if len(text) > limit:
        text = text[: limit - 1].rstrip() + "…"

    return text


class SimilarIncidentService:
    """
    Enterprise similarity service matching newly created incidents against historical
    incidents and organization knowledge base runbooks.
    """

    def __init__(
        self,
        embedding_service: Optional[EmbeddingService] = None,
        vector_search_service: Optional[VectorSearchService] = None,
    ):
        self.embedding_service = embedding_service or EmbeddingService()
        self.vector_search = vector_search_service or VectorSearchService(
            embedding_service=self.embedding_service
        )

    def find_similar_for_incident(self, incident: Incident) -> Dict[str, Any]:
        """Generate organization-scoped incident and knowledge recommendations."""
        query_text = f"{incident.title} {incident.description} {incident.severity}"
        query_vec = self.embedding_service.generate_embedding(query_text)

        historical_incidents = (
            Incident.objects.filter(organization=incident.organization)
            .exclude(id=incident.id)
            .order_by("-created_at")[:50]
        )

        scored_incidents = []
        for past_inc in historical_incidents:
            past_text = f"{past_inc.title} {past_inc.description} {past_inc.severity}"
            past_vec = self.embedding_service.generate_embedding(past_text)
            sim = VectorSearchService.calculate_cosine_similarity(query_vec, past_vec)
            if sim >= 0.1:
                scored_incidents.append((sim, past_inc))

        scored_incidents.sort(key=lambda item: item[0], reverse=True)
        top_incidents = scored_incidents[:3]

        similar_incidents: List[Dict[str, Any]] = []
        previous_resolutions: List[str] = []

        for sim, past_inc in top_incidents:
            similar_incidents.append(
                {
                    "id": str(past_inc.id),
                    "title": past_inc.title,
                    "severity": past_inc.severity,
                    "status": past_inc.status,
                    "similarity": round(sim, 4),
                    "created_at": past_inc.created_at.isoformat()
                    if past_inc.created_at
                    else None,
                }
            )

            res_note = getattr(past_inc, "resolution_notes", "") or getattr(
                past_inc, "summary", ""
            )
            cleaned_resolution = _clean_knowledge_excerpt(res_note, 220)
            if cleaned_resolution:
                previous_resolutions.append(
                    f"{past_inc.title} ({round(sim * 100)}% similarity): {cleaned_resolution}"
                )

        kb_chunks = self.vector_search.search(
            query=query_text,
            organization=incident.organization,
            top_k=3,
        )
        citations = CitationService.extract_citations(kb_chunks)
        recommended_actions: List[str] = []

        for chunk in kb_chunks:
            doc_title = str(chunk.get("document_title") or "Runbook").strip()
            page_num = chunk.get("page_number", 1)
            excerpt = _clean_knowledge_excerpt(chunk.get("content"), 280)

            if not excerpt:
                continue

            first_sentence = re.split(r"(?<=[.!?])\s+", excerpt, maxsplit=1)[0].strip()
            if len(first_sentence) < 20:
                first_sentence = excerpt

            recommended_actions.append(
                f"Follow {doc_title} (Page {page_num}): {first_sentence}"
            )

        if not recommended_actions and not previous_resolutions:
            # Keep this as a true empty result instead of fabricating a recommendation.
            recommended_actions = []

        return {
            "similar_incidents": similar_incidents,
            "recommended_actions": recommended_actions,
            "previous_resolutions": previous_resolutions,
            "knowledge_citations": citations,
        }
