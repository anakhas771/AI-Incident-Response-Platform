import os

from .base import *

DEBUG = False
TESTING = True

PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
    }
}

# Use SQLite in-memory database when POSTGRES_HOST is not explicitly specified or is 'db'
if "POSTGRES_HOST" not in os.environ or os.environ.get("POSTGRES_HOST") == "db":
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": ":memory:",
        }
    }

CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True
