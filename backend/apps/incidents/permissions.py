from typing import Any, cast

from rest_framework.permissions import SAFE_METHODS, BasePermission
from rest_framework.request import Request
from rest_framework.views import APIView

from apps.accounts.models import Role, User


class IncidentPermission(BasePermission):
    """
    Role-Based Access Control (RBAC) permission policy for Incident Management:

    - ADMIN: Full access.
    - RESPONDER (Manager tier): Create, list, retrieve, update, delete, assign, status, comment.
    - ANALYST: Create, list, retrieve, update, assign, status, comment.
    - VIEWER: Read-only access (list, retrieve, view timeline, view comments).
    """

    ALLOWED_ROLES_PER_ACTION = {
        "create": [Role.ADMIN, Role.ANALYST],
        "list": [Role.ADMIN, Role.RESPONDER, Role.ANALYST, Role.VIEWER],
        "retrieve": [Role.ADMIN, Role.RESPONDER, Role.ANALYST, Role.VIEWER],
        "update": [Role.ADMIN, Role.ANALYST],
        "partial_update": [Role.ADMIN, Role.ANALYST],
        "destroy": [Role.ADMIN],
        "assign": [Role.ADMIN, Role.ANALYST],
        "status": [Role.ADMIN, Role.RESPONDER, Role.ANALYST],
        "change_status": [Role.ADMIN, Role.RESPONDER, Role.ANALYST],
        "comments": [Role.ADMIN, Role.RESPONDER, Role.ANALYST],
    }

    def has_permission(self, request: Request, view: APIView) -> bool:
        if not (request.user and request.user.is_authenticated):
            return False
        user = cast(User, request.user)
        if user.is_superuser or request.method in SAFE_METHODS:
            return True

        action = getattr(view, "action", None)
        allowed_roles = self.ALLOWED_ROLES_PER_ACTION.get(
            str(action) if action else "", [Role.ADMIN, Role.ANALYST]
        )
        return user.role in allowed_roles


class IsIncidentOrganizationMember(BasePermission):
    """
    Ensures that users can only access incidents belonging to their own organization.
    """

    def has_object_permission(self, request: Request, view: APIView, obj: Any) -> bool:
        if not (request.user and request.user.is_authenticated):
            return False
        user = cast(User, request.user)
        if user.is_superuser:
            return True

        incident_org = getattr(obj, "organization", None)
        return bool(
            user.organization and incident_org and user.organization == incident_org
        )
