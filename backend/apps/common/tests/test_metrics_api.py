from rest_framework.test import APIClient

from apps.common.metrics import metrics


def setup_function():
    metrics.reset()


def teardown_function():
    metrics.reset()


def test_metrics_endpoint_requires_authentication():
    response = APIClient().get("/api/v1/metrics/")

    assert response.status_code in (401, 403)


def test_metrics_endpoint_returns_snapshot_for_authenticated_user(
    db,
    django_user_model,
):
    user = django_user_model.objects.create_user(
        email="metrics@example.com",
        password="password123",
    )

    client = APIClient()
    client.force_authenticate(user=user)

    metrics.record_http_request(
        method="GET",
        route="/api/v1/health/",
        status_code=200,
        duration_ms=12.5,
    )
    metrics.record_celery_task(
        task_name="demo.task",
        outcome="success",
        duration_ms=25.4,
    )
    metrics.record_celery_retry("demo.task")

    response = client.get("/api/v1/metrics/")

    assert response.status_code == 200
    assert response.data["http_requests_total"] == {
        "GET|/api/v1/health/|2xx": 1,
    }
    assert response.data["celery_tasks_total"] == {
        "demo.task|success": 1,
    }
    assert response.data["celery_task_retries_total"] == {
        "demo.task": 1,
    }
