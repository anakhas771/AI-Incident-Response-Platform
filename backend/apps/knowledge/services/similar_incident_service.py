"""
Service for discovering similar past incidents and knowledge base recommendations
when a new incident occurs.
"""

import logging
from typing import Any, Dict, List, Optional

from apps.incidents.models import Incident
from apps.knowledge.services.citation_service import CitationService
from apps.knowledge.services.embedding_service import EmbeddingService
from apps.knowledge.services.vector_search_service import VectorSearchService

logger = logging.getLogger(__name__)


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
        """
        Generate embeddings for an incident, search previous incidents and knowledge base,
        and return actionable resolutions and recommendations.
        """
        query_text = f"{incident.title} {incident.description} {incident.severity}"
        query_vec = self.embedding_service.generate_embedding(query_text)

        # 1. Search previous incidents in the organization
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

        scored_incidents.sort(key=lambda x: x[0], reverse=True)
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
                    "created_at": (
                        past_inc.created_at.isoformat() if past_inc.created_at else None
                    ),
                }
            )
            # Inspect resolution notes or AI summary if available
            res_note = getattr(past_inc, "resolution_notes", "") or getattr(
                past_inc, "summary", ""
            )
            if res_note and str(res_note).strip():
                previous_resolutions.append(
                    f"[{past_inc.title}] (Similarity: {round(sim, 2)}): {res_note}"
                )
            else:
                previous_resolutions.append(
                    f"[{past_inc.title}] (Status: {past_inc.status}) resolved via standard procedure."
                )

        # 2. Search Knowledge Base runbooks
        kb_chunks = self.vector_search.search(
            query=query_text,
            organization=incident.organization,
            top_k=3,
        )
        citations = CitationService.extract_citations(kb_chunks)
        recommended_actions: List[str] = []

        for c in kb_chunks:
            doc_title = c.get("document_title", "Runbook")
            page_num = c.get("page_number", 1)
            content_snippet = str(c.get("content", "")).strip()
            first_sent = content_snippet.split(". ")[0].strip() + "."
            if len(first_sent) < 10:
                first_sent = content_snippet[:150]
            recommended_actions.append(
                f"Follow {doc_title} (Page {page_num}): {first_sent}"
            )

        if not recommended_actions and not previous_resolutions:
            recommended_actions.append(
                "No similar historical incidents or runbooks found. Proceed with triage."
            )

        return {
            "similar_incidents": similar_incidents,
            "recommended_actions": recommended_actions,
            "previous_resolutions": previous_resolutions,
            "knowledge_citations": citations,
        }
