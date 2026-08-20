from apps.common.metrics import metrics


def setup_function():
    metrics.reset()


def teardown_function():
    metrics.reset()


def test_http_request_metrics_are_recorded():
    metrics.record_http_request(
        method="GET",
        route="/api/v1/health/",
        status_code=200,
        duration_ms=12.5,
    )

    snapshot = metrics.get_snapshot()

    assert snapshot["http_requests_total"] == {
        "GET|/api/v1/health/|2xx": 1,
    }
    assert snapshot["http_request_duration_ms"]["/api/v1/health/"] == {
        "count": 1,
        "total_ms": 12.5,
        "min_ms": 12.5,
        "max_ms": 12.5,
        "avg_ms": 12.5,
    }


def test_http_status_class_is_low_cardinality():
    metrics.record_http_request(
        method="POST",
        route="/api/v1/test/",
        status_code=503,
        duration_ms=42.0,
    )

    snapshot = metrics.get_snapshot()

    assert snapshot["http_requests_total"] == {
        "POST|/api/v1/test/|5xx": 1,
    }


def test_celery_success_metrics_are_recorded():
    metrics.record_celery_task(
        task_name="demo.task",
        outcome="success",
        duration_ms=25.4,
    )

    snapshot = metrics.get_snapshot()

    assert snapshot["celery_tasks_total"] == {
        "demo.task|success": 1,
    }
    assert snapshot["celery_task_duration_ms"]["demo.task"] == {
        "count": 1,
        "total_ms": 25.4,
        "min_ms": 25.4,
        "max_ms": 25.4,
        "avg_ms": 25.4,
    }


def test_http_durations_are_aggregated():
    metrics.record_http_request(
        method="GET",
        route="/api/v1/health/",
        status_code=200,
        duration_ms=10.0,
    )
    metrics.record_http_request(
        method="GET",
        route="/api/v1/health/",
        status_code=200,
        duration_ms=30.0,
    )

    snapshot = metrics.get_snapshot()

    assert snapshot["http_request_duration_ms"]["/api/v1/health/"] == {
        "count": 2,
        "total_ms": 40.0,
        "min_ms": 10.0,
        "max_ms": 30.0,
        "avg_ms": 20.0,
    }


def test_celery_durations_are_aggregated():
    metrics.record_celery_task(
        task_name="demo.task",
        outcome="success",
        duration_ms=20.0,
    )
    metrics.record_celery_task(
        task_name="demo.task",
        outcome="success",
        duration_ms=40.0,
    )

    snapshot = metrics.get_snapshot()

    assert snapshot["celery_task_duration_ms"]["demo.task"] == {
        "count": 2,
        "total_ms": 60.0,
        "min_ms": 20.0,
        "max_ms": 40.0,
        "avg_ms": 30.0,
    }


def test_celery_failure_metrics_are_recorded():
    metrics.record_celery_task(
        task_name="demo.task",
        outcome="failed",
        duration_ms=80.1,
    )

    snapshot = metrics.get_snapshot()

    assert snapshot["celery_tasks_total"] == {
        "demo.task|failed": 1,
    }


def test_celery_retry_metrics_are_recorded():
    metrics.record_celery_retry("demo.task")
    metrics.record_celery_retry("demo.task")

    snapshot = metrics.get_snapshot()

    assert snapshot["celery_task_retries_total"] == {
        "demo.task": 2,
    }


def test_db_query_metrics_are_recorded():
    metrics.record_db_query(
        route="/api/v1/incidents/",
        duration_ms=15.0,
    )
    metrics.record_db_query(
        route="/api/v1/incidents/",
        duration_ms=125.0,
        slow=True,
    )

    snapshot = metrics.get_snapshot()

    assert snapshot["db_queries_total"] == {
        "/api/v1/incidents/": 2,
    }

    assert snapshot["db_slow_queries_total"] == {
        "/api/v1/incidents/": 1,
    }

    assert snapshot["db_query_duration_ms"]["/api/v1/incidents/"] == {
        "count": 2,
        "total_ms": 140.0,
        "min_ms": 15.0,
        "max_ms": 125.0,
        "avg_ms": 70.0,
    }
