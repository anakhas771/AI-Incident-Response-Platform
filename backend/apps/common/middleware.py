import logging
import time

from django.http import HttpRequest, HttpResponse
from django.utils.deprecation import MiddlewareMixin

from .correlation import (
    clear_request_context,
    get_current_org_id,
    get_current_request_id,
    get_current_user_id,
    normalize_request_id,
    set_request_context,
)
from .metrics import metrics

logger = logging.getLogger(__name__)


class RequestContextFilter(logging.Filter):
    """
    Inject request correlation context into log records.
    """

    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = get_current_request_id()
        record.user_id = get_current_user_id()
        record.org_id = get_current_org_id()
        return True


class RequestLogMiddleware(MiddlewareMixin):
    """
    Attach request correlation context, log API requests, and return
    the request ID to API clients.
    """

    def process_request(self, request: HttpRequest) -> None:
        request_id = normalize_request_id(request.headers.get("X-Request-ID"))
        request.request_id = request_id  # type: ignore[attr-defined]
        request.start_time = time.time()  # type: ignore[attr-defined]

        set_request_context(request_id)

    def process_response(
        self, request: HttpRequest, response: HttpResponse
    ) -> HttpResponse:
        if not hasattr(request, "start_time"):
            return response

        duration_ms = int(
            (time.time() - request.start_time) * 1000  # type: ignore[attr-defined]
        )

        user_id = ""
        org_id = ""

        if hasattr(request, "user") and request.user.is_authenticated:
            user_id = str(request.user.id)

            if getattr(request.user, "organization_id", None):
                org_id = str(request.user.organization_id)

        set_request_context(
            request_id=getattr(request, "request_id", ""),
            user_id=user_id,
            org_id=org_id,
        )

        if request.path.startswith("/api/"):
            route = "unknown"
            resolver_match = getattr(request, "resolver_match", None)

            if resolver_match is not None:
                route = getattr(resolver_match, "route", None) or "unknown"

            metrics.record_http_request(
                method=request.method or "",
                route=route,
                status_code=response.status_code,
                duration_ms=duration_ms,
            )

            logger.info(
                "Completed request",
                extra={
                    "method": request.method,
                    "path": request.path,
                    "status_code": response.status_code,
                    "duration_ms": duration_ms,
                },
            )

        request_id = getattr(request, "request_id", "")
        if request_id:
            response["X-Request-ID"] = request_id

        clear_request_context()
        return response

    def process_exception(self, request: HttpRequest, exception: Exception) -> None:
        # Preserve the correlation context during Django's exception
        # handling. process_response() performs the final cleanup.
        return None
