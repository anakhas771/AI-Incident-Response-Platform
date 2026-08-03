"""
DTO representing retrieved document chunks.
"""

from dataclasses import dataclass, field
from typing import Any, Dict


@dataclass
class RetrievedChunkDTO:
    """
    Represents a single retrieved chunk of context from the vector database.
    """

    chunk_id: str
    document_id: str
    document_title: str
    chunk_index: int
    content: str
    similarity_score: float
    page_number: int
    metadata: Dict[str, Any] = field(default_factory=dict)
