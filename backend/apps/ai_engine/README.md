# AI Engine - Phase 4.1 AI Engine Foundation

Enterprise AI Incident Response service layer and REST API for automatic triage, severity prediction, and remediation guidance.

---

## 1. Architecture

The `apps.ai_engine` application follows a clean, layered architecture designed to keep domain logic, LLM provider communication, and REST API serialization strictly isolated:

```
apps/ai_engine/
├── api/
│   ├── serializers.py      # Request and Response DRF Serializers
│   └── views.py            # APIViews for Analysis, Severity, and Recommendations
├── prompts/
│   ├── incident_prompts.py # User Prompt Builders
│   └── system_prompts.py   # Standardized System Instructions
├── services/
│   ├── llm_client.py       # Provider-Agnostic LLM Abstraction Layer
│   ├── incident_analyzer.py# Incident Synthesis & Root Cause Analyzer
│   ├── severity_predictor.py# Severity Classification & Confidence Scorer
│   └── recommendation_engine.py # Actionable Checklist & Mitigation Generator
└── urls.py                 # URL Routing (/api/ai/* and /api/v1/ai/*)
```

### Key Architectural Design Principles

1. **Provider-Agnostic Abstraction**: `LLMClient` isolates underlying model APIs (`mock`, `openai`, `anthropic`). Domain services never depend directly on vendor SDKs.
2. **Deterministic Fallbacks**: When running in local development or CI (`AI_PROVIDER=mock`), `LLMClient` returns deterministic, realistic enterprise responses without requiring external network calls or API keys.
3. **Structured JSON Output**: All domain services enforce structured JSON contracts with strict key normalization and type validation.

---

## 2. Services

### `LLMClient` (`services.llm_client.LLMClient`)

- Reads configuration from environment variables (`AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL`).
- Provides `generate_response(prompt, system_prompt, **kwargs)` and `generate_json(prompt, system_prompt, **kwargs)` with automatic markdown stripping and JSON error recovery.
- Uses `logging` for auditability and debug tracing.

### `IncidentAnalyzer` (`services.incident_analyzer.IncidentAnalyzer`)

- Synthesizes incident title, description, and logs into a structured triage report.
- **Output Schema**:
  ```json
  {
    "summary": "Executive summary of the incident.",
    "probable_root_cause": "Technical probable root cause analysis.",
    "affected_components": ["API Gateway", "Database Cluster"],
    "recommended_actions": ["Scale replicas", "Audit deployments"]
  }
  ```

### `SeverityPredictor` (`services.severity_predictor.SeverityPredictor`)

- Evaluates incident category, user blast radius (`affected_users`), impact, and description to predict standardized severity levels (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`) and confidence scores (`0.0` to `1.0`).
- **Output Schema**:
  ```json
  {
    "predicted_severity": "CRITICAL",
    "confidence_score": 0.94
  }
  ```

### `RecommendationEngine` (`services.recommendation_engine.RecommendationEngine`)

- Generates immediate mitigation actions, systematic investigation checklists, and long-term prevention measures.
- **Output Schema**:
  ```json
  {
    "immediate_mitigation_steps": [
      "Isolate affected services from public routing."
    ],
    "investigation_checklist": ["Review application audit logs."],
    "prevention_recommendations": [
      "Implement automated alerting for latency spikes."
    ]
  }
  ```

---

## 3. API Usage

All endpoints are authenticated (`IsAuthenticated`) and accept/return JSON payloads. They are accessible via both `/api/ai/` and `/api/v1/ai/`.

### 1. Analyze Incident

- **Endpoint**: `POST /api/ai/analyze/`
- **Request**:
  ```json
  {
    "title": "API Gateway Latency Spike",
    "description": "504 Gateway Timeout errors across us-east-1 endpoints.",
    "logs": "2026-07-30T10:00:00Z ERROR upstream connection refused",
    "severity": "HIGH",
    "impact": "Customer checkout API degradation"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "summary": "Automated AI summary for incident: API Gateway Latency Spike...",
    "probable_root_cause": "Resource exhaustion or configuration mismatch...",
    "affected_components": ["API Gateway", "Database Cluster"],
    "recommended_actions": ["Scale horizontal pod replicas..."]
  }
  ```

### 2. Predict Severity

- **Endpoint**: `POST /api/ai/predict-severity/`
- **Request**:
  ```json
  {
    "category": "infrastructure",
    "impact": "Complete outage on payment processing",
    "affected_users": 15000,
    "description": "Primary database cluster unreachable following maintenance."
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "predicted_severity": "CRITICAL",
    "confidence_score": 0.94
  }
  ```

### 3. Generate Recommendations

- **Endpoint**: `POST /api/ai/recommendations/`
- **Request**:
  ```json
  {
    "title": "Database Credential Leak Alert",
    "description": "Unusual read volume from unfamiliar IP addresses.",
    "category": "security",
    "severity": "CRITICAL",
    "affected_components": ["PostgreSQL Main DB", "IAM Role"]
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "immediate_mitigation_steps": ["Isolate affected database instances..."],
    "investigation_checklist": ["Check audit logs for unauthorized access..."],
    "prevention_recommendations": ["Enforce mandatory MFA on admin roles..."]
  }
  ```

---

## 4. Future LLM Integration

The service layer is designed for seamless extension:

1. **LangChain / LangGraph**: Agents can consume `LLMClient` as their underlying model provider or orchestrate multi-step reasoning loops using `IncidentAnalyzer` and `RecommendationEngine` as tool steps.
2. **FAISS / Vector Search**: Custom context retrieval (RAG) can be integrated into user prompt builders in `prompts/incident_prompts.py` by querying historical incident embeddings before invoking `LLMClient.generate_json`.
3. **Asynchronous Processing**: High-latency LLM calls can be dispatched to Celery background tasks (`ai_tasks` queue) using the same service layer abstractions.
