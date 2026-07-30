"""
URL routing for AI Engine REST API endpoints.
"""

from django.urls import path

from apps.ai_engine.api.views import (
    IncidentAnalysisRetrieveView,
    IncidentAnalyzeDetailView,
    IncidentAnalyzeView,
    RecommendationView,
    SeverityPredictView,
)

urlpatterns = [
    path("analyze/", IncidentAnalyzeView.as_view(), name="analyze"),
    path(
        "analyze/<str:incident_id>/",
        IncidentAnalyzeDetailView.as_view(),
        name="analyze-detail",
    ),
    path(
        "analysis/<str:incident_id>/",
        IncidentAnalysisRetrieveView.as_view(),
        name="analysis-detail",
    ),
    path("predict-severity/", SeverityPredictView.as_view(), name="predict-severity"),
    path("recommendations/", RecommendationView.as_view(), name="recommendations"),
]
