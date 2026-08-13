import os

from .base import *

DEBUG = False
TESTING = True

SECRET_KEY = "test-only-secret-key-for-ai-incident-response-platform-2026"

SIMPLE_JWT = {
    **SIMPLE_JWT,
    "SIGNING_KEY": SECRET_KEY,
}

PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
    }
}

# Use PostgreSQL when running inside Docker.
# Fall back to in-memory SQLite only when PostgreSQL is unavailable.
if not os.environ.get("POSTGRES_HOST"):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": ":memory:",
        }
    }

CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True
