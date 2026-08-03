"""
Service responsible for splitting parsed document text into overlapping token-bounded chunks
and annotating them with page, document, and heading metadata.
"""

import logging
from typing import Any, Dict, List

from apps.knowledge.models import KnowledgeDocument

logger = logging.getLogger(__name__)


class DocumentChunkingService:
    """
    Enterprise document chunking service generating 600-800 token segments with 100-token overlap.
    """

    CHARS_PER_TOKEN = 4
    DEFAULT_CHUNK_TOKENS = 500
    DEFAULT_OVERLAP_TOKENS = 100

    @classmethod
    def estimate_tokens(cls, text: str) -> int:
        """
        Estimate token count based on whitespace words and character ratio.
        """
        words = text.split()
        if not words:
            return 0
        char_estimate = len(text) / cls.CHARS_PER_TOKEN
        word_estimate = len(words) * 1.3
        return max(1, int((char_estimate + word_estimate) / 2))

    @classmethod
    def chunk_text(
        cls,
        text: str,
        target_tokens: int = DEFAULT_CHUNK_TOKENS,
        overlap_tokens: int = DEFAULT_OVERLAP_TOKENS,
    ) -> List[str]:
        """
        Split raw text into chunks approximating target_tokens with overlap_tokens.
        """
        words = text.split()
        if not words:
            return []

        # Approximate words per token (~0.75 words per token)
        words_per_token = 0.75
        chunk_word_size = max(10, int(target_tokens * words_per_token))
        overlap_word_size = max(0, int(overlap_tokens * words_per_token))

        step = max(1, chunk_word_size - overlap_word_size)
        chunks: List[str] = []

        for start in range(0, len(words), step):
            end = start + chunk_word_size
            chunk_slice = words[start:end]
            chunk_str = " ".join(chunk_slice).strip()
            if chunk_str:
                chunks.append(chunk_str)
            if end >= len(words):
                break

        return chunks

    @classmethod
    def chunk_document(
        cls,
        document: KnowledgeDocument,
        parse_result: Dict[str, Any],
        target_tokens: int = DEFAULT_CHUNK_TOKENS,
        overlap_tokens: int = DEFAULT_OVERLAP_TOKENS,
    ) -> List[Dict[str, Any]]:
        """
        Generate structured chunk definitions from a parsed document with complete metadata.
        """
        pages = parse_result.get("pages") or [
            {
                "page_number": 1,
                "content": parse_result.get("text", ""),
                "headings": parse_result.get("headings", []),
            }
        ]

        chunks_data: List[Dict[str, Any]] = []
        chunk_index = 0

        for page in pages:
            page_num = page.get("page_number", 1)
            page_content = page.get("content", "")
            page_headings = page.get("headings", [])

            text_chunks = cls.chunk_text(
                page_content,
                target_tokens=target_tokens,
                overlap_tokens=overlap_tokens,
            )

            for chunk_str in text_chunks:
                token_count = cls.estimate_tokens(chunk_str)
                chunks_data.append(
                    {
                        "chunk_index": chunk_index,
                        "content": chunk_str,
                        "token_count": token_count,
                        "metadata": {
                            "document_id": str(document.id),
                            "document_title": document.title,
                            "file_type": document.file_type,
                            "created_by": (
                                str(document.uploaded_by.id)
                                if document.uploaded_by
                                else None
                            ),
                            "page_number": page_num,
                            "headings": page_headings,
                            "chunk_number": chunk_index,
                        },
                    }
                )
                chunk_index += 1

        logger.info(
            "Generated %s chunks for document_id=%s ('%s')",
            len(chunks_data),
            document.id,
            document.title,
        )
        return chunks_data
