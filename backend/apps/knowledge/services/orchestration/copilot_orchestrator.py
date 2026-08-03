"""
Orchestration entry point coordinating memory, retrieval, prompt construction, LLM execution, and post-processing.
"""

import dataclasses
import logging
import time
from typing import Any, Iterator, Optional

from django.utils import timezone

from apps.knowledge.models import ChatMessage, ChatSession, MessageRole
from apps.knowledge.services.citations.citation_service import CitationService
from apps.knowledge.services.confidence.confidence_engine import ConfidenceEngine
from apps.knowledge.services.config import CopilotSettings
from apps.knowledge.services.dtos import CopilotResponseDTO, StreamEventDTO, UsageDTO
from apps.knowledge.services.exceptions import ErrorCode, ValidationException
from apps.knowledge.services.llm.base import BaseLLMGateway
from apps.knowledge.services.llm.factory import get_llm_gateway
from apps.knowledge.services.memory.conversation_memory import (
    ConversationMemoryService,
)
from apps.knowledge.services.observability.telemetry_logger import TelemetryLogger
from apps.knowledge.services.orchestration.suggested_questions_service import (
    SuggestedQuestionsService,
)
from apps.knowledge.services.prompts import PromptBuilder
from apps.knowledge.services.retrieval.hybrid_retriever_service import (
    HybridRetrieverService,
)
from apps.knowledge.services.retrieval.reranker_service import ReRankerService

logger = logging.getLogger(__name__)


def _default_calculate_cost(*args: Any, **kwargs: Any) -> float:
    return 0.0


