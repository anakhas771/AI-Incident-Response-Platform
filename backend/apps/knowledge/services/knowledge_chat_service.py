"""
Service orchestrating end-to-end Enterprise RAG AI chat, combining semantic retrieval,
LLM prompt execution, and citation/evidence payload construction.
"""

import logging
from typing import Any, Dict, Optional

from apps.accounts.models import Organization
from apps.ai_engine.services.llm_client import LLMClient
from apps.knowledge.services.citation_service import CitationService
from apps.knowledge.services.knowledge_retrieval_service import (
    KnowledgeRetrievalService,
)

logger = logging.getLogger(__name__)


class KnowledgeChatService:
    """
    Enterprise RAG chat service generating answers with summary, supporting evidence,
    source citations, confidence score, and related documents.
    """

    def __init__(
        self,
        retrieval_service: Optional[KnowledgeRetrievalService] = None,
        llm_client: Optional[LLMClient] = None,
    ):
        self.retrieval_service = retrieval_service or KnowledgeRetrievalService()
        self.llm_client = llm_client or LLMClient()

    def _generate_fallback_answer(
        self, question: str, chunks: list[Dict[str, Any]], confidence: int = 0
    ) -> str:
        """
        Generate a well-structured RAG response summarizing retrieved evidence without hallucination.
        """
        if not chunks:
            return (
                "I searched the organization's knowledge base but could not find any "
                f"documents directly addressing: '{question}'. Please upload relevant runbooks or security policies."
            )

        top_chunk = chunks[0]
        doc_title = top_chunk.get("document_title", "Document")
        page_num = top_chunk.get("page_number", 1)
        snippet = str(top_chunk.get("content", "")).strip()

        first_sentence = snippet.split(". ")[0].strip()
        if not first_sentence.endswith("."):
            first_sentence += "."

        uncertainty_note = ""
        if confidence < 50:
            uncertainty_note = "\n\nNote: Confidence is low for this query; please verify with authoritative team documentation."

        return (
            f"Summary of findings from '{doc_title}' (Page {page_num}):\n\n"
            f"{first_sentence} Standard organizational response procedures should be followed according to this documentation. [Source: {doc_title}, Page {page_num}]"
            f"{uncertainty_note}"
        )

    def chat(
        self,
        question: str,
        organization: Organization,
        filters: Optional[Dict[str, Any]] = None,
        user: Any = None,
    ) -> Dict[str, Any]:
        """
        Execute RAG chat for a user question and return a cited answer payload.
        """
        retrieval_result = self.retrieval_service.retrieve_context(
            query=question,
            organization=organization,
            top_k=5,
            filters=filters,
        )

        chunks = retrieval_result["chunks"]
        prompt_payload = retrieval_result["prompt_payload"]

        # Extract citations & metadata
        citations = CitationService.extract_citations(chunks)
        confidence_score = CitationService.calculate_confidence(chunks)
        supporting_evidence = CitationService.build_supporting_evidence(chunks)
        related_documents = CitationService.extract_related_documents(chunks)

        # Generate answer via LLMClient or fallback
        answer_text = ""
        try:
            llm_response = self.llm_client.generate_completion(
                prompt=prompt_payload["user_prompt"],
                system_prompt=prompt_payload["system_prompt"],
                temperature=0.2,
                max_tokens=1000,
            )
            if isinstance(llm_response, dict):
                answer_text = str(
                    llm_response.get("content")
                    or llm_response.get("text")
                    or llm_response.get("response")
                    or ""
                ).strip()
            elif isinstance(llm_response, str):
                answer_text = llm_response.strip()
        except Exception as exc:
            logger.info("LLMClient completion fallback triggered: %s", exc)

        if not answer_text:
            answer_text = self._generate_fallback_answer(
                question, chunks, confidence=confidence_score
            )

        # Build concise summary (first sentence or 200 chars of answer)
        summary_text = answer_text.split(". ")[0].strip()
        if not summary_text.endswith("."):
            summary_text += "."
        if len(summary_text) > 250:
            summary_text = summary_text[:247] + "..."

        # Extract actionable steps (lines starting with a number or bullet)
        actions: list[str] = []
        for line in answer_text.splitlines():
            stripped = line.strip()
            if stripped and (
                stripped[0].isdigit()
                or stripped.startswith("-")
                or stripped.startswith("•")
                or stripped.lower().startswith("step")
            ):
                actions.append(stripped)
        actions = actions[:10]  # cap at 10 items

        key_points: list[str] = []
        for c in chunks[:3]:
            content = str(c.get("content", "")).strip()
            if content:
                kp = content.split(". ")[0].strip()
                if not kp.endswith("."):
                    kp += "."
                if kp not in key_points:
                    key_points.append(kp)

        recommendations = actions if actions else [
            f"Review operational guidance in {c.get('document_title', 'knowledge base')} (Page {c.get('page_number', 1)})"
            for c in chunks[:2]
        ]

        # Log to RAGQueryLog for evaluation and auditing
        try:
            from apps.knowledge.models import RAGQueryLog
            RAGQueryLog.objects.create(
                organization=organization,
                user=user if (user and getattr(user, "is_authenticated", False)) else None,
                question=question,
                retrieved_documents=[
                    {
                        "document_id": str(c.get("document_id", "")),
                        "document_title": c.get("document_title", ""),
                        "chunk_index": c.get("chunk_index", 0),
                        "similarity_score": c.get("similarity_score", 0.0),
                    }
                    for c in chunks
                ],
                similarity_scores=[c.get("similarity_score", 0.0) for c in chunks],
                answer=answer_text,
                confidence_score=confidence_score,
            )
        except Exception as exc:
            logger.error("Failed to log RAG query evaluation log: %s", exc)

        return {
            "answer": answer_text,
            "summary": summary_text,
            "key_points": key_points,
            "recommendations": recommendations,
            "citations": citations,
            "confidence_score": confidence_score,
            "actions": actions,
            "supporting_evidence": supporting_evidence,
            "source_citations": citations,
            "related_documents": related_documents,
            "sources": citations,
            "similarity_scores": [c["similarity"] for c in citations],
        }

