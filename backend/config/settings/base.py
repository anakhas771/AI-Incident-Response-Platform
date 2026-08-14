import os
from datetime import timedelta
from pathlib import Path

import dotenv
from corsheaders.defaults import default_headers

# Build paths inside the project like this: BASE_DIR / 'subfolder'
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Environment variable loading via python-dotenv
env_path = BASE_DIR / ".env"
if env_path.exists():
    dotenv.load_dotenv(env_path)

SECRET_KEY = os.environ.get("SECRET_KEY", "django-insecure-change-this-key")

DEBUG = os.environ.get("DEBUG", "False") == "True"

ALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")

# Local Application Packages
LOCAL_APPS = [
    "apps.common",
    "apps.accounts",
    "apps.incidents",
    "apps.logs",
    "apps.monitoring",
    "apps.ai_engine",
    "apps.knowledge",
]

# Installed Applications
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third Party Framework Packages
    "rest_framework",
    "corsheaders",
    "drf_spectacular",
] + LOCAL_APPS

AUTH_USER_MODEL = "accounts.User"


# Middleware Pipeline
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "apps.common.middleware.RequestLogMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

# PostgreSQL Database Configuration
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ.get("POSTGRES_DB", "incident_platform_db"),
        "USER": os.environ.get("POSTGRES_USER", "postgres_user"),
        "PASSWORD": os.environ.get("POSTGRES_PASSWORD", "postgres_secure_password_dev"),
        "HOST": os.environ.get("POSTGRES_HOST", "localhost"),
        "PORT": os.environ.get("POSTGRES_PORT", "5432"),
    }
}

# Password Validation
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"
    },
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# Timezone & Localization
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# Static & Media Files Settings
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Django REST Framework Configuration
REST_FRAMEWORK = {
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "100/minute",
        "user": "100/minute",
        "auth": "5/minute",
    },
}

# SimpleJWT Authentication Settings
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "AUTH_HEADER_NAME": "HTTP_AUTHORIZATION",
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
    "TOKEN_OBTAIN_SERIALIZER": "apps.accounts.serializers.CustomTokenObtainPairSerializer",
}

# OpenAPI Schema Documentation Settings
SPECTACULAR_SETTINGS = {
    "TITLE": "AI Incident Response Platform API",
    "DESCRIPTION": (
        "Enterprise API for AI Incident Response Platform with AI Engine and RAG Copilot"
    ),
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "SCHEMA_PATH_PREFIX": r"/api/v1/",
    "COMPONENT_SPLIT_REQUEST": True,
    "SECURITY": [{"jwtAuth": []}],
    "COMPONENTS": {
        "securitySchemes": {
            "jwtAuth": {
                "type": "http",
                "scheme": "bearer",
                "bearerFormat": "JWT",
            }
        }
    },
    "ENUM_NAME_OVERRIDES": {
        "UserRoleEnum": "apps.accounts.models.Role",
        "IncidentStatusEnum": "apps.incidents.models.Status",
        "IncidentSeverityEnum": "apps.incidents.models.Severity",
        "DocumentTypeEnum": "apps.knowledge.models.DocumentType",
        "DocumentStatusEnum": "apps.knowledge.models.DocumentStatus",
    },
    "SWAGGER_UI_SETTINGS": {
        "deepLinking": True,
        "persistAuthorization": True,
        "displayOperationId": True,
    },
}

# Redis Caching Configuration
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": os.environ.get("REDIS_URL", "redis://127.0.0.1:6379/0"),
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
        },
    }
}

# Celery Task Engine Configuration
CELERY_BROKER_URL = os.environ.get("CELERY_BROKER_URL", "redis://127.0.0.1:6379/0")
CELERY_RESULT_BACKEND = os.environ.get(
    "CELERY_RESULT_BACKEND", "redis://127.0.0.1:6379/0"
)
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = TIME_ZONE
CELERY_TASK_DEFAULT_QUEUE = os.environ.get("CELERY_TASK_DEFAULT_QUEUE", "default")
CELERY_TASK_ACKS_LATE = True
CELERY_TASK_REJECT_ON_WORKER_LOST = True
CELERY_TASK_DEFAULT_RETRY_DELAY = 60
CELERY_TASK_MAX_RETRIES = 3
CELERY_TASK_ALWAYS_EAGER = os.environ.get("CELERY_TASK_ALWAYS_EAGER", "False") == "True"

