import logging
from typing import Any

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler

from apps.common.correlation import (
    get_current_org_id,
    get_current_request_id,
    get_current_user_id,
)

logger = logging.getLogger(__name__)


def custom_exception_handler(
    exc: Exception,
    context: dict[str, Any],
) -> Response:
    """
    Preserve DRF's existing error response while adding
    correlation-aware structured exception telemetry.
    """
    response = exception_handler(exc, context)

    request = context.get("request")
    method = getattr(request, "method", "")
    path = getattr(request, "path", "")

    telemetry = {
        "exception_type": exc.__class__.__name__,
        "method": method,
        "path": path,
        "request_id": get_current_request_id(),
        "user_id": get_current_user_id(),
        "org_id": get_current_org_id(),
    }

    if response is not None:
        telemetry["status_code"] = response.status_code

        logger.warning(
            "API exception handled",
            extra=telemetry,
        )

        return response

    telemetry["status_code"] = status.HTTP_500_INTERNAL_SERVER_ERROR

    logger.exception(
        "Unhandled API exception",
        extra=telemetry,
    )

    return Response(
        {
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected server error occurred.",
                "details": None,
            }
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
