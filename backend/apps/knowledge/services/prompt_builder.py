"""
Service responsible for synthesizing user questions and retrieved knowledge chunks
into structured prompts with citation instructions for LLM execution.
"""

from typing import Any, Dict, List


class PromptBuilder:
    """
    Isolated prompt construction service formatting retrieved RAG context, citations,
    and system directives for LLM chat generation.
    """

    DEFAULT_SYSTEM_PROMPT = (
        "You are an enterprise AI Incident Response and Security Assistant. "
        "Answer the user's question accurately using ONLY the provided knowledge base documents. "
        "Every assertion must be supported by source citations in your response."
    )

    @classmethod
    def format_context_chunks(cls, chunks: List[Dict[str, Any]]) -> str:
        """
        Format retrieved document chunks into readable cited blocks.
        """
        if not chunks:
            return "No relevant knowledge base documents found."

        formatted_blocks = []
        for idx, chunk in enumerate(chunks, start=1):
            doc_title = chunk.get("document_title", "Unknown Document")
            page_num = chunk.get("page_number", 1)
            content = chunk.get("content", "").strip()
            block = (
                f"[Source {idx}] Document: '{doc_title}' (Page {page_num})\n"
                f"Content: {content}"
            )
            formatted_blocks.append(block)

        return "\n\n---\n\n".join(formatted_blocks)

    @classmethod
    def build_rag_prompt(
        cls,
        question: str,
        chunks: List[Dict[str, Any]],
        system_instructions: str = None,
    ) -> Dict[str, str]:
        """
        Construct complete RAG prompt dictionary with system prompt, context text, and user prompt.
        """
        system_prompt = system_instructions or cls.DEFAULT_SYSTEM_PROMPT
        context_text = cls.format_context_chunks(chunks)

        user_prompt = (
            f"KNOWLEDGE BASE CONTEXT:\n"
            f"========================\n"
            f"{context_text}\n\n"
            f"USER QUESTION:\n"
            f"==============\n"
            f"{question}\n\n"
            f"INSTRUCTIONS:\n"
            f"1. Provide a comprehensive answer based strictly on the KNOWLEDGE BASE CONTEXT above.\n"
            f"2. Cite your sources using reference tags such as [Source 1] or [Document Title, Page X].\n"
            f"3. Do not invent information outside of the provided context."
        )

        return {
            "system_prompt": system_prompt,
            "user_prompt": user_prompt,
            "context_text": context_text,
        }
