"""
Service responsible for splitting parsed document text into overlapping token-bounded chunks
and annotating them with page, document, and heading metadata using recursive text splitting.
"""

import logging
from typing import Any, Dict, List, Optional

from apps.knowledge.models import KnowledgeDocument

logger = logging.getLogger(__name__)


class DocumentChunkingService:
    """
    Enterprise document chunking service generating token segments with chunk overlap
    using recursive character/token splitting and rich metadata tracking.
    """

    CHARS_PER_TOKEN = 4
    DEFAULT_CHUNK_TOKENS = 500
    DEFAULT_OVERLAP_TOKENS = 100
    DEFAULT_SEPARATORS = [
        "\n\n",
        "\n",
        ". ",
        "? ",
        "! ",
        "; ",
        ", ",
        " ",
        "",
    ]

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
    def _split_recursively_by_separators(
        cls,
        text: str,
        max_length: int,
        separators: List[str],
    ) -> List[str]:
        """
        Recursively split text into smaller syntactic units based on hierarchical separators.
        """
        if not text:
            return []
        if len(text) <= max_length:
            return [text]

        separator = ""
        next_separators = []
        for i, sep in enumerate(separators):
            if sep == "":
                separator = sep
                break
            if sep in text:
                separator = sep
                next_separators = separators[i + 1 :]
                break

        if separator == "":
            return [text[i : i + max_length] for i in range(0, len(text), max_length)]

        splits = text.split(separator)
        result: List[str] = []
        for s in splits:
            if not s:
                continue
            if len(s) <= max_length:
                result.append(s)
            else:
                sub_splits = cls._split_recursively_by_separators(
                    s, max_length=max_length, separators=next_separators
                )
                result.extend(sub_splits)
        return result

    @classmethod
    def chunk_text(
        cls,
        text: str,
        target_tokens: int = DEFAULT_CHUNK_TOKENS,
        overlap_tokens: int = DEFAULT_OVERLAP_TOKENS,
        separators: Optional[List[str]] = None,
    ) -> List[str]:
        """
        Split raw text into chunks approximating target_tokens with overlap_tokens
        using recursive character text splitting.
        """
        if not text or not text.strip():
            return []

        seps = separators if separators is not None else cls.DEFAULT_SEPARATORS
        max_chars = max(40, target_tokens * cls.CHARS_PER_TOKEN)
        overlap_chars = max(
            0, min(max_chars - 10, overlap_tokens * cls.CHARS_PER_TOKEN)
        )

        raw_blocks = cls._split_recursively_by_separators(
            text.strip(), max_length=max_chars, separators=seps
        )
        if not raw_blocks:
            return []

        chunks: List[str] = []
        current_chunk = raw_blocks[0]

        for block in raw_blocks[1:]:
            candidate = f"{current_chunk} {block}".strip()
            if len(candidate) <= max_chars:
                current_chunk = candidate
            else:
                chunks.append(current_chunk)
                if overlap_chars > 0 and len(current_chunk) > overlap_chars:
                    tail = current_chunk[-overlap_chars:].strip()
                    # ensure we don't start mid-word if possible
                    space_idx = tail.find(" ")
                    if space_idx != -1 and space_idx < len(tail) // 2:
                        tail = tail[space_idx + 1 :]
                    current_chunk = f"{tail} {block}".strip()
                else:
                    current_chunk = block

        if current_chunk:
            chunks.append(current_chunk)

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
            "Generated %s chunks for document_id=%s ('%s') via recursive chunking",
            len(chunks_data),
            document.id,
            document.title,
        )
        return chunks_data
