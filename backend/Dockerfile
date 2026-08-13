# Multi-Stage Dockerfile for Python/Django Backend

# Stage 1: Base image
FROM python:3.11-slim AS python-base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=off \
    PIP_DISABLE_PIP_VERSION_CHECK=on \
    PIP_DEFAULT_TIMEOUT=100 \
    APP_HOME=/app

WORKDIR $APP_HOME

# Install OS dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Stage 2: Development
FROM python-base AS development

COPY requirements/base.txt requirements/development.txt ./requirements/

RUN pip install -r requirements/development.txt

COPY . $APP_HOME

EXPOSE 8000
HEALTHCHECK --interval=15s --timeout=5s --retries=3 --start-period=15s \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/v1/health/') or exit(1)"
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

# Stage 3: Builder for Production
FROM python-base AS builder

COPY requirements/base.txt requirements/production.txt ./requirements/
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels -r requirements/production.txt

# Stage 4: Production Runtime
FROM python-base AS production

RUN groupadd -r appuser && useradd -r -g appuser appuser

COPY --from=builder /app/wheels /wheels
RUN pip install --no-cache /wheels/*

COPY . $APP_HOME

RUN chown -R appuser:appuser $APP_HOME
USER appuser

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=20s \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/v1/health/') or exit(1)"
CMD ["uvicorn", "config.asgi:application", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
