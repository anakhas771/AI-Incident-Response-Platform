from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.common.models import TimeStampedUUIDModel


class AuditAction(models.TextChoices):
    PASSWORD_RESET_REQUESTED = "PASSWORD_RESET_REQUESTED", _("Password Reset Requested")
    PASSWORD_CHANGED = "PASSWORD_CHANGED", _("Password Changed")
    USER_INVITED = "USER_INVITED", _("User Invited")
    INVITATION_RESENT = "INVITATION_RESENT", _("Invitation Resent")
    INVITATION_REVOKED = "INVITATION_REVOKED", _("Invitation Revoked")
    INVITATION_ACCEPTED = "INVITATION_ACCEPTED", _("Invitation Accepted")
    ROLE_CHANGED = "ROLE_CHANGED", _("Role Changed")
    USER_ADDED_TO_ORGANIZATION = (
        "USER_ADDED_TO_ORGANIZATION",
        _("User Added To Organization"),
    )
    USER_REMOVED_FROM_ORGANIZATION = (
        "USER_REMOVED_FROM_ORGANIZATION",
        _("User Removed From Organization"),
    )
    PERMISSION_DENIED = "PERMISSION_DENIED", _("Permission Denied")


class AuditLog(TimeStampedUUIDModel):
    organization = models.ForeignKey(
        "accounts.Organization",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )
    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )
    action = models.CharField(
        max_length=50,
        choices=AuditAction.choices,
        db_index=True,
    )
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = _("Audit Log")
        verbose_name_plural = _("Audit Logs")
        indexes = [
            models.Index(fields=["organization", "-created_at"]),
            models.Index(fields=["action", "-created_at"]),
        ]

    def __str__(self) -> str:
        org_name = self.organization.name if self.organization else "System"
        user_email = self.user.email if self.user else "Anonymous"
        return f"[{org_name}] {self.action} by {user_email} at {self.created_at}"
