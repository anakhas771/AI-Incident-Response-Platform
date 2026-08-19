"""
REST API Views for AI Engine analysis, severity prediction, and recommendation services.
"""

import logging
from typing import Any, cast

from django.db import transaction
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.ai_engine.api.serializers import (
    AIIncidentAnalysisSerializer,
    IncidentAIAnalyzeTriggerSerializer,
    IncidentAnalysisSerializer,
    IncidentAnalyzeRequestSerializer,
    IncidentAnalyzeResponseSerializer,
    RecommendationRequestSerializer,
    RecommendationResponseSerializer,
    SeverityPredictRequestSerializer,
    SeverityPredictResponseSerializer,
)
from apps.ai_engine.models import AnalysisStatus, IncidentAnalysis
from apps.ai_engine.permissions import (
    CanTriggerAIAnalysis,
    IsAIIncidentOrganizationMember,
)
from apps.ai_engine.services import (
    IncidentAnalyzer,
    RecommendationEngine,
    SeverityPredictor,
)
from apps.ai_engine.tasks import analyze_incident_task
from apps.incidents.models import Incident

logger = logging.getLogger(__name__)


class IncidentAIAnalyzeTriggerView(APIView):
    """
    POST /api/ai/incidents/<id>/analyze/
    Manually trigger asynchronous AI analysis for an incident using Celery.

    A manual trigger intentionally re-runs completed analysis so operators can
    regenerate results after evidence or retrieval-quality changes.
    """

    permission_classes = [
        IsAuthenticated,
        IsAIIncidentOrganizationMember,
        CanTriggerAIAnalysis,
    ]
    serializer_class = IncidentAIAnalyzeTriggerSerializer

    @extend_schema(
        operation_id="trigger_async_incident_ai_analysis",
        responses={202: IncidentAIAnalyzeTriggerSerializer},
        summary="Trigger asynchronous AI analysis",
        description="Dispatches analyze_incident_task to Celery without blocking.",
    )
    def post(
        self,
        request: Request,
        id: Any = None,
        incident_id: Any = None,
        *args: Any,
        **kwargs: Any,
    ) -> Response:
        target_id = id or incident_id
        incident = get_object_or_404(Incident, id=target_id)
        self.check_object_permissions(request, incident)

        try:
            with transaction.atomic():
                analysis = IncidentAnalysis.objects.filter(incident=incident).first()
                if analysis and analysis.status == AnalysisStatus.COMPLETED:
                    analysis.status = AnalysisStatus.PENDING
                    analysis.save(update_fields=["status", "updated_at"])

            analyze_incident_task.delay(str(incident.id))

            return Response(
                {
                    "message": "AI analysis triggered.",
                    "incident_id": str(incident.id),
                    "status": "pending",
                },
                status=status.HTTP_202_ACCEPTED,
            )
        except Exception as exc:
            logger.exception(
                "Failed to dispatch AI analysis task for incident_id=%s: %s",
                incident.id,
                str(exc),
            )
            return Response(
                {"error": "Failed to trigger AI analysis.", "detail": str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
