"""
Deterministic citation service for Enterprise AI Copilot responses.
"""

from typing import List

from apps.knowledge.services.dtos import CitationDTO, RetrievedChunkDTO


class CitationService:
    """
    Extracts citations and maps source metadata.
    """

    def extract_citations(
        self, chunks: List[RetrievedChunkDTO], response_text: str
    ) -> List[CitationDTO]:
        """
        Produce a list of CitationDTOs from the retrieved chunks.
        """
        citations = []
        for chunk in chunks:
            # Deterministic highlight matching: find first sentence in content
            content_snippet = chunk.content.strip()
            first_sentence = content_snippet.split(".")[0]
            highlight_len = len(first_sentence)

            citations.append(
                CitationDTO(
                    document_id=chunk.document_id,
                    document_title=chunk.document_title,
                    page=chunk.page_number,
                    chunk_index=chunk.chunk_index,
                    similarity=chunk.similarity_score,
                    snippet=content_snippet[:300],
                    highlight_start=0,
                    highlight_end=highlight_len,
                    source_url=f"/api/v1/knowledge/documents/{chunk.document_id}/",
                    version=str(chunk.metadata.get("version", "1.0")),
                )
            )
        return citations
