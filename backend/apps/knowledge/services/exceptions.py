"""
Enterprise exception hierarchy and error code definitions for Copilot services.
"""

from enum import Enum


class ErrorCode(str, Enum):
    """
    Standardized enterprise error codes for Copilot domain operations.
    """

    LLM_TIMEOUT = "LLM_TIMEOUT"
    LLM_RATE_LIMIT = "LLM_RATE_LIMIT"
    LLM_ERROR = "LLM_ERROR"
    PROMPT_TOO_LONG = "PROMPT_TOO_LONG"
    SESSION_ARCHIVED = "SESSION_ARCHIVED"
    SESSION_NOT_FOUND = "SESSION_NOT_FOUND"
    RETRIEVAL_FAILED = "RETRIEVAL_FAILED"
    VECTOR_DB_ERROR = "VECTOR_DB_ERROR"
    STREAM_INTERRUPTED = "STREAM_INTERRUPTED"
    VALIDATION_ERROR = "VALIDATION_ERROR"
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR"


class CopilotException(Exception):
    """
    Base exception for Enterprise AI Copilot domain operations.
    """

    def __init__(
        self,
        message: str,
        code: str = ErrorCode.INTERNAL_SERVER_ERROR.value,
        status_code: int = 500,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code

    def to_dict(self) -> dict[str, str]:
        """
        Serialize error details safely for API responses or SSE error events without exposing stack traces.
        """
        return {
            "error": self.message,
            "code": self.code,
        }


class LLMException(CopilotException):
    """
    Raised when an LLM provider fails or retries are exhausted.
    """

    def __init__(
        self,
        message: str,
        code: str = ErrorCode.LLM_ERROR.value,
        status_code: int = 503,
    ) -> None:
        super().__init__(message=message, code=code, status_code=status_code)


class StreamingException(CopilotException):
    """
    Raised when Server-Sent Events (SSE) streaming is interrupted or fails.
    """

    def __init__(
        self,
        message: str,
        code: str = ErrorCode.STREAM_INTERRUPTED.value,
        status_code: int = 500,
    ) -> None:
        super().__init__(message=message, code=code, status_code=status_code)


class RetrievalException(CopilotException):
    """
    Raised when vector similarity search or keyword retrieval fails.
    """

    def __init__(
        self,
        message: str,
        code: str = ErrorCode.RETRIEVAL_FAILED.value,
        status_code: int = 500,
    ) -> None:
        super().__init__(message=message, code=code, status_code=status_code)


class ValidationException(CopilotException):
    """
    Raised when request validation, session checks, or prompt constraints fail.
    """

    def __init__(
        self,
        message: str,
        code: str = ErrorCode.VALIDATION_ERROR.value,
        status_code: int = 400,
    ) -> None:
        super().__init__(message=message, code=code, status_code=status_code)
