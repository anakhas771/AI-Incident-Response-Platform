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

    def _build_filters(
        self, filters: Optional[Dict[str, Any]] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Normalize and build retrieval filters.
        """
        return filters

    def _retrieve_context(
        self,
        question: str,
        organization: Organization,
        filters: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Retrieve relevant context chunks and prompt payload for the query.
        """
        retrieval_filters = self._build_filters(filters)
        return self.retrieval_service.retrieve_context(
            query=question,
            organization=organization,
            top_k=5,
            filters=retrieval_filters,
        )

    def _build_prompt(self, prompt_payload: Dict[str, Any]) -> tuple[str, str]:
        """
        Extract user and system prompts from prompt payload.
        """
        return prompt_payload["user_prompt"], prompt_payload["system_prompt"]

    def _parse_llm_response(self, llm_response: Any) -> str:
        """
        Extract string content from LLM client completion response.
        """
        if isinstance(llm_response, dict):
            return str(
                llm_response.get("content")
                or llm_response.get("text")
                or llm_response.get("response")
                or ""
            ).strip()
        elif isinstance(llm_response, str):
            return llm_response.strip()
        return ""

    def _generate_response(
        self,
        question: str,
        prompt_payload: Dict[str, Any],
        chunks: list[Dict[str, Any]],
        confidence: int = 0,
    ) -> str:
        """
        Generate answer via LLMClient or fallback to rule-based answer.
        """
        answer_text = ""
        try:
            user_prompt, system_prompt = self._build_prompt(prompt_payload)
            llm_response = self.llm_client.generate_completion(
                prompt=user_prompt,
                system_prompt=system_prompt,
                temperature=0.2,
                max_tokens=1000,
            )
            answer_text = self._parse_llm_response(llm_response)
        except Exception as exc:
            logger.info("LLMClient completion fallback triggered: %s", exc)

        if not answer_text:
            answer_text = self._generate_fallback_answer(
                question, chunks, confidence=confidence
            )

        return answer_text

    def _extract_summary(self, answer_text: str) -> str:
        """
        Build concise summary from answer text.
        """
        summary_text = answer_text.split(". ")[0].strip()
        if not summary_text.endswith("."):
            summary_text += "."
        if len(summary_text) > 250:
            summary_text = summary_text[:247] + "..."
        return summary_text

    def _extract_actions(self, answer_text: str) -> list[str]:
        """
        Extract actionable steps from answer text.
        """
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
        return actions[:10]

    def _extract_key_points(self, chunks: list[Dict[str, Any]]) -> list[str]:
        """
        Extract unique key points from top chunks.
        """
        key_points: list[str] = []
        for c in chunks[:3]:
            content = str(c.get("content", "")).strip()
            if content:
                kp = content.split(". ")[0].strip()
                if not kp.endswith("."):
                    kp += "."
                if kp not in key_points:
                    key_points.append(kp)
        return key_points

    def _build_recommendations(
        self, actions: list[str], chunks: list[Dict[str, Any]]
    ) -> list[str]:
        """
        Build recommendations from actions or chunk guidance.
        """
        return (
            actions
            if actions
            else [
                f"Review operational guidance in {c.get('document_title', 'knowledge base')} (Page {c.get('page_number', 1)})"
                for c in chunks[:2]
            ]
        )

    def _log_query(
        self,
        question: str,
        organization: Organization,
        user: Any,
        chunks: list[Dict[str, Any]],
        answer_text: str,
        confidence_score: int,
    ) -> None:
        """
        Log to RAGQueryLog for evaluation and auditing.
        """
        try:
            from apps.knowledge.models import RAGQueryLog

            RAGQueryLog.objects.create(
                organization=organization,
                user=(
                    user
                    if (user and getattr(user, "is_authenticated", False))
                    else None
                ),
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

    def _build_result(
        self,
        question: str,
        organization: Organization,
        user: Any,
        answer_text: str,
        chunks: list[Dict[str, Any]],
        citations: list[Dict[str, Any]],
        confidence_score: int,
        supporting_evidence: list[Dict[str, Any]],
        related_documents: list[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Build the final chat result payload and log query evaluation.
        """
        summary_text = self._extract_summary(answer_text)
        actions = self._extract_actions(answer_text)
        key_points = self._extract_key_points(chunks)
        recommendations = self._build_recommendations(actions, chunks)

        self._log_query(
            question=question,
            organization=organization,
            user=user,
            chunks=chunks,
            answer_text=answer_text,
            confidence_score=confidence_score,
        )

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
        retrieval_result = self._retrieve_context(
            question=question,
            organization=organization,
            filters=filters,
        )

        chunks = retrieval_result["chunks"]
        prompt_payload = retrieval_result["prompt_payload"]

        # Extract citations & metadata
        citations = CitationService.extract_citations(chunks)
        confidence_score = CitationService.calculate_confidence(chunks)
        raw_supporting_evidence = CitationService.build_supporting_evidence(chunks)
        supporting_evidence: list[Dict[str, Any]] = [
            item if isinstance(item, dict) else {"text": str(item)}
            for item in raw_supporting_evidence
        ]
        related_documents = CitationService.extract_related_documents(chunks)

        # Generate answer via LLMClient or fallback
        answer_text = self._generate_response(
            question=question,
            prompt_payload=prompt_payload,
            chunks=chunks,
            confidence=confidence_score,
        )

        return self._build_result(
            question=question,
            organization=organization,
            user=user,
            answer_text=answer_text,
            chunks=chunks,
            citations=citations,
            confidence_score=confidence_score,
            supporting_evidence=supporting_evidence,
            related_documents=related_documents,
        )
