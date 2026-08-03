"""
DTO representing references and citations with metadata.
"""

from dataclasses import dataclass


@dataclass
class CitationDTO:
    """
    Represents a specific source reference for an AI response.
    """

    document_id: str
    document_title: str
    page: int
    chunk_index: int
    similarity: float
    snippet: str
    highlight_start: int = 0
    highlight_end: int = 0
    source_url: str = ""
    version: str = "1.0"
