from django.urls import path

from .views import HealthCheckView, LivenessCheckView, ReadinessCheckView

urlpatterns = [
    path("health/", HealthCheckView.as_view(), name="health-check"),
    path("live/", LivenessCheckView.as_view(), name="liveness-check"),
    path("ready/", ReadinessCheckView.as_view(), name="readiness-check"),
]
