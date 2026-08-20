from django.urls import path

from .views import DashboardAnalyticsView

app_name = "monitoring"

urlpatterns = [
    path(
        "dashboard/",
        DashboardAnalyticsView.as_view(),
        name="dashboard-analytics",
    ),
]
