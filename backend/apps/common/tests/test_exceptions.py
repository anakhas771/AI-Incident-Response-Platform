import logging

import pytest
from rest_framework.exceptions import NotFound
from rest_framework.test import APIRequestFactory

from apps.common.correlation import set_request_context
from apps.common.exceptions import custom_exception_handler


@pytest.mark.django_db
def test_handled_exception_preserves_error_contract_and_logs_context(caplog):
    factory = APIRequestFactory()
    request = factory.get("/api/v1/test/")
    request_id = "sprint-11-exception-test"

    set_request_context(
        request_id,
        user_id="user-123",
        org_id="org-456",
    )

    try:
        with caplog.at_level(logging.WARNING):
            response = custom_exception_handler(
                NotFound("Resource not found"),
                {"request": request},
            )

        assert response is not None
        assert response.status_code == 404
        assert response.data["detail"] == "Resource not found"

        record = caplog.records[-1]
        assert record.exception_type == "NotFound"
        assert record.status_code == 404
        assert record.method == "GET"
        assert record.path == "/api/v1/test/"
        assert record.request_id == request_id
        assert record.user_id == "user-123"
        assert record.org_id == "org-456"
    finally:
        from apps.common.correlation import clear_request_context

        clear_request_context()


def test_unhandled_exception_returns_500_and_logs_exception(caplog):
    factory = APIRequestFactory()
    request = factory.post("/api/v1/test/")

    exc = RuntimeError("database exploded")

    with caplog.at_level(logging.ERROR):
        response = custom_exception_handler(
            exc,
            {"request": request},
        )

    assert response.status_code == 500
    assert response.data["error"]["code"] == "INTERNAL_SERVER_ERROR"
    assert response.data["error"]["details"] is None

    record = caplog.records[-1]
    assert record.exception_type == "RuntimeError"
    assert record.status_code == 500
    assert record.method == "POST"
    assert record.path == "/api/v1/test/"
