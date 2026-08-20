"""
Database models for AI Engine analysis, predictions, and recommendations.
"""

from typing import Any, cast

from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.common.models import TimeStampedUUIDModel
from apps.incidents.models import Incident


class AnalysisStatus(models.TextChoices):
    PENDING = "pending", _("Pending")
    PROCESSING = "processing", _("Processing")
    COMPLETED = "completed", _("Completed")
    FAILED = "failed", _("Failed")


class AIIncidentAnalysis(TimeStampedUUIDModel):
    """
    Persistent model storing AI-generated analysis, root cause, severity prediction,
    risk scores, and remediation recommendations for an incident.
    """

    incident: models.ForeignKey = models.ForeignKey(
        Incident,
        on_delete=models.CASCADE,
        related_name="ai_analyses",
        db_index=True,
    )
    summary: models.TextField = models.TextField(
        blank=True,
        default="",
        help_text=_("AI-generated executive summary and security summary."),
    )
    root_cause: models.TextField = models.TextField(
        blank=True,
        default="",
        help_text=_("AI-generated technical probable root cause analysis."),
    )
    severity_prediction: models.CharField = models.CharField(
        max_length=50,
        blank=True,
        default="MEDIUM",
        help_text=_("AI-predicted severity classification."),
    )
    risk_score: models.FloatField = models.FloatField(
        default=0.0,
        help_text=_("Calculated risk score between 0.0 and 100.0."),
    )
    confidence_score: models.FloatField = models.FloatField(
        default=0.0,
        help_text=_("AI prediction confidence score between 0.0 and 1.0."),
    )
    recommendations: models.JSONField = models.JSONField(
        default=list,
        help_text=_("Structured remediation and prevention recommendations."),
    )

    class Meta:
        ordering = ["-created_at"]
        verbose_name = _("AI Incident Analysis")
        verbose_name_plural = _("AI Incident Analyses")

    def __str__(self) -> str:
        return f"AI Analysis for {self.incident.title} ({self.severity_prediction})"


class IncidentAnalysis(TimeStampedUUIDModel):
    """
    Phase 5 OneToOne AI Analysis model tracking asynchronous workflow status,
    severity prediction, risk score, category, root cause, impact, and recommendations.
    """

    incident: models.OneToOneField = models.OneToOneField(
        Incident,
        on_delete=models.CASCADE,
        related_name="ai_analysis",
    )
    status: models.CharField = models.CharField(
        max_length=20,
        choices=AnalysisStatus.choices,
        default=AnalysisStatus.PENDING,
        db_index=True,
    )
    severity_prediction: models.CharField = models.CharField(
        max_length=50,
        blank=True,
        default="MEDIUM",
    )
    risk_score: models.FloatField = models.FloatField(
        default=0.0,
    )
    incident_category: models.CharField = models.CharField(
        max_length=100,
        blank=True,
        default="Other",
    )
    root_cause_analysis: models.TextField = models.TextField(
        blank=True,
        default="",
    )
    impact_analysis: models.TextField = models.TextField(
        blank=True,
        default="",
    )
    recommended_actions: models.JSONField = models.JSONField(
        default=list,
    )
    confidence_score: models.FloatField = models.FloatField(
        default=0.0,
    )
    similar_incidents: models.JSONField = models.JSONField(
        default=list,
        blank=True,
    )
    previous_resolutions: models.JSONField = models.JSONField(
        default=list,
        blank=True,
    )
    knowledge_citations: models.JSONField = models.JSONField(
        default=list,
        blank=True,
    )

    # Backward compatibility helper attributes
    summary: models.TextField = models.TextField(
        blank=True,
        default="",
    )

    class Meta:
        ordering = ["-created_at"]
        verbose_name = _("Incident AI Analysis")
        verbose_name_plural = _("Incident AI Analyses")

    def __str__(self) -> str:
        status_display = cast(Any, self).get_status_display()
        return f"AI Workflow Analysis for {self.incident.title} [{status_display}]"
