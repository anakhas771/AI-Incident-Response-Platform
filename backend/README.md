# AI Incident Response Platform - Backend Engine

Enterprise Django REST Framework backend designed for scalability, asynchronous task processing, and clean domain isolation.

---

## Folder Architecture

```
backend/
├── apps/
│   ├── accounts/             # Custom AbstractUser User model
│   ├── incidents/            # Incidents domain stub app
│   ├── monitoring/           # Monitoring domain stub app
│   ├── logs/                 # Telemetry & logs domain stub app
│   ├── ai_engine/            # AI Engine (LangChain/LangGraph/FAISS) stub app
│   └── common/               # Shared base models, exceptions, health check
├── config/
│   ├── settings/
│   │   ├── __init__.py
│   │   ├── base.py           # Core settings (DRF, CORS, Redis, Logging)
│   │   ├── development.py    # Local dev overrides & debug toolbar
│   │   └── production.py     # Production security headers & renderer
│   ├── asgi.py
│   ├── celery.py             # Task queue initialization & route definitions
│   ├── urls.py               # API versioning (/api/v1/) & Swagger docs
│   └── wsgi.py
├── requirements/
│   ├── base.txt              # Shared runtime dependencies
│   ├── development.txt       # Development & testing tooling
│   └── production.txt        # Production WSGI/Sentry dependencies
├── scripts/
│   └── run_dev.sh            # Helper launch script
├── .env.example              # Environment variables template
├── manage.py                 # Management script with python-dotenv loading
├── pyproject.toml            # Code quality settings (Ruff, Black, isort, mypy)
└── README.md
```

---

## Features Implemented in Bootstrap

- **Custom User Model**: `apps.accounts.models.User` extending `AbstractUser`.
- **Environment Management**: `python-dotenv` support loading from `.env`.
- **Split Settings**: `config.settings.base`, `config.settings.development`, `config.settings.production`.
- **Health Check Endpoint**: GET `/api/v1/health/` inspecting Postgres & Redis readiness.
- **Celery Engine**: Configured in `config/celery.py` with task queue separation (`default` and `ai_tasks`).
- **Structured JSON Logging**: Formatters configured for production JSON outputs.
- **API Versioning**: Prefix `/api/v1/` with Swagger UI documentation available at `/api/schema/swagger-ui/`.

---

## Getting Started

```bash
# 1. Create virtual environment & install development dependencies
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements/development.txt

# 2. Copy environment template
cp .env.example .env

# 3. Apply database migrations
python manage.py migrate

# 4. Run development server
python manage.py runserver
```
