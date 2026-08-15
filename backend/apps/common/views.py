from django.core.cache import cache
from django.db import connection
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class LivenessCheckView(APIView):
    """
    Lightweight liveness probe.

    This endpoint intentionally avoids external dependencies so that it can
    distinguish an alive application process from a dependency failure.
    """

    permission_classes = [AllowAny]
    throttle_classes = []

    @extend_schema(
        summary="Application Liveness Check",
        description="Returns 200 when the application process is alive.",
        responses={200: dict},
    )
    def get(self, request, *args, **kwargs):
        return Response(
            {"status": "alive"},
            status=status.HTTP_200_OK,
        )


class ReadinessCheckView(APIView):
    """
    Dependency-aware readiness probe.

    Returns 200 only when both the database and Redis are reachable.
    """

    permission_classes = [AllowAny]
    throttle_classes = []

    @extend_schema(
        summary="Application Readiness Check",
        description="Returns 200 only when PostgreSQL and Redis are available.",
        responses={
            200: dict,
            503: dict,
        },
    )
    def get(self, request, *args, **kwargs):
        database_ready = False
        redis_ready = False

        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1;")
            database_ready = True
        except Exception:
            database_ready = False

        try:
            cache.set("readiness_check_ping", "pong", 10)
            redis_ready = cache.get("readiness_check_ping") == "pong"
        except Exception:
            redis_ready = False

        ready = database_ready and redis_ready

        return Response(
            {
                "status": "ready" if ready else "not_ready",
                "database": "connected" if database_ready else "unavailable",
                "redis": "connected" if redis_ready else "unavailable",
            },
            status=(
                status.HTTP_200_OK if ready else status.HTTP_503_SERVICE_UNAVAILABLE
            ),
        )


class HealthCheckView(APIView):
    """
    Production health check view verifying Database, Cache (Redis), and System operational readiness.
    """

    permission_classes = [AllowAny]
    throttle_classes = []

    @extend_schema(
        summary="System Health Check",
        description="Returns operational status of API, Database, and Redis Cache.",
        responses={200: dict},
    )
    def get(self, request, *args, **kwargs):
        health_status = {
            "status": "healthy",
            "database": "unknown",
            "redis": "unknown",
        }

        # Check Database
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1;")
            health_status["database"] = "connected"
        except Exception as e:
            health_status["database"] = f"unhealthy: {str(e)}"
            health_status["status"] = "unhealthy"

        # Check Redis Cache
        try:
            cache.set("health_check_ping", "pong", 10)
            if cache.get("health_check_ping") == "pong":
                health_status["redis"] = "connected"
            else:
                health_status["redis"] = "unhealthy"
                health_status["status"] = "unhealthy"
        except Exception as e:
            health_status["redis"] = f"unhealthy: {str(e)}"
            health_status["status"] = "unhealthy"

        http_status = (
            status.HTTP_200_OK
            if health_status["status"] == "healthy"
            else status.HTTP_503_SERVICE_UNAVAILABLE
        )

        return Response(health_status, status=http_status)
