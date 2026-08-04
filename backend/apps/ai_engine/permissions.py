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

    def has_permission(self, request: Request, view: APIView) -> bool:
        if not (request.user and request.user.is_authenticated):
            return False
        user = cast(User, request.user)
        if user.is_superuser:
            return True
        return bool(user.organization)

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


class CanTriggerAIAnalysis(BasePermission):
    """
    RBAC permission class that allows all authenticated organization members read-only
    access (GET, HEAD, OPTIONS), but restricts triggering AI operations (POST, PUT, PATCH, DELETE)
    to ADMIN, ANALYST, and RESPONDER roles (excludes VIEWER role).
    """

    message = "You do not have permission to trigger AI analysis or remediation."

    def has_permission(self, request: Request, view: APIView) -> bool:
        if not (request.user and request.user.is_authenticated):
            return False
        user = cast(User, request.user)
        if user.is_superuser:
            return True

        if request.method in ("GET", "HEAD", "OPTIONS"):
            return bool(user.organization)

        from apps.accounts.models import Role

        allowed_roles = {Role.ADMIN, Role.ANALYST, Role.RESPONDER}
        return bool(user.organization and user.role in allowed_roles)
