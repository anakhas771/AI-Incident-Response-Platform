import re
import threading
from typing import Any

_REQUEST_ID_PATTERN = re.compile(r"^[A-Za-z0-9._:-]{1,128}$")
_thread_locals = threading.local()


def normalize_request_id(value: Any) -> str:
    """Return a safe request ID or generate one when the supplied value is invalid."""
    import uuid

    request_id = str(value or "").strip()

    if request_id and _REQUEST_ID_PATTERN.fullmatch(request_id):
        return request_id

    return str(uuid.uuid4())


def get_current_request_id() -> str:
    return getattr(_thread_locals, "request_id", "")


def get_current_user_id() -> str:
    return getattr(_thread_locals, "user_id", "")


def get_current_org_id() -> str:
    return getattr(_thread_locals, "org_id", "")


def set_request_context(
    request_id: str,
    user_id: str = "",
    org_id: str = "",
) -> None:
    _thread_locals.request_id = request_id
    _thread_locals.user_id = user_id
    _thread_locals.org_id = org_id


def clear_request_context() -> None:
    _thread_locals.request_id = ""
    _thread_locals.user_id = ""
    _thread_locals.org_id = ""
