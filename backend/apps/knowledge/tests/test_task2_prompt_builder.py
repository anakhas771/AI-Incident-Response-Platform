"""
Tests for PromptBuilder consuming DTOs and compiling prompts.
"""

from apps.knowledge.services.dtos import (
    ConversationContextDTO,
    MessageTurnDTO,
    RetrievedChunkDTO,
)
from apps.knowledge.services.prompts.prompt_builder import PromptBuilder


def test_prompt_builder_compilation():
    builder = PromptBuilder()

    context = ConversationContextDTO(
        session_id="session-1",
        messages=[
            MessageTurnDTO(role="user", content="Question 1", tokens=5),
            MessageTurnDTO(role="assistant", content="Answer 1", tokens=5),
        ],
        total_tokens=10,
        is_truncated=False,
    )

    chunks = [
        RetrievedChunkDTO(
            chunk_id="c-1",
            document_id="d-1",
            document_title="Incident Guide",
            chunk_index=0,
            content="Runbook details for DB outage.",
            similarity_score=0.9,
            page_number=4,
        )
    ]

    prompt_context = builder.build_copilot_prompt(
        context=context,
        retrieved_chunks=chunks,
        user_message="My database is down!",
        version="v1",
    )

    # Assertions
    assert "Incident Guide" in prompt_context.context_text
    assert "Page 4" in prompt_context.context_text
    assert "USER: Question 1" in prompt_context.history_text
    assert "ASSISTANT: Answer 1" in prompt_context.history_text
    assert "My database is down!" in prompt_context.user_prompt
    assert prompt_context.estimated_tokens > 0
    assert prompt_context.template_version == "v1"
