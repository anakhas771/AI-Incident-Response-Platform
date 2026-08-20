"""
Vector similarity search services and architectural exports.
Re-exports VectorSearchService without modifying existing code.
"""

from apps.knowledge.services.vector_search_service import VectorSearchService

__all__ = [
    "VectorSearchService",
]
