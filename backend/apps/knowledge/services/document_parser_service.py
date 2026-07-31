"""
Service responsible for parsing uploaded documents (PDF, DOCX, TXT, Markdown),
cleaning whitespace, extracting headings, and preserving page metadata.
"""

import io
import logging
import re
from typing import Any, Dict, List

logger = logging.getLogger(__name__)


class DocumentParserService:
    """
    Enterprise document parsing service supporting PDF, DOCX, TXT, and Markdown files.
    """

    @classmethod
    def clean_text(cls, text: str) -> str:
        """
        Remove duplicate whitespace while preserving paragraph structure.
        """
        # Normalize line endings
        text = text.replace("\r\n", "\n").replace("\r", "\n")
        # Reduce multiple spaces to a single space per line
        lines = [re.sub(r"[ \t]+", " ", line).strip() for line in text.split("\n")]
        # Reduce excessive blank lines to a maximum of two newlines
        cleaned = re.sub(r"\n{3,}", "\n\n", "\n".join(lines)).strip()
        return cleaned

    @classmethod
    def extract_headings(cls, text: str) -> List[str]:
        """
        Extract Markdown headers and uppercase structural headings.
        """
        headings: List[str] = []
        for line in text.split("\n"):
            line = line.strip()
            if line.startswith(("# ", "## ", "### ", "#### ")):
                headings.append(line)
            elif (
                len(line) > 3
                and len(line) < 80
                and line.isupper()
                and not line.endswith(".")
            ):
                headings.append(line)
        return headings

    @classmethod
    def parse_txt_or_md(cls, content_bytes: bytes) -> Dict[str, Any]:
        """
        Parse plain TXT or Markdown file content.
        """
        try:
            raw_text = content_bytes.decode("utf-8", errors="ignore")
        except Exception:
            raw_text = str(content_bytes)

        cleaned = cls.clean_text(raw_text)
        headings = cls.extract_headings(cleaned)
        words = [w for w in cleaned.split() if w]

        pages = [
            {
                "page_number": 1,
                "content": cleaned,
                "headings": headings,
            }
        ]
        return {
            "text": cleaned,
            "pages": pages,
            "headings": headings,
            "page_count": 1,
            "word_count": len(words),
        }

    @classmethod
    def parse_pdf(cls, content_bytes: bytes) -> Dict[str, Any]:
        """
        Parse PDF content using pypdf if installed, falling back to text decoding.
        """
        pages: List[Dict[str, Any]] = []
        all_headings: List[str] = []
        full_text_parts: List[str] = []

        try:
            import pypdf

            reader = pypdf.PdfReader(io.BytesIO(content_bytes))
            for idx, page in enumerate(reader.pages, start=1):
                page_text = page.extract_text() or ""
                cleaned_page = cls.clean_text(page_text)
                if cleaned_page:
                    full_text_parts.append(cleaned_page)
                    page_headings = cls.extract_headings(cleaned_page)
                    all_headings.extend(page_headings)
                    pages.append(
                        {
                            "page_number": idx,
                            "content": cleaned_page,
                            "headings": page_headings,
                        }
                    )
        except Exception as exc:
            logger.info(
                "pypdf not installed or error parsing PDF (%s), using fallback", exc
            )
            return cls.parse_txt_or_md(content_bytes)

        full_text = "\n\n".join(full_text_parts)
        words = [w for w in full_text.split() if w]
        return {
            "text": full_text,
            "pages": pages
            or [{"page_number": 1, "content": full_text, "headings": []}],
            "headings": all_headings,
            "page_count": max(1, len(pages)),
            "word_count": len(words),
        }

    @classmethod
    def parse_docx(cls, content_bytes: bytes) -> Dict[str, Any]:
        """
        Parse DOCX content using python-docx if installed, falling back to text decoding.
        """
        try:
            import docx

            doc = docx.Document(io.BytesIO(content_bytes))
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            raw_text = "\n\n".join(paragraphs)
            return cls.parse_txt_or_md(raw_text.encode("utf-8"))
        except Exception as exc:
            logger.info(
                "python-docx not installed or error parsing DOCX (%s), using fallback",
                exc,
            )
            return cls.parse_txt_or_md(content_bytes)

    @classmethod
    def parse(cls, file_obj: Any, file_type: str) -> Dict[str, Any]:
        """
        Main entry point to extract text, clean whitespace, and return page/heading metadata.
        """
        if hasattr(file_obj, "read"):
            content_bytes = file_obj.read()
            if hasattr(file_obj, "seek"):
                file_obj.seek(0)
        elif isinstance(file_obj, bytes):
            content_bytes = file_obj
        else:
            content_bytes = str(file_obj).encode("utf-8")

        file_type_upper = file_type.upper().strip()
        if file_type_upper == "PDF":
            return cls.parse_pdf(content_bytes)
        elif file_type_upper == "DOCX":
            return cls.parse_docx(content_bytes)
        else:
            return cls.parse_txt_or_md(content_bytes)
