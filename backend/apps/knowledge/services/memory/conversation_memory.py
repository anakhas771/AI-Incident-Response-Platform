"""
Conversation memory service with token budgeting, truncation, and summary strategy.
"""

from abc import ABC, abstractmethod
from typing import List, Optional

from apps.knowledge.services.config import CopilotSettings
from apps.knowledge.services.dtos.memory_dto import (
    ConversationContextDTO,
    MessageTurnDTO,
)
from apps.knowledge.services.memory.token_counter import TokenCounterService


class SummaryStrategy(ABC):
    """
    Abstract base class for summarizing dropped conversation history.
    """

    @abstractmethod
    def summarize(self, dropped_messages: List[MessageTurnDTO]) -> str:
        """
        Generate a summary string of the dropped message turns.
        """
        pass


class PlaceholderSummaryStrategy(SummaryStrategy):
    """
    Placeholder summary strategy returning a configured sentinel string.
    """

    def summarize(self, dropped_messages: List[MessageTurnDTO]) -> str:
        return CopilotSettings.SUMMARY_PLACEHOLDER


class ConversationMemoryService:
    """
    Service responsible for loading, token counting, and budgeting chat session history.
    """

    def __init__(
        self,
        token_counter: Optional[TokenCounterService] = None,
        summary_strategy: Optional[SummaryStrategy] = None,
    ) -> None:
        self.token_counter = token_counter or TokenCounterService()
        self.summary_strategy = summary_strategy or PlaceholderSummaryStrategy()

    def load_history(
        self,
        session,
        max_tokens: int = CopilotSettings.COPILOT_MAX_HISTORY_TOKENS,
    ) -> ConversationContextDTO:
        """
        Load conversation history for a ChatSession and truncate it if it exceeds max_tokens.
        """
        raw_messages = list(session.messages.order_by("created_at"))
        
        # Filter out contaminated legacy assistant messages
        messages = []
        for msg in raw_messages:
            if msg.role == "assistant":
                if not msg.metadata.get("is_clean_response", False):
                    continue
            messages.append(msg)

        # Enforce MAX_HISTORY_MESSAGES limit
        dropped_turns_by_count = []
        max_messages = CopilotSettings.MAX_HISTORY_MESSAGES
        if max_messages > 0 and len(messages) > max_messages:
            dropped_messages = messages[:-max_messages]
            messages = messages[-max_messages:]
            for msg in dropped_messages:
                content = msg.content or ""
                tokens = (
                    msg.tokens
                    if msg.tokens > 0
                    else self.token_counter.count_tokens(content)
                )
                dropped_turns_by_count.append(
                    MessageTurnDTO(role=msg.role, content=content, tokens=tokens)
                )

        # Convert to MessageTurnDTO with calculated tokens
        turns = []
        for msg in messages:
            content = msg.content or ""
            tokens = (
                msg.tokens
                if msg.tokens > 0
                else self.token_counter.count_tokens(content)
            )
            turns.append(MessageTurnDTO(role=msg.role, content=content, tokens=tokens))

        included_turns: List[MessageTurnDTO] = []
        total_tokens = 0
        is_truncated = False
        dropped_turns: List[MessageTurnDTO] = []

        # Consume budget starting from the most recent message (LIFO)
        for turn in reversed(turns):
            if total_tokens + turn.tokens <= max_tokens:
                included_turns.append(turn)
                total_tokens += turn.tokens
            else:
                is_truncated = True
                dropped_turns.append(turn)

        # Also include messages dropped by the count limit
        if dropped_turns_by_count:
            is_truncated = True
            dropped_turns.extend(reversed(dropped_turns_by_count))

        # Restore chronological order
        included_turns.reverse()
        dropped_turns.reverse()

        # If truncated, generate summary turn and prepend it
        if is_truncated and dropped_turns:
            summary_text = self.summary_strategy.summarize(dropped_turns)
            summary_tokens = self.token_counter.count_tokens(summary_text)
            summary_turn = MessageTurnDTO(
                role="system",
                content=summary_text,
                tokens=summary_tokens,
            )
            # Prepend summary turn
            included_turns.insert(0, summary_turn)
            total_tokens += summary_tokens

        return ConversationContextDTO(
            session_id=str(session.id),
            messages=included_turns,
            total_tokens=total_tokens,
            is_truncated=is_truncated,
        )
