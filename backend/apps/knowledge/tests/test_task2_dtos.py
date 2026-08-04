"""
Tests for domain-scoped typed DTOs.
"""

from apps.knowledge.services.dtos import (
    CitationDTO,
    ConfidenceDTO,
    ConversationContextDTO,
    CopilotResponseDTO,
    MessageTurnDTO,
    PromptContextDTO,
    RetrievedChunkDTO,
)


def test_dtos_initialization():
    turn = MessageTurnDTO(role="user", content="Hello", tokens=2)
    assert turn.role == "user"
    assert turn.content == "Hello"
    assert turn.tokens == 2

    context = ConversationContextDTO(
        session_id="session-123",
        messages=[turn],
        total_tokens=2,
        is_truncated=False,
    )
    assert context.session_id == "session-123"
    assert len(context.messages) == 1
    assert context.total_tokens == 2
    assert not context.is_truncated

    chunk = RetrievedChunkDTO(
        chunk_id="chunk-1",
        document_id="doc-1",
        document_title="Title",
        chunk_index=0,
        content="Some content",
        similarity_score=0.85,
        page_number=1,
        metadata={"key": "val"},
    )
    assert chunk.chunk_id == "chunk-1"
    assert chunk.metadata == {"key": "val"}

    prompt = PromptContextDTO(
        system_prompt="sys",
        user_prompt="usr",
        context_text="ctx",
        history_text="hist",
        estimated_tokens=10,
        template_version="v1",
    )
    assert prompt.estimated_tokens == 10

    citation = CitationDTO(
        document_id="doc-1",
        document_title="Title",
        page=1,
        chunk_index=0,
        similarity=0.85,
        snippet="Snippet",
    )
    assert citation.document_title == "Title"

    confidence = ConfidenceDTO(score=90, level="high", reasoning="Good matches")
    assert confidence.level == "high"

    response = CopilotResponseDTO(
        session_id="sess-1",
        message_id="msg-1",
        content="Answer",
        role="assistant",
        tokens=15,
        prompt_tokens=10,
        completion_tokens=5,
        citations=[citation],
        confidence=confidence,
        metadata={"engine": "gemini"},
    )
    assert response.content == "Answer"
    assert len(response.citations) == 1
