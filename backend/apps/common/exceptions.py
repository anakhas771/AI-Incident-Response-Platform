import logging

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Custom DRF Exception Handler providing standardized error response schema.
    Schema:
    {
        "error": {
            "code": "VALIDATION_ERROR",
            "message": "Human readable error description",
            "details": {...}
        }
    }
    """
    response = exception_handler(exc, context)

    if response is not None:
        custom_data = {
            "error": {
                "code": exc.__class__.__name__,
                "message": (
                    str(exc.detail)
                    if hasattr(exc, "detail") and isinstance(exc.detail, str)
                    else "An API request error occurred."
                ),
                "details": (
                    response.data
                    if isinstance(response.data, (dict, list))
                    else {"detail": str(response.data)}
                ),
            }
        }
        response.data = custom_data
    else:
        logger.error(f"Unhandled Exception: {str(exc)}", exc_info=True)
        response = Response(
            {
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "An unexpected server error occurred.",
                    "details": None,
                }
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return response
