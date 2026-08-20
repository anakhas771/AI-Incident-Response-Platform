from __future__ import annotations

from datetime import timedelta
from typing import Any, cast

from django.db.models import Count, Q
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User
from apps.incidents.models import Category, Incident, Severity


class DashboardAnalyticsView(APIView):
    """
    Organization-scoped operational analytics.

    Analytics are calculated directly from the Incident queryset so they are
    independent of the paginated /incidents/ endpoint.
    """

    permission_classes = [IsAuthenticated]

    VALID_TIMEFRAMES = {
        "24h": timedelta(hours=24),
        "7d": timedelta(days=7),
        "30d": timedelta(days=30),
    }

    def get(self, request: Request) -> Response:
        user = cast(User, request.user)

        if not getattr(user, "organization", None):
            return Response(
                {
                    "detail": "User does not belong to an organization.",
                },
                status=403,
            )

        timeframe = request.query_params.get("timeframe", "24h")
        if timeframe not in self.VALID_TIMEFRAMES:
            return Response(
                {
                    "detail": "Invalid timeframe. Use 24h, 7d, or 30d.",
                },
                status=400,
            )

        now = timezone.now()
        period_start = now - self.VALID_TIMEFRAMES[timeframe]

        organization_incidents = Incident.objects.filter(organization=user.organization)

        period_incidents = organization_incidents.filter(
            created_at__gte=period_start,
            created_at__lte=now,
        )

        completed_incidents = organization_incidents.filter(
            Q(resolved_at__isnull=False) | Q(closed_at__isnull=False),
            created_at__gte=period_start,
            created_at__lte=now,
        )

        open_incidents = organization_incidents.exclude(
            status__in=["RESOLVED", "CLOSED"]
        )

        resolved_incidents = organization_incidents.filter(
            status__in=["RESOLVED", "CLOSED"]
        )

        # MTTR must use actual completion timestamps.
        resolved_durations = []

        for incident in completed_incidents.only(
            "created_at", "resolved_at", "closed_at"
        ):
            completed_at = incident.resolved_at or incident.closed_at
            if not completed_at:
                continue

            duration_minutes = (completed_at - incident.created_at).total_seconds() / 60

            if duration_minutes > 0:
                resolved_durations.append(duration_minutes)

        mttr_minutes = (
            round(sum(resolved_durations) / len(resolved_durations), 1)
            if resolved_durations
            else None
        )

        severity_counts = period_incidents.values("severity").annotate(
            count=Count("id")
        )

        severity_map = {item["severity"]: item["count"] for item in severity_counts}

        severity_colors = {
            Severity.CRITICAL.value: "#ef4444",
            Severity.HIGH.value: "#f97316",
            Severity.MEDIUM.value: "#eab308",
            Severity.LOW.value: "#3b82f6",
        }
        category_colors = {
            Category.INFRASTRUCTURE.value: "#22d3ee",
            Category.SECURITY.value: "#6366f1",
            Category.APPLICATION.value: "#f59e0b",
            Category.DATABASE.value: "#a855f7",
            Category.NETWORK.value: "#f97316",
            Category.OTHER.value: "#71717a",
        }

        severity_distribution = [
            {
                "name": severity,
                "value": severity_map.get(severity, 0),
                "fill": severity_colors[severity],
            }
            for severity in Severity.values
        ]

        # Time-series data for the selected period.
        bucket_count = {
            "24h": 24,
            "7d": 7,
            "30d": 30,
        }[timeframe]

        bucket_size = timedelta(hours=1) if timeframe == "24h" else timedelta(days=1)

        trends: list[dict[str, Any]] = []

        for index in range(bucket_count):
            bucket_start = period_start + (bucket_size * index)
            bucket_end = bucket_start + bucket_size

            bucket_qs = period_incidents.filter(
                created_at__gte=bucket_start,
                created_at__lt=bucket_end,
            )

            counts = bucket_qs.values("severity").annotate(count=Count("id"))
            count_map = {item["severity"]: item["count"] for item in counts}

            if timeframe == "24h":
                timestamp = timezone.localtime(bucket_start).strftime("%I:%M %p")
            else:
                timestamp = timezone.localtime(bucket_start).strftime("%b %d")

            trends.append(
                {
                    "timestamp": timestamp,
                    "critical": count_map.get(Severity.CRITICAL, 0),
                    "high": count_map.get(Severity.HIGH, 0),
                    "medium": count_map.get(Severity.MEDIUM, 0),
                    "low": count_map.get(Severity.LOW, 0),
                }
            )
            category_counts = period_incidents.values("category").annotate(
                count=Count("id")
            )

            category_map = {item["category"]: item["count"] for item in category_counts}

            category_distribution = [
                {
                    "name": category,
                    "value": category_map.get(category, 0),
                    "fill": category_colors[category],
                }
                for category in Category.values
                if category_map.get(category, 0) > 0
            ]

        # Return a small recent list for the UI only.
        recent_incidents: list[dict[str, Any]] = [
            {
                "id": str(row["id"]),
                "title": row["title"],
                "severity": row["severity"],
                "status": row["status"],
                "category": row["category"],
                "created_at": row["created_at"].isoformat(),
                "updated_at": row["updated_at"].isoformat(),
            }
            for row in organization_incidents.order_by("-created_at")[:6].values(
                "id",
                "title",
                "severity",
                "status",
                "category",
                "created_at",
                "updated_at",
            )
        ]
        return Response(
            {
                "kpis": {
                    "incidentCount": period_incidents.count(),
                    "openIncidents": open_incidents.filter(
                        created_at__gte=period_start,
                        created_at__lte=now,
                    ).count(),
                    "resolvedIncidents": resolved_incidents.filter(
                        created_at__gte=period_start,
                        created_at__lte=now,
                    ).count(),
                    "mttrMinutes": mttr_minutes,
                    "mttrTrendPct": 0,
                    "mttdMinutes": None,
                    "mttdTrendPct": None,
                    "slaCompliancePct": None,
                    "slaTrendPct": None,
                },
                "recentIncidents": recent_incidents,
                "recentAiActivity": [],
                "severityDistribution": severity_distribution,
                "categoryDistribution": category_distribution,
                "incidentTrends": trends,
                "systemHealth": None,
            }
        )
