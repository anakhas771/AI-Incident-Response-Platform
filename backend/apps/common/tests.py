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
