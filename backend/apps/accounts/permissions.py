from typing import Any, Sequence, cast

from rest_framework.permissions import BasePermission
from rest_framework.request import Request
from rest_framework.views import APIView

from .models import Role, User


class IsAdmin(BasePermission):
    """
    Allows access only to users with the ADMIN role or superuser status.
    """

    def has_permission(self, request: Request, view: APIView) -> bool:
        if not (request.user and request.user.is_authenticated):
            return False
        user = cast(User, request.user)
        return bool(user.role == Role.ADMIN or user.is_superuser)


class IsAnalyst(BasePermission):
    """
    Allows access to users with ADMIN or ANALYST roles.
    """

    def has_permission(self, request: Request, view: APIView) -> bool:
        if not (request.user and request.user.is_authenticated):
            return False
        user = cast(User, request.user)
        return bool(user.role in [Role.ADMIN, Role.ANALYST] or user.is_superuser)


class IsResponder(BasePermission):
    """
    Allows access to users with ADMIN, ANALYST, or RESPONDER roles.
    """

    def has_permission(self, request: Request, view: APIView) -> bool:
        if not (request.user and request.user.is_authenticated):
            return False
        user = cast(User, request.user)
        return bool(
            user.role in [Role.ADMIN, Role.ANALYST, Role.RESPONDER] or user.is_superuser
        )


class IsSameOrganization(BasePermission):
    """
    Object-level permission allowing access only to users belonging to the same organization.
    """

    def has_object_permission(self, request: Request, view: APIView, obj: Any) -> bool:
        if not (request.user and request.user.is_authenticated):
            return False
        user = cast(User, request.user)
        if user.is_superuser:
            return True

        target_org = getattr(
            obj, "organization", obj if hasattr(obj, "users") else None
        )
        return bool(user.organization and user.organization == target_org)


def HasRole(allowed_roles: Sequence[str]):
    """
    Factory function to create a permission class that permits users with specific roles.
    """

    class DynamicRolePermission(BasePermission):
        def has_permission(self, request: Request, view: APIView) -> bool:
            if not (request.user and request.user.is_authenticated):
                return False
            user = cast(User, request.user)
            return bool(user.role in allowed_roles or user.is_superuser)

    return DynamicRolePermission
