"""
Deterministic suggested follow-up questions service consuming DTOs.
"""

from typing import List

from apps.knowledge.services.dtos import ConversationContextDTO, RetrievedChunkDTO


class SuggestedQuestionsService:
    """
    Produces suggested follow-up questions based on conversation context and retrieved chunks.
    """

    def generate_questions(
        self, context: ConversationContextDTO, chunks: List[RetrievedChunkDTO]
    ) -> List[str]:
        """
        Generate follow-up questions.
        """
        questions = []
        if chunks:
            top_chunk = chunks[0]
            questions.append(
                f"Can you explain the details of '{top_chunk.document_title}'?"
            )

            content = top_chunk.content.lower()
            if "database" in content or "db" in content:
                questions.append("What are the failover steps for the database?")
            if "security" in content or "credentials" in content:
                questions.append("How should we rotate the compromised API keys?")
            if "rca" in content or "root cause" in content:
                questions.append("What was the timeline of the incident resolution?")

        # Add stubs for fallback defaults
        if len(questions) < 2:
            questions.append("What are the next recommended steps for this incident?")
        if len(questions) < 3:
            questions.append("Show me the associated policies and runbooks.")

        return questions[:3]
