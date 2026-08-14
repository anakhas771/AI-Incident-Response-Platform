import logging
import threading
import time
import uuid

from django.http import HttpRequest, HttpResponse
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger(__name__)

# Thread-local storage for request context


_thread_locals = threading.local()


def get_current_request_id() -> str:
    return getattr(_thread_locals, "request_id", "")


def get_current_user_id() -> str:
    return getattr(_thread_locals, "user_id", "")


def get_current_org_id() -> str:
    return getattr(_thread_locals, "org_id", "")


class RequestContextFilter(logging.Filter):
    """
    Injects request_id, user_id, and org_id into log records.
    """

    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = get_current_request_id()
        record.user_id = get_current_user_id()
        record.org_id = get_current_org_id()
        return True


class RequestLogMiddleware(MiddlewareMixin):
    """
    Middleware to log requests, durations, and status codes.
    Injects request context into thread locals for structured logging.
    """

    def process_request(self, request: HttpRequest) -> None:
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request.request_id = request_id  # type: ignore
        request.start_time = time.time()  # type: ignore

        _thread_locals.request_id = request_id
        _thread_locals.user_id = ""
        _thread_locals.org_id = ""

    def process_response(
        self, request: HttpRequest, response: HttpResponse
    ) -> HttpResponse:
        if not hasattr(request, "start_time"):
            return response

        duration = time.time() - request.start_time  # type: ignore
        duration_ms = int(duration * 1000)

        user_id = ""
        org_id = ""
        if hasattr(request, "user") and request.user.is_authenticated:
            user_id = str(request.user.id)
            if (
                hasattr(request.user, "organization_id")
                and request.user.organization_id
            ):
                org_id = str(request.user.organization_id)

        _thread_locals.user_id = user_id
        _thread_locals.org_id = org_id

        # Skip logging for health checks or static files if desired, but we log all API requests
        if request.path.startswith("/api/"):
            logger.info(
                "Completed request",
                extra={
                    "method": request.method,
                    "path": request.path,
                    "status_code": response.status_code,
                    "duration_ms": duration_ms,
                },
            )

        # Clean up thread locals
        _thread_locals.request_id = ""
        _thread_locals.user_id = ""
        _thread_locals.org_id = ""

        return response

    def process_exception(self, request: HttpRequest, exception: Exception) -> None:
        _thread_locals.request_id = ""
        _thread_locals.user_id = ""
        _thread_locals.org_id = ""
