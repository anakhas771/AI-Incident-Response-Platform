"""
Recommendation Engine service for generating mitigation, investigation, and prevention steps,
with RAG integration to ground recommendations in organization-specific knowledge base runbooks.
"""

import logging
from typing import Any, Dict, List, Optional

from apps.ai_engine.prompts.incident_prompts import build_recommendations_prompt
from apps.ai_engine.prompts.system_prompts import RECOMMENDATION_ENGINE_SYSTEM_PROMPT
from apps.ai_engine.services.llm_client import LLMClient
from apps.knowledge.services.citation_service import CitationService
from apps.knowledge.services.embedding_service import EmbeddingService
from apps.knowledge.services.vector_search_service import VectorSearchService

logger = logging.getLogger(__name__)


class RecommendationEngine:
    """
    Service responsible for generating immediate mitigation actions, systematic
    investigation checklists, and long-term prevention recommendations, grounded
    in organization RAG runbooks and knowledge base citations when available.
    """

    def __init__(
        self,
        llm_client: Optional[LLMClient] = None,
        embedding_service: Optional[EmbeddingService] = None,
        vector_search_service: Optional[VectorSearchService] = None,
    ):
        self.llm_client = llm_client or LLMClient()
        self.embedding_service = embedding_service or EmbeddingService()
        self.vector_search = vector_search_service or VectorSearchService(
            embedding_service=self.embedding_service
        )

    def recommend(
        self,
        title: str,
        description: str,
        category: Optional[str] = None,
        severity: Optional[str] = None,
        affected_components: Optional[List[str]] = None,
        organization: Optional[Any] = None,
        rag_context: Optional[str] = None,
        top_k: int = 3,
    ) -> Dict[str, Any]:
        """
        Generate recommendations dictionary with immediate_mitigation_steps,
        investigation_checklist, prevention_recommendations, and knowledge_citations.
        """
        if not title or not isinstance(title, str) or not title.strip():
            raise ValueError("Incident title must be a non-empty string.")
        if (
            not description
            or not isinstance(description, str)
            or not description.strip()
        ):
            raise ValueError("Incident description must be a non-empty string.")

        logger.info(
            "Generating recommendations title=%s category=%s severity=%s (org=%s)",
            title,
            category,
            severity,
            organization.id if organization and hasattr(organization, "id") else None,
        )

        citations: List[Dict[str, Any]] = []
        effective_rag_context = rag_context

        # Integrate RAG: retrieve relevant organization runbooks if an organization is provided
        if not effective_rag_context and organization:
            try:
                query_text = f"{title} {description} {category or ''} {severity or ''}"
                kb_chunks = self.vector_search.search(
                    query=query_text,
                    organization=organization,
                    top_k=top_k,
                )
                if kb_chunks:
                    citations = CitationService.extract_citations(kb_chunks)
                    context_lines = []
                    for chunk in kb_chunks:
                        doc_title = chunk.get("document_title", "Runbook")
                        page_num = chunk.get("page_number", 1)
                        content_snippet = str(chunk.get("content", "")).strip()
                        context_lines.append(
                            f"- [{doc_title}, Page {page_num}]: {content_snippet}"
                        )
                    effective_rag_context = "\n".join(context_lines)
                    logger.info(
                        "Retrieved %d RAG runbook citations for recommendation generation.",
                        len(citations),
                    )
            except Exception as exc:
                logger.warning("RAG retrieval failed during recommendation: %s", exc)

        prompt = build_recommendations_prompt(
            title=title,
            description=description,
            category=category,
            severity=severity,
            affected_components=affected_components,
            rag_context=effective_rag_context,
        )

        result = self.llm_client.generate_json(
            prompt=prompt,
            system_prompt=RECOMMENDATION_ENGINE_SYSTEM_PROMPT,
            expected_keys=[
                "immediate_mitigation_steps",
                "investigation_checklist",
                "prevention_recommendations",
            ],
        )

        def _ensure_list(key: str, fallback: str) -> List[str]:
            raw = result.get(key, [])
            if isinstance(raw, list):
                return [str(item) for item in raw]
            elif raw:
                return [str(raw)]
            return [fallback]

        immediate_mitigation_steps = _ensure_list(
            "immediate_mitigation_steps",
            "Isolate impacted subsystems and monitor error telemetry.",
        )
        investigation_checklist = _ensure_list(
            "investigation_checklist",
            "Verify audit logs and inspect application performance metrics.",
        )
        prevention_recommendations = _ensure_list(
            "prevention_recommendations",
            "Enhance test automation and refine alerting thresholds.",
        )

        return {
            "immediate_mitigation_steps": immediate_mitigation_steps,
            "investigation_checklist": investigation_checklist,
            "prevention_recommendations": prevention_recommendations,
            "knowledge_citations": citations,
            "rag_context_used": bool(effective_rag_context or citations),
        }
