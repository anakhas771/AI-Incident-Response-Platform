from typing import Any, Dict, Optional

from django.db import transaction
from django.utils import timezone

from apps.accounts.models import Organization, User

from .models import Comment, EventType, Incident, IncidentEvent, Status


class IncidentService:
    """
    Service layer encapsulating domain logic and event logging for incidents.
    """

    @staticmethod
    @transaction.atomic
    def create_incident(
        user: User, organization: Organization, data: Dict[str, Any]
    ) -> Incident:
        """
        Creates a new incident and logs a CREATED event.
        """
        incident = Incident.objects.create(
            organization=organization, created_by=user, **data
        )

        IncidentEvent.objects.create(
            incident=incident,
            user=user,
            event_type=EventType.CREATED,
            message=f"Incident '{incident.title}' created with severity {incident.severity}.",
            metadata={
                "severity": incident.severity,
                "status": incident.status,
                "category": incident.category,
            },
        )
        return incident

    @staticmethod
    @transaction.atomic
    def assign_incident(
        incident: Incident,
        assigned_to_user: Optional[User],
        performing_user: User,
    ) -> Incident:
        """
        Assigns an incident to a user and logs an ASSIGNED event.
        """
        old_assigned = incident.assigned_to
        incident.assigned_to = assigned_to_user
        incident.save(update_fields=["assigned_to", "updated_at"])

        assignee_name = (
            assigned_to_user.full_name if assigned_to_user else "Unassigned"
        )
        old_assignee_name = old_assigned.full_name if old_assigned else "Unassigned"

        IncidentEvent.objects.create(
            incident=incident,
            user=performing_user,
            event_type=EventType.ASSIGNED,
            message=f"Incident assigned to {assignee_name} (previously {old_assignee_name}).",
            metadata={
                "assigned_to_id": (
                    str(assigned_to_user.id) if assigned_to_user else None
                ),
                "previous_assigned_to_id": (
                    str(old_assigned.id) if old_assigned else None
                ),
            },
        )
        return incident

    @staticmethod
    @transaction.atomic
    def change_status(
        incident: Incident, new_status: str, performing_user: User
    ) -> Incident:
        """
        Transitions incident status, sets timestamps, and logs a STATUS_CHANGED event.
        """
        old_status = incident.status
        incident.status = new_status

        now = timezone.now()
        update_fields = ["status", "updated_at"]

        if new_status == Status.RESOLVED and not incident.resolved_at:
            incident.resolved_at = now
            update_fields.append("resolved_at")
        elif new_status == Status.CLOSED:
            if not incident.closed_at:
                incident.closed_at = now
                update_fields.append("closed_at")
            if not incident.resolved_at:
                incident.resolved_at = now
                update_fields.append("resolved_at")

        incident.save(update_fields=update_fields)

        IncidentEvent.objects.create(
            incident=incident,
            user=performing_user,
            event_type=EventType.STATUS_CHANGED,
            message=f"Incident status changed from {old_status} to {new_status}.",
            metadata={
                "old_status": old_status,
                "new_status": new_status,
            },
        )
        return incident

    @staticmethod
    @transaction.atomic
    def add_comment(incident: Incident, author: User, message: str) -> Comment:
        """
        Adds a comment to an incident and logs a COMMENT_ADDED event.
        """
        comment = Comment.objects.create(
            incident=incident, author=author, message=message
        )

        IncidentEvent.objects.create(
            incident=incident,
            user=author,
            event_type=EventType.COMMENT_ADDED,
            message=f"Comment added by {author.full_name}.",
            metadata={"comment_id": str(comment.id)},
        )
        return comment
