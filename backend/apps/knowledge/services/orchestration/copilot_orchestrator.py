"""
Orchestration entry point coordinating memory, retrieval, prompt construction,
LLM execution, and post-processing.
"""

import dataclasses
import logging
import time
from typing import Any, Iterator, Optional

from django.db.models import F
from django.utils import timezone

from apps.knowledge.models import ChatMessage, ChatSession, MessageRole
from apps.knowledge.services.citations.citation_service import CitationService
from apps.knowledge.services.confidence.confidence_engine import ConfidenceEngine
from apps.knowledge.services.config import CopilotSettings
from apps.knowledge.services.dtos import (
    CopilotResponseDTO,
    StreamEventDTO,
    UsageDTO,
)
from apps.knowledge.services.exceptions import (
    ErrorCode,
    LLMException,
    ValidationException,
)
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
    """Fallback cost estimator when a gateway does not provide one."""
    return 0.0


class CopilotOrchestrator:
    """
    Coordinates the entire execution pipeline for a Copilot chat turn.

    Pipeline:

        request
          ↓
        validation
          ↓
        memory
          ↓
        retrieval
          ↓
        reranking
          ↓
        prompt construction
          ↓
        LLM gateway
          ↓
        post-processing
          ↓
        persistence
          ↓
        response
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
        suggested_questions_service: Optional[
            SuggestedQuestionsService
        ] = None,
        telemetry_logger: Optional[TelemetryLogger] = None,
    ) -> None:
        self.memory_service = (
            memory_service or ConversationMemoryService()
        )
        self.retriever_service = (
            retriever_service or HybridRetrieverService()
        )
        self.reranker_service = (
            reranker_service or ReRankerService()
        )
        self.prompt_builder = prompt_builder or PromptBuilder()
        self.llm_gateway = llm_gateway or get_llm_gateway()
        self.citation_service = (
            citation_service or CitationService()
        )
        self.confidence_engine = (
            confidence_engine or ConfidenceEngine()
        )
        self.suggested_questions_service = (
            suggested_questions_service
            or SuggestedQuestionsService()
        )
        self.telemetry_logger = (
            telemetry_logger or TelemetryLogger()
        )

    def _validate_request(
        self,
        session: ChatSession,
        prompt_text: str,
    ) -> None:
        """Validate session status and prompt constraints."""

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
                (
                    "Prompt exceeds maximum length of "
                    f"{CopilotSettings.MAX_MESSAGE_LENGTH} characters."
                ),
                code=ErrorCode.PROMPT_TOO_LONG.value,
            )

    def _get_provider(self) -> str:
        """Return the active LLM provider."""

        return str(
            getattr(
                self.llm_gateway,
                "provider",
                CopilotSettings.DEFAULT_LLM_PROVIDER,
            )
        )

    def _get_model(self) -> str:
        """Return the active LLM model."""

        return str(
            getattr(
                self.llm_gateway,
                "model",
                CopilotSettings.DEFAULT_MODEL,
            )
        )

    def _calculate_cost(
        self,
        prompt_tokens: int,
        completion_tokens: int,
    ) -> float:
        """Calculate gateway-specific or fallback LLM cost."""

        calculate_cost = getattr(
            self.llm_gateway,
            "calculate_cost",
            _default_calculate_cost,
        )

        return calculate_cost(
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
        )

    def execute_turn(
        self,
        session: ChatSession,
        question: str,
    ) -> CopilotResponseDTO:
        """Backward-compatible wrapper around execute()."""

        return self.execute(
            session=session,
            message=question,
        )

    def execute(
        self,
        session: ChatSession,
        message: str = "",
        question: str = "",
        **kwargs: Any,
    ) -> CopilotResponseDTO:
        """
        Execute a complete non-streaming Copilot conversation turn.
        """

        pipeline_start = time.perf_counter()

        prompt_text = (
            message
            or question
            or kwargs.get("user_message", "")
        ).strip()

        self._validate_request(
            session,
            prompt_text,
        )

        latency_metrics: dict[str, float] = {}

        # --------------------------------------------------------------
        # 1. Memory
        # --------------------------------------------------------------
        with self.telemetry_logger.timer("memory"):
            context = self.memory_service.load_history(session)

        latency_metrics["memory_ms"] = (
            self.telemetry_logger.stage_timings.get(
                "memory",
                0.0,
            )
        )

        # --------------------------------------------------------------
        # 2. Retrieval
        # --------------------------------------------------------------
        with self.telemetry_logger.timer("retrieval"):
            chunks = self.retriever_service.retrieve(
                prompt_text,
                session.organization,
            )

        latency_metrics["retrieval_ms"] = (
            self.telemetry_logger.stage_timings.get(
                "retrieval",
                0.0,
            )
        )

        # --------------------------------------------------------------
        # 3. Reranking
        # --------------------------------------------------------------
        with self.telemetry_logger.timer("reranking"):
            reranked_chunks = self.reranker_service.rerank(
                chunks
            )

        latency_metrics["reranking_ms"] = (
            self.telemetry_logger.stage_timings.get(
                "reranking",
                0.0,
            )
        )

        # --------------------------------------------------------------
        # 4. Prompt construction
        # --------------------------------------------------------------
        with self.telemetry_logger.timer("prompt"):
            prompt_ctx = (
                self.prompt_builder.build_copilot_prompt(
                    context=context,
                    retrieved_chunks=reranked_chunks,
                    user_message=prompt_text,
                    version="v1",
                )
            )

        latency_metrics["prompt_building_ms"] = (
            self.telemetry_logger.stage_timings.get(
                "prompt",
                0.0,
            )
        )

        # --------------------------------------------------------------
        # 5. Persist user message
        # --------------------------------------------------------------
        with self.telemetry_logger.timer("persist"):
            ChatMessage.objects.create(
                session=session,
                role=MessageRole.USER,
                content=prompt_text,
                tokens=prompt_ctx.estimated_tokens,
                prompt_tokens=prompt_ctx.estimated_tokens,
                completion_tokens=0,
            )

        user_persist_ms = self.telemetry_logger.stage_timings.get(
            "persist",
            0.0,
        )

        # --------------------------------------------------------------
        # 6. LLM generation
        # --------------------------------------------------------------
        logger.info(
            "COPILOT LLM PROMPT METRICS: "
            "estimated_tokens=%s system_chars=%s "
            "user_chars=%s context_chars=%s "
            "history_chars=%s raw_user_chars=%s model=%s",
            prompt_ctx.estimated_tokens,
            len(prompt_ctx.system_prompt),
            len(prompt_ctx.user_prompt),
            len(prompt_ctx.context_text),
            len(prompt_ctx.history_text),
            len(prompt_ctx.raw_user_message or ""),
            self._get_model(),
        )

        with self.telemetry_logger.timer("llm"):
            llm_response = self.llm_gateway.generate(
                prompt_ctx
            )

        llm_ms = self.telemetry_logger.stage_timings.get(
            "llm",
            0.0,
        )

        latency_metrics["llm_ms"] = llm_ms

        logger.info(
            "COPILOT LLM STAGE: elapsed_ms=%.2f output_chars=%s",
            llm_ms,
            len(llm_response.content)
            if llm_response and llm_response.content
            else 0,
        )

        if not llm_response or not llm_response.content:
            raise LLMException(
                "LLM gateway returned an empty response.",
                code=ErrorCode.LLM_ERROR.value,
                status_code=502,
            )

        # --------------------------------------------------------------
        # 7. Post-processing
        # --------------------------------------------------------------
        with self.telemetry_logger.timer("postprocess"):
            citations = self.citation_service.extract_citations(
                reranked_chunks,
                llm_response.content,
            )

            confidence = (
                self.confidence_engine.calculate_confidence(
                    reranked_chunks
                )
            )

            suggested_questions = (
                self.suggested_questions_service.generate_questions(
                    context,
                    reranked_chunks,
                )
            )

            cost = self._calculate_cost(
                prompt_tokens=llm_response.prompt_tokens,
                completion_tokens=llm_response.completion_tokens,
            )

            usage_dto = UsageDTO(
                prompt_tokens=llm_response.prompt_tokens,
                completion_tokens=llm_response.completion_tokens,
                total_tokens=llm_response.total_tokens,
                estimated_cost=cost,
                provider=str(
                    llm_response.metadata.get(
                        "provider",
                        self._get_provider(),
                    )
                ),
                model=str(
                    llm_response.model
                    or self._get_model()
                ),
                latency_ms=llm_response.latency_ms,
            )

        latency_metrics["post_processing_ms"] = (
            self.telemetry_logger.stage_timings.get(
                "postprocess",
                0.0,
            )
        )

        # --------------------------------------------------------------
        # 8. Persist assistant message
        # --------------------------------------------------------------
        with self.telemetry_logger.timer("persist"):
            assistant_msg = ChatMessage.objects.create(
                session=session,
                role=MessageRole.ASSISTANT,
                content=llm_response.content,
                tokens=llm_response.completion_tokens,
                prompt_tokens=llm_response.prompt_tokens,
                completion_tokens=llm_response.completion_tokens,
                metadata={
                    "is_clean_response": True,
                },
            )

            session.last_message_preview = (
                llm_response.content[:255]
            )
            session.last_message_at = timezone.now()
            session.token_count = (
                F("token_count")
                + llm_response.total_tokens
            )

            session.save(
                update_fields=[
                    "last_message_preview",
                    "last_message_at",
                    "token_count",
                ]
            )

        assistant_persist_ms = (
            self.telemetry_logger.stage_timings.get(
                "persist",
                0.0,
            )
        )

        latency_metrics["persist_ms"] = (
            user_persist_ms + assistant_persist_ms
        )

        # --------------------------------------------------------------
        # 9. Telemetry
        # --------------------------------------------------------------
        total_latency = (
            time.perf_counter() - pipeline_start
        ) * 1000.0

        latency_metrics["total_latency_ms"] = round(
            total_latency,
            2,
        )

        self.telemetry_logger.record_stage(
            "total",
            total_latency,
        )

        logger.info(
            "COPILOT PIPELINE TIMINGS: %s",
            latency_metrics,
        )

        self.telemetry_logger.log_event(
            "copilot_chat_turn",
            latency_metrics,
        )

        self.telemetry_logger.log_chat_turn(
            session_id=str(session.id),
            message_id=str(assistant_msg.id),
            usage=dataclasses.asdict(usage_dto),
            stage_timings=dict(
                self.telemetry_logger.stage_timings
            ),
        )

        # --------------------------------------------------------------
        # 10. Response
        # --------------------------------------------------------------
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
                "provider": self._get_provider(),
                "model": self._get_model(),
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
        Execute a streaming Copilot conversation turn.

        The LLM gateway yields visible text chunks.
        Those chunks are immediately converted into SSE token events
        by the API layer.
        """

        pipeline_start = time.perf_counter()

        prompt_text = (
            message
            or question
            or kwargs.get("user_message", "")
        ).strip()

        event_id = 1

        try:
            # ----------------------------------------------------------
            # Validation
            # ----------------------------------------------------------
            self._validate_request(
                session,
                prompt_text,
            )

            # ----------------------------------------------------------
            # Start event
            # ----------------------------------------------------------
            yield StreamEventDTO(
                event_id=event_id,
                event_type="start",
                payload={
                    "session_id": str(session.id),
                    "status": "started",
                },
            )

            event_id += 1

            # ----------------------------------------------------------
            # 1. Memory
            # ----------------------------------------------------------
            with self.telemetry_logger.timer("memory"):
                context = self.memory_service.load_history(
                    session
                )

            # ----------------------------------------------------------
            # 2. Retrieval
            # ----------------------------------------------------------
            with self.telemetry_logger.timer("retrieval"):
                chunks = self.retriever_service.retrieve(
                    prompt_text,
                    session.organization,
                )

            # ----------------------------------------------------------
            # 3. Reranking
            # ----------------------------------------------------------
            with self.telemetry_logger.timer("reranking"):
                reranked_chunks = self.reranker_service.rerank(
                    chunks
                )

            # ----------------------------------------------------------
            # 4. Prompt construction
            # ----------------------------------------------------------
            with self.telemetry_logger.timer("prompt"):
                prompt_ctx = (
                    self.prompt_builder.build_copilot_prompt(
                        context=context,
                        retrieved_chunks=reranked_chunks,
                        user_message=prompt_text,
                        version="v1",
                    )
                )

            # ----------------------------------------------------------
            # 5. Persist user message
            # ----------------------------------------------------------
            with self.telemetry_logger.timer("persist"):
                ChatMessage.objects.create(
                    session=session,
                    role=MessageRole.USER,
                    content=prompt_text,
                    tokens=prompt_ctx.estimated_tokens,
                    prompt_tokens=prompt_ctx.estimated_tokens,
                    completion_tokens=0,
                )

            user_persist_ms = (
                self.telemetry_logger.stage_timings.get(
                    "persist",
                    0.0,
                )
            )

            # ----------------------------------------------------------
            # Prompt metrics
            # ----------------------------------------------------------
            logger.info(
                "COPILOT LLM PROMPT METRICS: "
                "estimated_tokens=%s system_chars=%s "
                "user_chars=%s context_chars=%s "
                "history_chars=%s raw_user_chars=%s model=%s",
                prompt_ctx.estimated_tokens,
                len(prompt_ctx.system_prompt),
                len(prompt_ctx.user_prompt),
                len(prompt_ctx.context_text),
                len(prompt_ctx.history_text),
                len(prompt_ctx.raw_user_message or ""),
                self._get_model(),
            )

            # ----------------------------------------------------------
            # 6. LLM streaming
            # ----------------------------------------------------------
            accumulated_content: list[str] = []

            interval = (
                heartbeat_interval
                if heartbeat_interval is not None
                else CopilotSettings.STREAM_HEARTBEAT_SECONDS
            )

            last_heartbeat = time.time()

            with self.telemetry_logger.timer("llm"):
                for chunk_text in self.llm_gateway.stream(
                    prompt_ctx
                ):
                    if chunk_text is None:
                        continue

                    chunk_text = str(chunk_text)

                    if not chunk_text:
                        continue

                    if time.time() - last_heartbeat >= interval:
                        yield StreamEventDTO(
                            event_id=0,
                            event_type="heartbeat",
                            payload="keep-alive",
                        )

                        last_heartbeat = time.time()

                    accumulated_content.append(
                        chunk_text
                    )

                    yield StreamEventDTO(
                        event_id=event_id,
                        event_type="token",
                        payload=chunk_text,
                    )

                    event_id += 1

            llm_ms = self.telemetry_logger.stage_timings.get(
                "llm",
                0.0,
            )

            full_content = "".join(
                accumulated_content
            ).strip()

            logger.info(
                "COPILOT LLM STAGE: "
                "elapsed_ms=%.2f output_chars=%s chunks=%s",
                llm_ms,
                len(full_content),
                len(accumulated_content),
            )

            if not full_content:
                raise LLMException(
                    "LLM gateway returned an empty streaming response.",
                    code=ErrorCode.LLM_ERROR.value,
                    status_code=502,
                )

            # ----------------------------------------------------------
            # 7. Post-processing
            # ----------------------------------------------------------
            with self.telemetry_logger.timer(
                "postprocess"
            ):
                citations = (
                    self.citation_service.extract_citations(
                        reranked_chunks,
                        full_content,
                    )
                )

                confidence = (
                    self.confidence_engine.calculate_confidence(
                        reranked_chunks
                    )
                )

                suggested_questions = (
                    self.suggested_questions_service.generate_questions(
                        context,
                        reranked_chunks,
                    )
                )

                completion_tokens = max(
                    1,
                    len(full_content) // 4,
                )

                prompt_tokens = max(
                    0,
                    prompt_ctx.estimated_tokens,
                )

                total_tokens = (
                    prompt_tokens + completion_tokens
                )

                cost = self._calculate_cost(
                    prompt_tokens=prompt_tokens,
                    completion_tokens=completion_tokens,
                )

                usage_dto = UsageDTO(
                    prompt_tokens=prompt_tokens,
                    completion_tokens=completion_tokens,
                    total_tokens=total_tokens,
                    estimated_cost=cost,
                    provider=self._get_provider(),
                    model=self._get_model(),
                    latency_ms=llm_ms,
                )

            # ----------------------------------------------------------
            # 8. Citation event
            # ----------------------------------------------------------
            yield StreamEventDTO(
                event_id=event_id,
                event_type="citation",
                payload=[
                    {
                        "document_id": getattr(
                            citation,
                            "document_id",
                            "",
                        ),
                        "document_title": getattr(
                            citation,
                            "document_title",
                            "",
                        ),
                        "page": getattr(
                            citation,
                            "page",
                            1,
                        ),
                        "chunk_index": getattr(
                            citation,
                            "chunk_index",
                            0,
                        ),
                        "similarity": getattr(
                            citation,
                            "similarity",
                            0.0,
                        ),
                        "snippet": getattr(
                            citation,
                            "snippet",
                            "",
                        ),
                    }
                    for citation in citations
                ],
            )

            event_id += 1

            # ----------------------------------------------------------
            # 9. Confidence event
            # ----------------------------------------------------------
            yield StreamEventDTO(
                event_id=event_id,
                event_type="confidence",
                payload=(
                    dataclasses.asdict(confidence)
                    if dataclasses.is_dataclass(confidence)
                    else confidence
                ),
            )

            event_id += 1

            # ----------------------------------------------------------
            # 10. Suggested questions event
            # ----------------------------------------------------------
            yield StreamEventDTO(
                event_id=event_id,
                event_type="suggested_questions",
                payload=suggested_questions,
            )

            event_id += 1

            # ----------------------------------------------------------
            # 11. Usage event
            # ----------------------------------------------------------
            yield StreamEventDTO(
                event_id=event_id,
                event_type="usage",
                payload=dataclasses.asdict(
                    usage_dto
                ),
            )

            event_id += 1

            # ----------------------------------------------------------
            # 12. Persist assistant response
            # ----------------------------------------------------------
            with self.telemetry_logger.timer(
                "persist"
            ):
                ChatMessage.objects.create(
                    session=session,
                    role=MessageRole.ASSISTANT,
                    content=full_content,
                    tokens=completion_tokens,
                    prompt_tokens=prompt_tokens,
                    completion_tokens=completion_tokens,
                    metadata={
                        "is_clean_response": True,
                    },
                )

                session.last_message_preview = (
                    full_content[:255]
                )
                session.last_message_at = timezone.now()
                session.token_count = (
                    F("token_count") + total_tokens
                )

                session.save(
                    update_fields=[
                        "last_message_preview",
                        "last_message_at",
                        "token_count",
                    ]
                )

            assistant_persist_ms = (
                self.telemetry_logger.stage_timings.get(
                    "persist",
                    0.0,
                )
            )

            # ----------------------------------------------------------
            # 13. Final telemetry
            # ----------------------------------------------------------
            total_latency_ms = (
                time.perf_counter() - pipeline_start
            ) * 1000.0

            stage_timings = dict(
                self.telemetry_logger.stage_timings
            )

            stage_timings["total"] = round(
                total_latency_ms,
                2,
            )

            logger.info(
                "COPILOT STREAM PIPELINE TIMINGS: "
                "memory_ms=%.2f retrieval_ms=%.2f "
                "reranking_ms=%.2f prompt_ms=%.2f "
                "llm_ms=%.2f postprocess_ms=%.2f "
                "persist_user_ms=%.2f persist_assistant_ms=%.2f "
                "total_ms=%.2f",
                stage_timings.get("memory", 0.0),
                stage_timings.get("retrieval", 0.0),
                stage_timings.get("reranking", 0.0),
                stage_timings.get("prompt", 0.0),
                stage_timings.get("llm", 0.0),
                stage_timings.get("postprocess", 0.0),
                user_persist_ms,
                assistant_persist_ms,
                total_latency_ms,
            )

            self.telemetry_logger.record_stage(
                "total",
                total_latency_ms,
            )

            self.telemetry_logger.log_event(
                "copilot_stream_turn",
                {
                    "memory_ms": stage_timings.get(
                        "memory",
                        0.0,
                    ),
                    "retrieval_ms": stage_timings.get(
                        "retrieval",
                        0.0,
                    ),
                    "reranking_ms": stage_timings.get(
                        "reranking",
                        0.0,
                    ),
                    "prompt_ms": stage_timings.get(
                        "prompt",
                        0.0,
                    ),
                    "llm_ms": stage_timings.get(
                        "llm",
                        0.0,
                    ),
                    "postprocess_ms": stage_timings.get(
                        "postprocess",
                        0.0,
                    ),
                    "persist_user_ms": user_persist_ms,
                    "persist_assistant_ms": assistant_persist_ms,
                    "total_ms": round(
                        total_latency_ms,
                        2,
                    ),
                    "output_chars": len(full_content),
                    "token_chunks": len(
                        accumulated_content
                    ),
                    "model": self._get_model(),
                    "provider": self._get_provider(),
                },
            )

            # ----------------------------------------------------------
            # 14. Done
            # ----------------------------------------------------------
            yield StreamEventDTO(
                event_id=event_id,
                event_type="done",
                payload={
                    "session_id": str(session.id),
                    "status": "completed",
                },
            )

        except GeneratorExit:
            logger.warning(
                "Streaming cancelled by client disconnect."
            )
            raise

        except Exception as exc:
            logger.exception(
                "Copilot streaming failed."
            )

            if hasattr(exc, "to_dict"):
                err_payload = exc.to_dict()
            else:
                err_payload = {
                    "error": str(exc),
                    "code": getattr(
                        exc,
                        "code",
                        "INTERNAL_SERVER_ERROR",
                    ),
                }

            yield StreamEventDTO(
                event_id=event_id,
                event_type="error",
                payload=err_payload,
            )