import uuid

from django.contrib.auth import get_user_model
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.accounts.models import Organization
from apps.common.models import TimeStampedUUIDModel

User = get_user_model()


class Severity(models.TextChoices):
    CRITICAL = "CRITICAL", _("Critical")
    HIGH = "HIGH", _("High")
    MEDIUM = "MEDIUM", _("Medium")
    LOW = "LOW", _("Low")


class Status(models.TextChoices):
    OPEN = "OPEN", _("Open")
    INVESTIGATING = "INVESTIGATING", _("Investigating")
    IDENTIFIED = "IDENTIFIED", _("Identified")
    MITIGATING = "MITIGATING", _("Mitigating")
    RESOLVED = "RESOLVED", _("Resolved")
    CLOSED = "CLOSED", _("Closed")


class Category(models.TextChoices):
    INFRASTRUCTURE = "Infrastructure", _("Infrastructure")
    SECURITY = "Security", _("Security")
    APPLICATION = "Application", _("Application")
    DATABASE = "Database", _("Database")
    NETWORK = "Network", _("Network")
    OTHER = "Other", _("Other")


class Incident(TimeStampedUUIDModel):
    """
    Enterprise Incident Model tracking operational security and system incidents.
    """

    organization: models.ForeignKey = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="incidents",
        db_index=True,
    )
    title: models.CharField = models.CharField(max_length=255)
    description: models.TextField = models.TextField(blank=True, default="")
    severity: models.CharField = models.CharField(
        max_length=20,
        choices=Severity.choices,
        default=Severity.MEDIUM,
        db_index=True,
    )
    status: models.CharField = models.CharField(
        max_length=20, choices=Status.choices, default=Status.OPEN, db_index=True
    )
    category: models.CharField = models.CharField(
        max_length=50,
        choices=Category.choices,
        default=Category.OTHER,
        db_index=True,
    )
    created_by: models.ForeignKey = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_incidents",
    )
    assigned_to: models.ForeignKey = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_incidents",
    )
    resolved_at: models.DateTimeField = models.DateTimeField(null=True, blank=True)
    closed_at: models.DateTimeField = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = _("Incident")
        verbose_name_plural = _("Incidents")
        indexes = [
            models.Index(fields=["organization", "status"]),
            models.Index(fields=["organization", "severity"]),
            models.Index(fields=["organization", "-created_at"]),
        ]

    def __str__(self) -> str:
        return f"[{self.severity}] {self.title} ({self.status})"

    @property
    def is_resolved(self) -> bool:
        return bool(self.status == Status.RESOLVED)

    @property
    def is_closed(self) -> bool:
        return bool(self.status == Status.CLOSED)


class EventType(models.TextChoices):
    CREATED = "CREATED", _("Created")
    STATUS_CHANGED = "STATUS_CHANGED", _("Status Changed")
    SEVERITY_CHANGED = "SEVERITY_CHANGED", _("Severity Changed")
    ASSIGNED = "ASSIGNED", _("Assigned")
    COMMENT_ADDED = "COMMENT_ADDED", _("Comment Added")
    AI_ANALYSIS_COMPLETED = "AI_ANALYSIS_COMPLETED", _("AI Analysis Completed")


class IncidentEvent(models.Model):
    """
    Immutable timeline event log tracking history of incident transitions and updates.
    """

    id: models.UUIDField = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False
    )
    incident: models.ForeignKey = models.ForeignKey(
        Incident, on_delete=models.CASCADE, related_name="events"
    )
    user: models.ForeignKey = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="incident_events",
    )
    event_type: models.CharField = models.CharField(
        max_length=50, choices=EventType.choices
    )
    message: models.TextField = models.TextField()
    metadata: models.JSONField = models.JSONField(default=dict, blank=True)
    created_at: models.DateTimeField = models.DateTimeField(
        auto_now_add=True, db_index=True
    )

    class Meta:
        ordering = ["created_at"]
        verbose_name = _("Incident Event")
        verbose_name_plural = _("Incident Events")

    def __str__(self) -> str:
        return f"{self.incident.title} - {self.event_type} at {self.created_at}"


class Comment(models.Model):
    """
    Discussion and notes added to an incident by team members.
    """

    id: models.UUIDField = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False
    )
    incident: models.ForeignKey = models.ForeignKey(
        Incident, on_delete=models.CASCADE, related_name="comments"
    )
    author: models.ForeignKey = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="incident_comments"
    )
    message: models.TextField = models.TextField()
    created_at: models.DateTimeField = models.DateTimeField(
        auto_now_add=True, db_index=True
    )

    class Meta:
        ordering = ["created_at"]
        verbose_name = _("Comment")
        verbose_name_plural = _("Comments")

    def __str__(self) -> str:
        return f"Comment by {self.author} on {self.incident.title}"


class Attachment(models.Model):
    """
    Files and evidence uploaded for an incident.
    """

    id: models.UUIDField = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False
    )
    incident: models.ForeignKey = models.ForeignKey(
        Incident, on_delete=models.CASCADE, related_name="attachments"
    )
    uploaded_by: models.ForeignKey = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="uploaded_attachments",
    )
    file: models.FileField = models.FileField(
        upload_to="incidents/attachments/%Y/%m/%d/"
    )
    filename: models.CharField = models.CharField(max_length=255)
    uploaded_at: models.DateTimeField = models.DateTimeField(
        auto_now_add=True, db_index=True
    )

    class Meta:
        ordering = ["-uploaded_at"]
        verbose_name = _("Attachment")
        verbose_name_plural = _("Attachments")

    def __str__(self) -> str:
        return f"Attachment {self.filename} for {self.incident.title}"