class CopilotOrchestrator:
    """
    Coordinates the entire execution pipeline for a Copilot chat conversation turn.
    """

    def __init__(
        self,
        memory_service: Optional[ConversationMemoryService] = None,
        retriever_service: Optional[HybridRetrieverService] = None,
        reranker_service: Optional[ReRankerService] = None,
        prompt_builder: Optional[PromptBuilder] = None,
        llm_gateway: Optional[BaseLLMGateway] = None,
        citation_service: Optional[CitationService] = None,
        confidence_engine: Optional[ConfidenceEngine] = None,
        suggested_questions_service: Optional[SuggestedQuestionsService] = None,
        telemetry_logger: Optional[TelemetryLogger] = None,
    ) -> None:
        self.memory_service = memory_service or ConversationMemoryService()
        self.retriever_service = retriever_service or HybridRetrieverService()
        self.reranker_service = reranker_service or ReRankerService()
        self.prompt_builder = prompt_builder or PromptBuilder()
        self.llm_gateway = llm_gateway or get_llm_gateway()
        self.citation_service = citation_service or CitationService()
        self.confidence_engine = confidence_engine or ConfidenceEngine()
        self.suggested_questions_service = (
            suggested_questions_service or SuggestedQuestionsService()
        )
        self.telemetry_logger = telemetry_logger or TelemetryLogger()

    def _validate_request(self, session: ChatSession, prompt_text: str) -> None:
        """
        Validate session status and prompt text constraints.
        """
        if session.is_archived:
            raise ValidationException(
                "Cannot execute chat turn on an archived session.",
                code=ErrorCode.SESSION_ARCHIVED.value,
            )
        if not prompt_text or not str(prompt_text).strip():
            raise ValidationException(
                "Prompt message cannot be empty.",
                code=ErrorCode.VALIDATION_ERROR.value,
            )
        if len(str(prompt_text)) > CopilotSettings.MAX_MESSAGE_LENGTH:
            raise ValidationException(
                f"Prompt exceeds maximum length of {CopilotSettings.MAX_MESSAGE_LENGTH} characters.",
                code=ErrorCode.PROMPT_TOO_LONG.value,
            )

    def execute_turn(self, session: ChatSession, question: str) -> CopilotResponseDTO:
        """
        Backward-compatible wrapper for execute().
        """
        return self.execute(session=session, message=question)

    def execute(
        self,
        session: ChatSession,
        message: str = "",
        question: str = "",
        **kwargs: Any,
    ) -> CopilotResponseDTO:
        """
        Execute a single conversation turn: retrieval, reranking, prompt assembly, LLM call, and post-processing.
        """
        prompt_text = (message or question or kwargs.get("user_message", "")).strip()
        self._validate_request(session, prompt_text)
        latency_metrics: dict[str, float] = {}

        # 1. Load history (Memory)
        with self.telemetry_logger.timer("memory"):
            context = self.memory_service.load_history(session)
        latency_metrics["memory_ms"] = self.telemetry_logger.stage_timings.get(
            "memory", 0.0
        )

        # 2. Retrieve (Hybrid Retriever)
        with self.telemetry_logger.timer("retrieval"):
            chunks = self.retriever_service.retrieve(prompt_text, session.organization)
        latency_metrics["retrieval_ms"] = self.telemetry_logger.stage_timings.get(
            "retrieval", 0.0
        )

        # 3. Rerank
        with self.telemetry_logger.timer("reranking"):
            reranked_chunks = self.reranker_service.rerank(chunks)
        latency_metrics["reranking_ms"] = self.telemetry_logger.stage_timings.get(
            "reranking", 0.0
        )

        # 4. Prompt compilation
        with self.telemetry_logger.timer("prompt"):
            prompt_ctx = self.prompt_builder.build_copilot_prompt(
                context=context,
                retrieved_chunks=reranked_chunks,
                user_message=prompt_text,
                version="v1",
            )
        latency_metrics["prompt_building_ms"] = self.telemetry_logger.stage_timings.get(
            "prompt", 0.0
        )

        # 5. LLM Call
        with self.telemetry_logger.timer("llm"):
            llm_response = self.llm_gateway.generate(prompt_ctx)
        latency_metrics["llm_ms"] = self.telemetry_logger.stage_timings.get("llm", 0.0)

        # 6. Post-processing (Citations, Confidence, Suggested Questions)
        with self.telemetry_logger.timer("postprocess"):
            citations = self.citation_service.extract_citations(
                reranked_chunks, llm_response.content
            )
            confidence = self.confidence_engine.calculate_confidence(reranked_chunks)
            suggested_questions = self.suggested_questions_service.generate_questions(
                context, reranked_chunks
            )
            cost = getattr(self.llm_gateway, "calculate_cost", _default_calculate_cost)(
                prompt_tokens=llm_response.prompt_tokens,
                completion_tokens=llm_response.completion_tokens,
            )
            usage_dto = UsageDTO(
                prompt_tokens=llm_response.prompt_tokens,
                completion_tokens=llm_response.completion_tokens,
                total_tokens=llm_response.total_tokens,
                estimated_cost=cost,
                provider=llm_response.metadata.get(
                    "provider", CopilotSettings.DEFAULT_LLM_PROVIDER
                ),
                model=llm_response.model,
                latency_ms=llm_response.latency_ms,
            )
        latency_metrics["post_processing_ms"] = self.telemetry_logger.stage_timings.get(
            "postprocess", 0.0
        )

        # 7. Save turns to database
        with self.telemetry_logger.timer("persist"):
            ChatMessage.objects.create(
                session=session,
                role=MessageRole.USER,
                content=prompt_text,
                tokens=llm_response.prompt_tokens,
                prompt_tokens=llm_response.prompt_tokens,
                completion_tokens=0,
            )

            assistant_msg = ChatMessage.objects.create(
                session=session,
                role=MessageRole.ASSISTANT,
                content=llm_response.content,
                tokens=llm_response.completion_tokens,
                prompt_tokens=llm_response.prompt_tokens,
                completion_tokens=llm_response.completion_tokens,
            )

            # Update session metadata
            session.last_message_preview = llm_response.content[:255]
            session.last_message_at = timezone.now()
            session.token_count += llm_response.total_tokens
            session.save(
                update_fields=[
                    "last_message_preview",
                    "last_message_at",
                    "token_count",
                ]
            )

        total_latency = sum(latency_metrics.values())
        latency_metrics["total_latency_ms"] = total_latency
        self.telemetry_logger.record_stage("total", total_latency)
        self.telemetry_logger.log_event("copilot_chat_turn", latency_metrics)
        self.telemetry_logger.log_chat_turn(
            session_id=str(session.id),
            message_id=str(assistant_msg.id),
            usage=dataclasses.asdict(usage_dto),
            stage_timings=self.telemetry_logger.stage_timings,
        )

        return CopilotResponseDTO(
            session_id=str(session.id),
            message_id=str(assistant_msg.id),
            content=llm_response.content,
            role=MessageRole.ASSISTANT,
            tokens=llm_response.total_tokens,
            prompt_tokens=llm_response.prompt_tokens,
            completion_tokens=llm_response.completion_tokens,
            citations=citations,
            confidence=confidence,
            metadata={
                "suggested_questions": suggested_questions,
                "latency_metrics": latency_metrics,
            },
            suggested_questions=suggested_questions,
            usage=usage_dto,
        )

    def stream(
        self,
        session: ChatSession,
        message: str = "",
        question: str = "",
        heartbeat_interval: Optional[float] = None,
        **kwargs: Any,
    ) -> Iterator[StreamEventDTO]:
        """
        Execute a streaming conversation turn yielding Server-Sent Events (SSE) sequence.
        """
        prompt_text = (message or question or kwargs.get("user_message", "")).strip()
        event_id = 1

        try:
            self._validate_request(session, prompt_text)

            # Yield start event
            yield StreamEventDTO(
                event_id=event_id,
                event_type="start",
                payload={"session_id": str(session.id), "status": "started"},
            )
            event_id += 1

            # 1. Load history (Memory)
            with self.telemetry_logger.timer("memory"):
                context = self.memory_service.load_history(session)

            # 2. Retrieve
            with self.telemetry_logger.timer("retrieval"):
                chunks = self.retriever_service.retrieve(
                    prompt_text, session.organization
                )

            # 3. Rerank
            with self.telemetry_logger.timer("reranking"):
                reranked_chunks = self.reranker_service.rerank(chunks)

            # 4. Prompt compilation
            with self.telemetry_logger.timer("prompt"):
                prompt_ctx = self.prompt_builder.build_copilot_prompt(
                    context=context,
                    retrieved_chunks=reranked_chunks,
                    user_message=prompt_text,
                    version="v1",
                )

            # 5. LLM stream
            accumulated_content = []
            interval = heartbeat_interval or CopilotSettings.STREAM_HEARTBEAT_SECONDS
            last_heartbeat = time.time()

            with self.telemetry_logger.timer("llm"):
                for chunk_text in self.llm_gateway.stream(prompt_ctx):
                    if time.time() - last_heartbeat >= interval:
                        yield StreamEventDTO(
                            event_id=0,
                            event_type="heartbeat",
                            payload="keep-alive",
                        )
                        last_heartbeat = time.time()
                    accumulated_content.append(chunk_text)
                    yield StreamEventDTO(
                        event_id=event_id,
                        event_type="token",
                        payload=chunk_text,
                    )
                    event_id += 1

            full_content = "".join(accumulated_content)

            # 6. Post-processing
            with self.telemetry_logger.timer("postprocess"):
                citations = self.citation_service.extract_citations(
                    reranked_chunks, full_content
                )
                confidence = self.confidence_engine.calculate_confidence(
                    reranked_chunks
                )
                suggested_questions = (
                    self.suggested_questions_service.generate_questions(
                        context, reranked_chunks
                    )
                )

                completion_tokens = max(1, len(full_content) // 4)
                cost = getattr(
                    self.llm_gateway, "calculate_cost", _default_calculate_cost
                )(
                    prompt_tokens=prompt_ctx.estimated_tokens,
                    completion_tokens=completion_tokens,
                )
                usage_dto = UsageDTO(
                    prompt_tokens=prompt_ctx.estimated_tokens,
                    completion_tokens=completion_tokens,
                    total_tokens=prompt_ctx.estimated_tokens + completion_tokens,
                    estimated_cost=cost,
                    provider=CopilotSettings.DEFAULT_LLM_PROVIDER,
                    model=CopilotSettings.DEFAULT_MODEL,
                    latency_ms=sum(self.telemetry_logger.stage_timings.values()),
                )

            # Yield citation event
            yield StreamEventDTO(
                event_id=event_id,
                event_type="citation",
                payload=[
                    {
                        "document_id": getattr(c, "document_id", ""),
                        "document_title": getattr(c, "document_title", ""),
                        "page": getattr(c, "page", 1),
                        "chunk_index": getattr(c, "chunk_index", 0),
                        "similarity": getattr(c, "similarity", 0.0),
                        "snippet": getattr(c, "snippet", ""),
                    }
                    for c in citations
                ],
            )
            event_id += 1

            # Yield confidence event
            yield StreamEventDTO(
                event_id=event_id,
                event_type="confidence",
                payload=(
                    dataclasses.asdict(confidence)
                    if hasattr(confidence, "__dataclass_fields__")
                    else confidence
                ),
            )
            event_id += 1

            # Yield suggested_questions event
            yield StreamEventDTO(
                event_id=event_id,
                event_type="suggested_questions",
                payload=suggested_questions,
            )
            event_id += 1

            # Yield usage event
            yield StreamEventDTO(
                event_id=event_id,
                event_type="usage",
                payload=dataclasses.asdict(usage_dto),
            )
            event_id += 1

            # 7. Persist messages only when completed successfully
            with self.telemetry_logger.timer("persist"):
                ChatMessage.objects.create(
                    session=session,
                    role=MessageRole.USER,
                    content=prompt_text,
                    tokens=prompt_ctx.estimated_tokens,
                    prompt_tokens=prompt_ctx.estimated_tokens,
                    completion_tokens=0,
                )
                ChatMessage.objects.create(
                    session=session,
                    role=MessageRole.ASSISTANT,
                    content=full_content,
                    tokens=completion_tokens,
                    prompt_tokens=prompt_ctx.estimated_tokens,
                    completion_tokens=completion_tokens,
                )
                session.last_message_preview = full_content[:255]
                session.last_message_at = timezone.now()
                session.token_count += usage_dto.total_tokens
                session.save(
                    update_fields=[
                        "last_message_preview",
                        "last_message_at",
                        "token_count",
                    ]
                )

            # Yield done event
            yield StreamEventDTO(
                event_id=event_id,
                event_type="done",
                payload={"session_id": str(session.id), "status": "completed"},
            )

        except GeneratorExit:
            # Client disconnected - do NOT persist incomplete turn!
            logger.warning("Streaming cancelled by client disconnect.")
            raise
        except Exception as exc:
            if hasattr(exc, "to_dict"):
                err_payload = exc.to_dict()
            else:
                err_payload = {
                    "error": str(exc),
                    "code": getattr(exc, "code", "INTERNAL_SERVER_ERROR"),
                }
            yield StreamEventDTO(
                event_id=event_id,
                event_type="error",
                payload=err_payload,
            )
