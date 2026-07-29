from typing import Any, Sequence

from rest_framework.permissions import BasePermission
from rest_framework.request import Request
from rest_framework.views import APIView

from .models import Role


class IsAdmin(BasePermission):
    """
    Allows access only to users with the ADMIN role or superuser status.
    """

    def has_permission(self, request: Request, view: APIView) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.role == Role.ADMIN or request.user.is_superuser)
        )


class IsAnalyst(BasePermission):
    """
    Allows access to users with ADMIN or ANALYST roles.
    """

    def has_permission(self, request: Request, view: APIView) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and (
                request.user.role in [Role.ADMIN, Role.ANALYST]
                or request.user.is_superuser
            )
        )


class IsResponder(BasePermission):
    """
    Allows access to users with ADMIN, ANALYST, or RESPONDER roles.
    """

    def has_permission(self, request: Request, view: APIView) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and (
                request.user.role in [Role.ADMIN, Role.ANALYST, Role.RESPONDER]
                or request.user.is_superuser
            )
        )


class IsSameOrganization(BasePermission):
    """
    Object-level permission allowing access only to users belonging to the same organization.
    """

    def has_object_permission(self, request: Request, view: APIView, obj: Any) -> bool:
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.is_superuser:
            return True

        target_org = getattr(
            obj, "organization", obj if hasattr(obj, "users") else None
        )
        return bool(
            request.user.organization and request.user.organization == target_org
        )


def HasRole(allowed_roles: Sequence[str]):
    """
    Factory function to create a permission class that permits users with specific roles.
    """

    class DynamicRolePermission(BasePermission):
        def has_permission(self, request: Request, view: APIView) -> bool:
            return bool(
                request.user
                and request.user.is_authenticated
                and (request.user.role in allowed_roles or request.user.is_superuser)
            )

    return DynamicRolePermission
