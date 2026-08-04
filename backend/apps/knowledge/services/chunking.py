"""
Document text chunking services and architectural exports.
Re-exports DocumentChunkingService from document_chunking_service without modifying existing code.
"""

from apps.knowledge.services.document_chunking_service import DocumentChunkingService

__all__ = [
    "DocumentChunkingService",
]
