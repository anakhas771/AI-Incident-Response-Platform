import threading
from collections import defaultdict
from typing import Any


class MetricsRegistry:
    """
    Lightweight process-local application metrics registry.

    Duration metrics are stored as bounded aggregates rather than retaining
    every individual observation.
    """

    def __init__(self) -> None:
        self._lock = threading.Lock()

        self.http_requests_total: dict[tuple[str, str, str], int] = defaultdict(int)
        self.http_request_duration: dict[str, dict[str, float | int]] = {}

        self.celery_tasks_total: dict[tuple[str, str], int] = defaultdict(int)
        self.celery_task_duration: dict[str, dict[str, float | int]] = {}
        self.celery_task_retries_total: dict[str, int] = defaultdict(int)

        self.db_queries_total: dict[str, int] = defaultdict(int)
        self.db_query_duration: dict[str, dict[str, float | int]] = {}
        self.db_slow_queries_total: dict[str, int] = defaultdict(int)

    @staticmethod
    def _record_duration(
        registry: dict[str, dict[str, float | int]],
        key: str,
        duration_ms: float,
    ) -> None:
        metric = registry.setdefault(
            key,
            {
                "count": 0,
                "total_ms": 0.0,
                "min_ms": duration_ms,
                "max_ms": duration_ms,
            },
        )

        metric["count"] = int(metric["count"]) + 1
        metric["total_ms"] = float(metric["total_ms"]) + duration_ms
        metric["min_ms"] = min(float(metric["min_ms"]), duration_ms)
        metric["max_ms"] = max(float(metric["max_ms"]), duration_ms)

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
            self._record_duration(
                self.http_request_duration,
                route,
                duration_ms,
            )

    def record_celery_task(
        self,
        task_name: str,
        outcome: str,
        duration_ms: float | None = None,
    ) -> None:
        with self._lock:
            self.celery_tasks_total[(task_name, outcome)] += 1

            if duration_ms is not None:
                self._record_duration(
                    self.celery_task_duration,
                    task_name,
                    duration_ms,
                )

    def record_celery_retry(self, task_name: str) -> None:
        with self._lock:
            self.celery_task_retries_total[task_name] += 1

    def record_db_query(
        self,
        route: str,
        duration_ms: float,
        slow: bool = False,
    ) -> None:
        with self._lock:
            self.db_queries_total[route] += 1

            self._record_duration(
                self.db_query_duration,
                route,
                duration_ms,
            )

            if slow:
                self.db_slow_queries_total[route] += 1

    @staticmethod
    def _with_average(
        metrics: dict[str, dict[str, float | int]],
    ) -> dict[str, dict[str, float | int]]:
        result: dict[str, dict[str, float | int]] = {}

        for key, metric in metrics.items():
            count = int(metric["count"])
            total_ms = float(metric["total_ms"])

            result[key] = {
                "count": count,
                "total_ms": round(total_ms, 2),
                "min_ms": round(float(metric["min_ms"]), 2),
                "max_ms": round(float(metric["max_ms"]), 2),
                "avg_ms": round(total_ms / count, 2) if count else 0.0,
            }

        return result

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
                "http_request_duration_ms": self._with_average(
                    self.http_request_duration,
                ),
                "celery_tasks_total": {
                    f"{task_name}|{outcome}": count
                    for (task_name, outcome), count in self.celery_tasks_total.items()
                },
                "celery_task_duration_ms": self._with_average(
                    self.celery_task_duration,
                ),
                "celery_task_retries_total": dict(self.celery_task_retries_total),
                "db_queries_total": dict(self.db_queries_total),
                "db_query_duration_ms": self._with_average(self.db_query_duration),
                "db_slow_queries_total": dict(self.db_slow_queries_total),
            }

    def reset(self) -> None:
        with self._lock:
            self.http_requests_total.clear()
            self.http_request_duration.clear()
            self.celery_tasks_total.clear()
            self.celery_task_duration.clear()
            self.celery_task_retries_total.clear()
            self.db_queries_total.clear()
            self.db_query_duration.clear()
            self.db_slow_queries_total.clear()


metrics = MetricsRegistry()
