import os

from django.core.exceptions import ImproperlyConfigured

from .base import *

# ============================================================
# PRODUCTION CORE SETTINGS
# ============================================================

DEBUG = False
ENVIRONMENT = "production"


# ============================================================
# SECRET KEY
# ============================================================

SECRET_KEY = os.environ.get("SECRET_KEY", "").strip()

if not SECRET_KEY:
    raise ImproperlyConfigured("SECRET_KEY must be configured in production.")

if SECRET_KEY.startswith("django-insecure-"):
    raise ImproperlyConfigured(
        "Production SECRET_KEY must not use a django-insecure key."
    )

if SECRET_KEY == "your-secret-key":
    raise ImproperlyConfigured(
        "Production SECRET_KEY must not use the development placeholder."
    )


# ============================================================
# HOST / CORS CONFIGURATION
# ============================================================

ALLOWED_HOSTS = [
    host.strip()
    for host in os.environ.get("ALLOWED_HOSTS", "").split(",")
    if host.strip()
]

if not ALLOWED_HOSTS:
    raise ImproperlyConfigured("ALLOWED_HOSTS must be configured in production.")

CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get("CORS_ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
]


# ============================================================
# FRONTEND URL
# ============================================================

FRONTEND_BASE_URL = os.environ.get("FRONTEND_BASE_URL", "").rstrip("/")

if not FRONTEND_BASE_URL.startswith("https://"):
    raise ImproperlyConfigured("FRONTEND_BASE_URL must be an HTTPS URL in production.")


# ============================================================
# HTTPS / SECURITY HEADERS
# ============================================================

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

SECURE_SSL_REDIRECT = True

SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"


# ============================================================
# DRF
# ============================================================

REST_FRAMEWORK["DEFAULT_RENDERER_CLASSES"] = [
    "rest_framework.renderers.JSONRenderer",
]