# CORS Configuration
CORS_ALLOWED_ORIGINS = os.environ.get(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173",
).split(",")
CORS_ALLOW_HEADERS = list(default_headers) + [
    "x-client-request-time",
]
# Standard Logging Configuration
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {process:d} {thread:d} {message}",
            "style": "{",
        },
        "simple": {
            "format": "{levelname} {message}",
            "style": "{",
        },
        "structured": {
            "format": '{{"level": "{levelname}", "timestamp": "{asctime}", "module": "{module}", "message": "{message}", "request_id": "{request_id}", "user_id": "{user_id}", "org_id": "{org_id}"}}',
            "style": "{",
        },
    },
    "filters": {
        "request_context": {
            "()": "apps.common.middleware.RequestContextFilter",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "structured",
            "filters": ["request_context"],
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": os.getenv("DJANGO_LOG_LEVEL", "INFO"),
            "propagate": False,
        },
        "audit": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
    },
}

# Email Configuration
EMAIL_BACKEND = os.environ.get(
    "EMAIL_BACKEND", "django.core.mail.backends.console.EmailBackend"
)
EMAIL_HOST = os.environ.get("EMAIL_HOST", "localhost")
EMAIL_PORT = int(os.environ.get("EMAIL_PORT", 1025))
EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD", "")
EMAIL_USE_TLS = os.environ.get("EMAIL_USE_TLS", "False") == "True"
DEFAULT_FROM_EMAIL = os.environ.get("DEFAULT_FROM_EMAIL", "noreply@example.com")
FRONTEND_BASE_URL = os.environ.get("FRONTEND_BASE_URL", "http://localhost:3000")

# AI Engine & Knowledge RAG Settings
AI_ENGINE_CONFIG = {
    "PROVIDER": os.environ.get("AI_PROVIDER", "mock"),
    "API_KEY": os.environ.get("AI_API_KEY", ""),
    "MODEL": os.environ.get("AI_MODEL", "gpt-4-turbo"),
}

KNOWLEDGE_RAG_CONFIG = {
    "EMBEDDING_PROVIDER": os.environ.get("EMBEDDING_PROVIDER", "mock"),
    "EMBEDDING_MODEL": os.environ.get("EMBEDDING_MODEL", "text-embedding-3-small"),
    "EMBEDDING_API_KEY": os.environ.get("EMBEDDING_API_KEY", ""),
    "EMBEDDING_DIMENSION": int(os.environ.get("EMBEDDING_DIMENSION", "1536")),
    "CHUNK_SIZE": int(os.environ.get("CHUNK_SIZE", "500")),
    "CHUNK_OVERLAP": int(os.environ.get("CHUNK_OVERLAP", "100")),
    "VECTOR_SEARCH_TOP_K": int(os.environ.get("VECTOR_SEARCH_TOP_K", "5")),
    "VECTOR_SIMILARITY_THRESHOLD": float(
        os.environ.get("VECTOR_SIMILARITY_THRESHOLD", "0.7")
    ),
}

COPILOT_LLM_CONFIG = {
    "PROVIDER": os.environ.get("COPILOT_LLM_PROVIDER", "ollama").strip().lower(),
    "API_KEY": os.environ.get("COPILOT_LLM_API_KEY", "ollama"),
    "BASE_URL": os.environ.get(
        "COPILOT_LLM_BASE_URL", "http://host.docker.internal:11434/v1"
    ).strip(),
    "MODEL": os.environ.get("COPILOT_LLM_MODEL", "qwen3:4b").strip(),
    "TEMPERATURE": float(os.environ.get("COPILOT_LLM_TEMPERATURE", "0.2")),
    "MAX_TOKENS": int(os.environ.get("COPILOT_LLM_MAX_TOKENS", "256")),
    "TIMEOUT": int(os.environ.get("COPILOT_LLM_TIMEOUT", "180")),
    "MAX_RETRIES": int(os.environ.get("COPILOT_LLM_MAX_RETRIES", "1")),
    "BASE_BACKOFF": float(os.environ.get("COPILOT_LLM_BASE_BACKOFF", "1.0")),
    "MAX_BACKOFF": float(os.environ.get("COPILOT_LLM_MAX_BACKOFF", "30.0")),
}
