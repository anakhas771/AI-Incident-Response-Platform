from unittest.mock import patch

from django.test import TestCase
from django.urls import reverse
from rest_framework import status


class HealthCheckViewTest(TestCase):
    """
    Test suite for the System Health Check endpoint.
    """

    def test_health_check_endpoint(self):
        url = reverse("health-check")
        response = self.client.get(url)
        # In test env with dummy/sqlite/in-memory, health status response is returned
        self.assertIn(
            response.status_code,
            [status.HTTP_200_OK, status.HTTP_503_SERVICE_UNAVAILABLE],
        )
        self.assertIn("status", response.data)
        self.assertIn("database", response.data)
        self.assertIn("redis", response.data)


class OpenAPIDocumentationTest(TestCase):
    """
    Test suite for OpenAPI 3 schema generation, Swagger UI, and Redoc endpoints.
    """

    def test_openapi_schema_endpoint(self):
        url = reverse("schema")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        content = response.content.decode("utf-8")
        self.assertIn("openapi", content.lower())

    def test_swagger_ui_endpoint(self):
        url = reverse("swagger-ui")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        content = response.content.decode("utf-8")
        self.assertIn("swagger", content.lower())

    def test_redoc_endpoint(self):
        url = reverse("redoc")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        content = response.content.decode("utf-8")
        self.assertIn("redoc", content.lower())


class LivenessCheckViewTest(TestCase):
    def test_liveness_endpoint(self):
        response = self.client.get(reverse("liveness-check"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "alive")


class ReadinessCheckViewTest(TestCase):
    def test_readiness_endpoint(self):
        response = self.client.get(reverse("readiness-check"))

        self.assertIn(
            response.status_code,
            [
                status.HTTP_200_OK,
                status.HTTP_503_SERVICE_UNAVAILABLE,
            ],
        )
        self.assertIn(response.data["status"], ["ready", "not_ready"])
        self.assertIn("database", response.data)
        self.assertIn("redis", response.data)


class ReadinessFailureTest(TestCase):
    @patch("apps.common.views.connection.cursor")
    def test_database_failure_returns_503(self, mock_cursor):
        mock_cursor.side_effect = Exception("database unavailable")

        response = self.client.get(reverse("readiness-check"))

        self.assertEqual(
            response.status_code,
            status.HTTP_503_SERVICE_UNAVAILABLE,
        )
        self.assertEqual(response.data["status"], "not_ready")
        self.assertEqual(response.data["database"], "unavailable")

    @patch("apps.common.views.cache.set")
    def test_redis_failure_returns_503(self, mock_cache_set):
        mock_cache_set.side_effect = Exception("redis unavailable")

        response = self.client.get(reverse("readiness-check"))

        self.assertEqual(
            response.status_code,
            status.HTTP_503_SERVICE_UNAVAILABLE,
        )
        self.assertEqual(response.data["status"], "not_ready")
        self.assertEqual(response.data["redis"], "unavailable")
