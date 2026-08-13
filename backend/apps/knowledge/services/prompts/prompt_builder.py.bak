"""
Domain-agnostic prompt builder service loading versioned prompt templates and consuming DTOs.
"""

import os
from typing import List, Optional

from apps.knowledge.services.dtos.memory_dto import ConversationContextDTO
from apps.knowledge.services.dtos.prompt_dto import PromptContextDTO
from apps.knowledge.services.dtos.retrieval_dto import RetrievedChunkDTO
from apps.knowledge.services.memory.token_counter import TokenCounterService


class PromptBuilder:
    """
    Template-driven PromptBuilder service that compiles system and user prompts using typed DTOs.
    """

    def __init__(self, token_counter: Optional[TokenCounterService] = None) -> None:
        self.token_counter = token_counter or TokenCounterService()
        self.template_dir = os.path.join(os.path.dirname(__file__), "templates")

    def _load_template(self, filename: str) -> str:
        filepath = os.path.join(self.template_dir, filename)
        with open(filepath, "r", encoding="utf-8") as f:
            return f.read()

    def format_history(self, context: ConversationContextDTO) -> str:
        """
        Format conversation messages history into a flat text block.
        """
        if not context.messages:
            return "No previous conversation history."

        formatted_lines = []
        for msg in context.messages:
            role_label = msg.role.upper()
            formatted_lines.append(f"{role_label}: {msg.content}")

        return "\n".join(formatted_lines)

    def format_retrieved_context(self, chunks: List[RetrievedChunkDTO]) -> str:
        """
        Format retrieved chunks into a flat text block.
        """
        if not chunks:
            return "No relevant knowledge base documents found."

        formatted_blocks = []
        for idx, chunk in enumerate(chunks, start=1):
            block = (
                f"[Source {idx}] Document: '{chunk.document_title}' (Page {chunk.page_number})\n"
                f"Content: {chunk.content.strip()}"
            )
            formatted_blocks.append(block)

        return "\n\n---\n\n".join(formatted_blocks)

    def build_copilot_prompt(
        self,
        context: ConversationContextDTO,
        retrieved_chunks: List[RetrievedChunkDTO],
        user_message: str,
        version: str = "v1",
    ) -> PromptContextDTO:
        """
        Loads versioned system and user templates and produces a compiled PromptContextDTO.
        """
        system_template = self._load_template(f"copilot_system_{version}.txt")
        user_template = self._load_template(f"copilot_user_{version}.txt")

        history_text = self.format_history(context)
        context_text = self.format_retrieved_context(retrieved_chunks)

        user_prompt = user_template.format(
            history=history_text,
            retrieved_context=context_text,
            user_message=user_message,
        )

        system_prompt = system_template.strip()

        # Calculate estimated tokens for the compiled system + user prompts
        total_text = f"{system_prompt}\n\n{user_prompt}"
        estimated_tokens = self.token_counter.count_tokens(total_text)

        return PromptContextDTO(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            context_text=context_text,
            history_text=history_text,
            estimated_tokens=estimated_tokens,
            template_version=version,
        )
