# Task 4: post-processing services, CopilotOrchestrator, and SSE stream interface

- [x] Extend `CitationDTO` with highlight offsets, source URL, and version.
- [x] Extend `BaseLLMGateway` with `stream()` interface (stub implementation).
- [x] Update `MockLLMGateway` and `OpenAILLMGateway` to support `stream()` stub.
- [x] Create `apps/knowledge/services/citations/citation_service.py` (`CitationService` consuming DTOs).
- [x] Create `apps/knowledge/services/confidence/confidence_engine.py` (`ConfidenceEngine` consuming DTOs).
- [x] Create `apps/knowledge/services/orchestration/suggested_questions_service.py` (`SuggestedQuestionsService` consuming DTOs).
- [x] Create `apps/knowledge/services/orchestration/copilot_orchestrator.py` (`CopilotOrchestrator` as the single entry point).
- [x] Implement structured Telemetry stage latency metrics inside `CopilotOrchestrator`.
- [x] Update `ChatMessageListView` in `copilot_views.py` to inherit from `generics.ListCreateAPIView`, accept POST payloads, call the orchestrator, and return serialized `CopilotResponseDTO`.
- [x] Register new serializers `ChatMessageCreateSerializer`, `CopilotCitationSerializer`, `CopilotConfidenceSerializer`, and `CopilotResponseSerializer` in `serializers.py`.
- [x] Create test suite `backend/apps/knowledge/tests/test_task4_orchestrator.py` (all tests passed).
- [x] Quality Gates & Verification:
  - [x] Ruff check & format (All checks pass)
  - [x] Mypy type checking (Type safe on new packages)
  - [x] Pytest full test suite (98/98 passed)
  - [x] Spectacular OpenAPI schema verify (0 errors)
  - [x] Docker build verify (Succeeded)
