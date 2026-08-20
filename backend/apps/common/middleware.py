import logging
import time
from contextlib import ExitStack
from typing import Any, Callable

from django.db import connection
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

SLOW_QUERY_THRESHOLD_MS = 100.0


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
    Attach request correlation context, collect request/database metrics,
    log API requests, and return the request ID to API clients.
    """

    def _close_db_query_stack(self, request: HttpRequest) -> None:
        """
        Close the per-request database instrumentation context exactly once.
        """
        db_query_stack = getattr(request, "db_query_stack", None)

        if db_query_stack is not None:
            db_query_stack.close()
            request.db_query_stack = None  # type: ignore[attr-defined]

    def _get_metrics_route(self, request: HttpRequest) -> str:
        """
        Return a low-cardinality route identifier.

        Django's resolver_match may not be available during process_request(),
        so the request path is used as a safe fallback.
        """
        resolver_match = getattr(request, "resolver_match", None)

        if resolver_match is not None:
            route = getattr(resolver_match, "route", None)

            if route:
                return str(route)

        return request.path or "unknown"

    def process_request(self, request: HttpRequest) -> None:
        request_id = normalize_request_id(request.headers.get("X-Request-ID"))

        request.request_id = request_id  # type: ignore[attr-defined]
        request.start_time = time.perf_counter()  # type: ignore[attr-defined]

        request.db_query_stack = ExitStack()  # type: ignore[attr-defined]
        request.db_query_count = 0  # type: ignore[attr-defined]
        request.db_query_duration_ms = 0.0  # type: ignore[attr-defined]
        request.db_slow_query_count = 0  # type: ignore[attr-defined]

        request.metrics_route = self._get_metrics_route(request)  # type: ignore[attr-defined]

        set_request_context(request_id)

        def execute_wrapper(
            execute: Callable[..., Any],
            sql: str,
            params: Any,
            many: bool,
            context: dict[str, Any],
        ) -> Any:
            start = time.perf_counter()

            try:
                return execute(sql, params, many, context)
            finally:
                duration_ms = (time.perf_counter() - start) * 1000.0
                slow = duration_ms >= SLOW_QUERY_THRESHOLD_MS

                request.db_query_count += 1  # type: ignore[attr-defined]
                request.db_query_duration_ms += duration_ms  # type: ignore[attr-defined]

                if slow:
                    request.db_slow_query_count += 1  # type: ignore[attr-defined]

                metrics.record_db_query(
                    route=getattr(request, "metrics_route", request.path),
                    duration_ms=duration_ms,
                    slow=slow,
                )

        request.db_query_stack.enter_context(  # type: ignore[attr-defined]
            connection.execute_wrapper(execute_wrapper)
        )

    def process_response(
        self,
        request: HttpRequest,
        response: HttpResponse,
    ) -> HttpResponse:
        if not hasattr(request, "start_time"):
            return response

        duration_ms = int(
            (time.perf_counter() - request.start_time) * 1000  # type: ignore[attr-defined]
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
            route = self._get_metrics_route(request)

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
                    "db_query_count": getattr(request, "db_query_count", 0),
                    "db_query_duration_ms": round(
                        getattr(request, "db_query_duration_ms", 0.0),
                        2,
                    ),
                    "db_slow_query_count": getattr(
                        request,
                        "db_slow_query_count",
                        0,
                    ),
                },
            )

        request_id = getattr(request, "request_id", "")

        if request_id:
            response["X-Request-ID"] = request_id

        self._close_db_query_stack(request)
        clear_request_context()

        return response

    def process_exception(
        self,
        request: HttpRequest,
        exception: Exception,
    ) -> None:
        """
        Close request-scoped DB instrumentation.

        Django will subsequently run process_response(), which is also safe
        because the ExitStack is set to None after being closed.
        """
        self._close_db_query_stack(request)

        # Preserve the correlation context during Django's exception handling.
        # process_response() performs the final request cleanup.
        return None
