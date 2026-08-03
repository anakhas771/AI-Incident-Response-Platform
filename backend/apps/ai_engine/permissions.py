"""
Permission classes for AI Engine endpoints enforcing RBAC and organization isolation.
"""

from typing import Any, cast

from rest_framework.permissions import BasePermission
from rest_framework.request import Request
from rest_framework.views import APIView

from apps.accounts.models import User


class IsAIIncidentOrganizationMember(BasePermission):
    """
    Ensures that authenticated users can only access incidents or AI analyses
    belonging to their own organization.
    """

    def has_object_permission(self, request: Request, view: APIView, obj: Any) -> bool:
        if not (request.user and request.user.is_authenticated):
            return False
        user = cast(User, request.user)
        if user.is_superuser:
            return True

        incident_org = getattr(obj, "organization", None)
        if not incident_org and hasattr(obj, "incident"):
            incident = getattr(obj, "incident", None)
            if incident:
                incident_org = getattr(incident, "organization", None)

        return bool(
            user.organization and incident_org and user.organization == incident_org
        )
