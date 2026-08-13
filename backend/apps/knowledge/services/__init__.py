"""
Export all enterprise RAG knowledge base service classes.
"""

from apps.knowledge.services.citation_service import CitationService
from apps.knowledge.services.citations import CitationService as CopilotCitationService
from apps.knowledge.services.confidence import ConfidenceEngine

# Task 2 Exports
from apps.knowledge.services.config import CopilotSettings
from apps.knowledge.services.document_chunking_service import DocumentChunkingService
from apps.knowledge.services.document_parser_service import DocumentParserService
from apps.knowledge.services.dtos import (
    CitationDTO,
    ConfidenceDTO,
    ConversationContextDTO,
    CopilotResponseDTO,
    MessageTurnDTO,
    PromptContextDTO,
    RetrievedChunkDTO,
)
from apps.knowledge.services.embedding_service import (
    EmbeddingProvider,
    EmbeddingService,
    MockEmbeddingProvider,
    OpenAIEmbeddingProvider,
)
from apps.knowledge.services.embeddings.factory import get_embedding_provider
from apps.knowledge.services.file_hash_service import FileHashService
from apps.knowledge.services.knowledge_chat_service import KnowledgeChatService
from apps.knowledge.services.knowledge_retrieval_service import (
    KnowledgeRetrievalService,
)

# Task 3 Exports
from apps.knowledge.services.llm import (
    BaseLLMGateway,
    MockLLMGateway,
    OpenAILLMGateway,
    get_llm_gateway,
)
from apps.knowledge.services.memory import (
    ConversationMemoryService,
    PlaceholderSummaryStrategy,
    SummaryStrategy,
    TokenCounterService,
)
from apps.knowledge.services.observability import TelemetryLogger

# Task 4 Exports
from apps.knowledge.services.orchestration import (
    CopilotOrchestrator,
    SuggestedQuestionsService,
)
from apps.knowledge.services.prompts import PromptBuilder
from apps.knowledge.services.retrieval import (
    HybridRetrieverService,
    ReRankerService,
)
from apps.knowledge.services.similar_incident_service import SimilarIncidentService
from apps.knowledge.services.vector_search_service import VectorSearchService

__all__ = [
    "CitationService",
    "DocumentParserService",
    "DocumentChunkingService",
    "EmbeddingProvider",
    "MockEmbeddingProvider",
    "OpenAIEmbeddingProvider",
    "get_embedding_provider",
    "EmbeddingService",
    "FileHashService",
    "VectorSearchService",
    "PromptBuilder",
    "KnowledgeRetrievalService",
    "KnowledgeChatService",
    "SimilarIncidentService",
    # Task 2
    "CopilotSettings",
    "MessageTurnDTO",
    "ConversationContextDTO",
    "RetrievedChunkDTO",
    "PromptContextDTO",
    "CitationDTO",
    "ConfidenceDTO",
    "CopilotResponseDTO",
    "TelemetryLogger",
    "TokenCounterService",
    "ConversationMemoryService",
    "SummaryStrategy",
    "PlaceholderSummaryStrategy",
    # Task 3
    "BaseLLMGateway",
    "MockLLMGateway",
    "OpenAILLMGateway",
    "get_llm_gateway",
    "HybridRetrieverService",
    "ReRankerService",
    # Task 4
    "CopilotOrchestrator",
    "SuggestedQuestionsService",
    "ConfidenceEngine",
    "CopilotCitationService",
]
