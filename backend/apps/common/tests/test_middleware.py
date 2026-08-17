import pytest
from django.http import JsonResponse
from django.test import RequestFactory

from apps.common.middleware import RequestLogMiddleware


@pytest.mark.django_db
def test_request_id_is_returned_in_response():
    factory = RequestFactory()
    request = factory.get(
        "/api/v1/health/",
        HTTP_X_REQUEST_ID="req-sprint-11",
    )

    middleware = RequestLogMiddleware(lambda request: JsonResponse({"ok": True}))
    response = middleware(request)

    assert response["X-Request-ID"] == "req-sprint-11"
