from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import connection
from django.core.cache import cache
from drf_spectacular.utils import extend_schema


class HealthCheckView(APIView):
    """
    Production health check view verifying Database, Cache (Redis), and System operational readiness.
    """

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
