import threading
from collections import defaultdict
from typing import Any


class MetricsRegistry:
    """
    Lightweight in-process application metrics registry.

    Metrics intentionally use low-cardinality dimensions so they remain
    safe for application-level instrumentation.

    This registry is process-local. A later Prometheus/OpenTelemetry
    exporter can consume get_snapshot() without changing callers.
    """

    def __init__(self) -> None:
        self._lock = threading.Lock()

        self.http_requests_total: dict[tuple[str, str, str], int] = defaultdict(int)
        self.http_request_duration_ms: dict[str, list[float]] = defaultdict(list)

        self.celery_tasks_total: dict[tuple[str, str], int] = defaultdict(int)
        self.celery_task_duration_ms: dict[str, list[float]] = defaultdict(list)
        self.celery_task_retries_total: dict[str, int] = defaultdict(int)

    def record_http_request(
        self,
        method: str,
        route: str,
        status_code: int,
        duration_ms: float,
    ) -> None:
        status_class = f"{status_code // 100}xx"

        with self._lock:
            self.http_requests_total[(method, route, status_class)] += 1
            self.http_request_duration_ms[route].append(duration_ms)

    def record_celery_task(
        self,
        task_name: str,
        outcome: str,
        duration_ms: float | None = None,
    ) -> None:
        with self._lock:
            self.celery_tasks_total[(task_name, outcome)] += 1

            if duration_ms is not None:
                self.celery_task_duration_ms[task_name].append(duration_ms)

    def record_celery_retry(self, task_name: str) -> None:
        with self._lock:
            self.celery_task_retries_total[task_name] += 1

    def get_snapshot(self) -> dict[str, Any]:
        with self._lock:
            return {
                "http_requests_total": {
                    f"{method}|{route}|{status_class}": count
                    for (
                        method,
                        route,
                        status_class,
                    ), count in self.http_requests_total.items()
                },
                "http_request_duration_ms": {
                    route: list(values)
                    for route, values in self.http_request_duration_ms.items()
                },
                "celery_tasks_total": {
                    f"{task_name}|{outcome}": count
                    for (task_name, outcome), count in self.celery_tasks_total.items()
                },
                "celery_task_duration_ms": {
                    task_name: list(values)
                    for task_name, values in self.celery_task_duration_ms.items()
                },
                "celery_task_retries_total": dict(self.celery_task_retries_total),
            }

    def reset(self) -> None:
        with self._lock:
            self.http_requests_total.clear()
            self.http_request_duration_ms.clear()
            self.celery_tasks_total.clear()
            self.celery_task_duration_ms.clear()
            self.celery_task_retries_total.clear()


metrics = MetricsRegistry()
