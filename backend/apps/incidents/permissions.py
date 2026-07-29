from typing import Any

from rest_framework.permissions import SAFE_METHODS, BasePermission
from rest_framework.request import Request
from rest_framework.views import APIView

from apps.accounts.models import Role


class IncidentPermission(BasePermission):
    """
    Role-Based Access Control (RBAC) permission policy for Incident Management:

    - ADMIN: Full access (create, list, retrieve, update, delete, assign, status, comment).
    - ANALYST: Create, list, retrieve, update, assign, status, comment. (No deletion).
    - RESPONDER: List, retrieve, status update, add comments.
    - VIEWER: Read-only access (list, retrieve, view timeline, view comments).
    """

    ALLOWED_ROLES_PER_ACTION = {
        "create": [Role.ADMIN, Role.ANALYST],
        "update": [Role.ADMIN, Role.ANALYST],
        "partial_update": [Role.ADMIN, Role.ANALYST],
        "destroy": [Role.ADMIN],
        "assign": [Role.ADMIN, Role.ANALYST],
        "status": [Role.ADMIN, Role.ANALYST, Role.RESPONDER],
        "change_status": [Role.ADMIN, Role.ANALYST, Role.RESPONDER],
        "comments": [Role.ADMIN, Role.ANALYST, Role.RESPONDER],
    }

    def has_permission(self, request: Request, view: APIView) -> bool:
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.is_superuser or request.method in SAFE_METHODS:
            return True

        action = getattr(view, "action", None)
        allowed_roles = self.ALLOWED_ROLES_PER_ACTION.get(
            action, [Role.ADMIN, Role.ANALYST]
        )
        return request.user.role in allowed_roles


class IsIncidentOrganizationMember(BasePermission):
    """
    Ensures that users can only access incidents belonging to their own organization.
    """

    def has_object_permission(
        self, request: Request, view: APIView, obj: Any
    ) -> bool:
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.is_superuser:
            return True

        incident_org = getattr(obj, "organization", None)
        return bool(
            request.user.organization
            and incident_org
            and request.user.organization == incident_org
        )
