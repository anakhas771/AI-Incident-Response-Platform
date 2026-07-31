"""
Service responsible for building citation payloads, calculating confidence scores,
and extracting supporting evidence and related documents from retrieved chunks.
"""

from typing import Any, Dict, List


class CitationService:
    """
    Enterprise citation service structuring evidence, source references,
    and confidence scores for AI RAG responses.
    """

    @classmethod
    def extract_citations(cls, chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Convert retrieved chunk dictionaries into standardized Citation objects.
        """
        citations: List[Dict[str, Any]] = []
        for c in chunks:
            citations.append(
                {
                    "document_id": str(c.get("document_id", "")),
                    "document": str(c.get("document_title", "Unknown Document")),
                    "page": int(c.get("page_number", 1)),
                    "chunk": int(c.get("chunk_index", 0)),
                    "similarity": round(float(c.get("similarity_score", 0.0)), 4),
                    "snippet": str(c.get("content", ""))[:300],
                }
            )
        return citations

    @classmethod
    def calculate_confidence(cls, chunks: List[Dict[str, Any]], top_k: int = 5) -> int:
        """
        Calculate overall confidence score as the average of top_k similarity scores,
        normalized to a percentage integer 0-100.
        Example: 0.82 -> 82, 0.45 -> 45, 0.20 -> 20.
        """
        if not chunks:
            return 0
        top_chunks = chunks[:top_k]
        similarities = [float(c.get("similarity_score", 0.0)) for c in top_chunks]
        if not similarities:
            return 0
        avg_sim = sum(similarities) / len(similarities)
        if avg_sim > 1.0:
            avg_sim = avg_sim / 100.0
        confidence = round(max(0.0, min(1.0, avg_sim)) * 100)
        return int(confidence)


    @classmethod
    def build_supporting_evidence(cls, chunks: List[Dict[str, Any]]) -> List[str]:
        """
        Extract concise supporting evidence bullet points from retrieved chunks.
        """
        evidence: List[str] = []
        for c in chunks:
            doc_title = c.get("document_title", "Document")
            page_num = c.get("page_number", 1)
            text_snippet = str(c.get("content", "")).strip()
            # Take the first sentence or up to 150 characters
            first_sentence = text_snippet.split(". ")[0].strip() + "."
            if len(first_sentence) < 10:
                first_sentence = text_snippet[:150]
            bullet = f"[{doc_title}, Page {page_num}]: {first_sentence}"
            if bullet not in evidence:
                evidence.append(bullet)
        return evidence[:5]

    @classmethod
    def extract_related_documents(
        cls, chunks: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Extract deduplicated list of related knowledge base documents from chunks.
        """
        docs_map: Dict[str, Dict[str, Any]] = {}
        for c in chunks:
            doc_id = str(c.get("document_id", ""))
            doc_title = str(c.get("document_title", ""))
            sim = float(c.get("similarity_score", 0.0))
            if doc_id and doc_id not in docs_map:
                docs_map[doc_id] = {
                    "id": doc_id,
                    "title": doc_title,
                    "highest_similarity": round(sim, 4),
                }
            elif doc_id and sim > docs_map[doc_id]["highest_similarity"]:
                docs_map[doc_id]["highest_similarity"] = round(sim, 4)

        return list(docs_map.values())
