"""
REST API Views for AI Engine analysis, severity prediction, and recommendation services.
"""

import logging
from typing import Any

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
from apps.ai_engine.permissions import IsAIIncidentOrganizationMember
from apps.ai_engine.services import (
    IncidentAnalyzer,
    RecommendationEngine,
    SeverityPredictor,
)
from apps.ai_engine.tasks import analyze_incident_task
from apps.incidents.models import Incident

logger = logging.getLogger(__name__)


class IncidentAnalyzeView(APIView):
    """
    POST /api/ai/analyze/
    Analyze an incident payload to synthesize summary, probable root cause, affected components,
    and recommended remediation actions.
    """

    permission_classes = [IsAuthenticated]
    serializer_class = IncidentAnalyzeRequestSerializer

    @extend_schema(
        request=IncidentAnalyzeRequestSerializer,
        responses={200: IncidentAnalyzeResponseSerializer},
        summary="Analyze incident root cause and impact",
        description="Uses AI Engine to evaluate incident details and generate triage summary.",
    )
    def post(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            analyzer = IncidentAnalyzer()
            result = analyzer.analyze(**serializer.validated_data)
            response_serializer = IncidentAnalyzeResponseSerializer(data=result)
            response_serializer.is_valid(raise_exception=True)
            return Response(
                response_serializer.validated_data, status=status.HTTP_200_OK
            )
        except Exception as exc:
            logger.exception("Error processing incident analysis: %s", str(exc))
            return Response(
                {"error": "Failed to analyze incident.", "detail": str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class IncidentAnalyzeDetailView(APIView):
    """
    POST /api/ai/analyze/<incident_id>/
    Trigger an AI analysis on a persistent Incident and store AIIncidentAnalysis record.
    """

    permission_classes = [IsAuthenticated, IsAIIncidentOrganizationMember]
    serializer_class = AIIncidentAnalysisSerializer

    @extend_schema(
        responses={200: AIIncidentAnalysisSerializer},
        summary="Analyze persistent incident by ID",
        description="Triggers AI analysis for a database incident and stores results.",
    )
    def post(
        self, request: Request, incident_id: Any, *args: Any, **kwargs: Any
    ) -> Response:
        incident = get_object_or_404(Incident, id=incident_id)
        self.check_object_permissions(request, incident)

        try:
            analyzer = IncidentAnalyzer()
            analysis = analyzer.analyze_incident(incident)
            return Response(
                self.serializer_class(analysis).data,
                status=status.HTTP_200_OK,
            )
        except Exception as exc:
            logger.exception(
                "Error analyzing persistent incident ID=%s: %s", incident_id, str(exc)
            )
            return Response(
                {"error": "Failed to analyze incident.", "detail": str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class IncidentAnalysisRetrieveView(APIView):
    """
    GET /api/ai/analysis/<incident_id>/
    Retrieve the latest persistent AIIncidentAnalysis record for an incident.
    """

    permission_classes = [IsAuthenticated, IsAIIncidentOrganizationMember]
    serializer_class = AIIncidentAnalysisSerializer

    @extend_schema(
        responses={200: AIIncidentAnalysisSerializer},
        summary="Retrieve AI analysis for an incident",
        description="Returns the most recent stored AI analysis for a given incident ID.",
    )
    def get(
        self, request: Request, incident_id: Any, *args: Any, **kwargs: Any
    ) -> Response:
        incident = get_object_or_404(Incident, id=incident_id)
        self.check_object_permissions(request, incident)

        analysis = incident.ai_analyses.first()
        if not analysis:
            return Response(
                {"error": "No AI analysis found for this incident."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            self.serializer_class(analysis).data,
            status=status.HTTP_200_OK,
        )


class SeverityPredictView(APIView):
    """
    POST /api/ai/predict-severity/
    Predict standard incident severity level and confidence score.
    """

    permission_classes = [IsAuthenticated]
    serializer_class = SeverityPredictRequestSerializer

    @extend_schema(
        request=SeverityPredictRequestSerializer,
        responses={200: SeverityPredictResponseSerializer},
        summary="Predict incident severity classification",
        description="Uses AI Engine to predict severity level and return a confidence score.",
    )
    def post(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            predictor = SeverityPredictor()
            result = predictor.predict(**serializer.validated_data)
            response_serializer = SeverityPredictResponseSerializer(data=result)
            response_serializer.is_valid(raise_exception=True)
            return Response(
                response_serializer.validated_data, status=status.HTTP_200_OK
            )
        except Exception as exc:
            logger.exception("Error processing severity prediction: %s", str(exc))
            return Response(
                {"error": "Failed to predict severity.", "detail": str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class RecommendationView(APIView):
    """
    POST /api/ai/recommendations/
    Generate actionable mitigation, investigation, and prevention recommendations.
    """

    permission_classes = [IsAuthenticated]
    serializer_class = RecommendationRequestSerializer

    @extend_schema(
        request=RecommendationRequestSerializer,
        responses={200: RecommendationResponseSerializer},
        summary="Generate AI response recommendations",
        description="Uses AI Engine to synthesize mitigation steps and investigation checklist.",
    )
    def post(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            engine = RecommendationEngine()
            result = engine.recommend(**serializer.validated_data)
            response_serializer = RecommendationResponseSerializer(data=result)
            response_serializer.is_valid(raise_exception=True)
            return Response(
                response_serializer.validated_data, status=status.HTTP_200_OK
            )
        except Exception as exc:
            logger.exception("Error generating AI recommendations: %s", str(exc))
            return Response(
                {"error": "Failed to generate recommendations.", "detail": str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class IncidentAIAnalysisRetrieveView(APIView):
    """
    GET /api/ai/incidents/<id>/analysis/
    Retrieve structured Phase 5 AI Analysis for an incident.
    """

    permission_classes = [IsAuthenticated, IsAIIncidentOrganizationMember]
    serializer_class = IncidentAnalysisSerializer

    @extend_schema(
        responses={200: IncidentAnalysisSerializer},
        summary="Retrieve Phase 5 Incident AI analysis",
        description="Returns the OneToOne IncidentAnalysis tracking asynchronous AI triage status and outputs.",
    )
    def get(
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

        analysis = getattr(incident, "ai_analysis", None)
        if not analysis:
            return Response(
                {"error": "No AI analysis found for this incident."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            self.serializer_class(analysis).data,
            status=status.HTTP_200_OK,
        )


class IncidentAIAnalyzeTriggerView(APIView):
    """
    POST /api/ai/incidents/<id>/analyze/
    Manually trigger asynchronous AI analysis for an incident using Celery.
    """

    permission_classes = [IsAuthenticated, IsAIIncidentOrganizationMember]
    serializer_class = IncidentAIAnalyzeTriggerSerializer

    @extend_schema(
        responses={202: IncidentAIAnalyzeTriggerSerializer},
        summary="Trigger asynchronous AI analysis",
        description="Dispatches analyze_incident_task to Celery for an incident without blocking.",
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
            analyze_incident_task.delay(str(incident.id))
            payload = {
                "message": "AI analysis triggered.",
                "incident_id": str(incident.id),
                "status": "pending",
            }
            return Response(payload, status=status.HTTP_202_ACCEPTED)
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
