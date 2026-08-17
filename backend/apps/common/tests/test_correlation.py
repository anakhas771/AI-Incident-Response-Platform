import uuid

from apps.common.correlation import (
    clear_request_context,
    get_current_request_id,
    normalize_request_id,
    set_request_context,
)


def test_normalize_request_id_preserves_safe_value():
    value = "req-12345"
    assert normalize_request_id(value) == value


def test_normalize_request_id_rejects_unsafe_value():
    value = "req\r\nSet-Cookie: injected=true"
    result = normalize_request_id(value)

    assert result != value
    uuid.UUID(result)


def test_request_context_round_trip():
    set_request_context("req-123", "user-1", "org-1")

    assert get_current_request_id() == "req-123"

    clear_request_context()

    assert get_current_request_id() == ""
