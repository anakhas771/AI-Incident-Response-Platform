"""
Tests for PromptBuilder versioned templates, DTO compatibility, and formatting.
"""

from apps.knowledge.services.dtos import (
    ConversationContextDTO,
    MessageTurnDTO,
    RetrievedChunkDTO,
)
from apps.knowledge.services.prompts import PromptBuilder


def test_prompt_builder_format_retrieved_context_empty():
    builder = PromptBuilder()
    text = builder.format_retrieved_context([])
    assert "No relevant knowledge" in text


def test_prompt_builder_format_retrieved_context_elements():
    builder = PromptBuilder()
    c1 = RetrievedChunkDTO(
        "c-1", "d-1", "Playbook", 0, "Steps for recovery.", 0.85, 2, {}
    )
    text = builder.format_retrieved_context([c1])
    assert "Playbook" in text
    assert "Page: 2" in text
    assert "Steps for recovery." in text


def test_prompt_builder_compiles_full_context():
    builder = PromptBuilder()

    context = ConversationContextDTO(
        session_id="session-1",
        messages=[
            MessageTurnDTO(role="user", content="Log audit", tokens=10),
        ],
        total_tokens=10,
        is_truncated=False,
    )

    chunks = [
        RetrievedChunkDTO("c-1", "d-1", "Policy", 0, "Standard procedure.", 0.9, 1, {})
    ]

    prompt_context = builder.build_copilot_prompt(
        context=context,
        retrieved_chunks=chunks,
        user_message="Audit log query",
        version="v1",
    )

    assert (
        "You are an Enterprise AI Incident Response Copilot."
        in prompt_context.system_prompt
    )
    assert "[Historical Message 1 | Role: user]" in prompt_context.history_text
    assert "Log audit" in prompt_context.history_text
    assert "Standard procedure." in prompt_context.context_text
    assert "Audit log query" in prompt_context.user_prompt
    assert prompt_context.estimated_tokens > 0
