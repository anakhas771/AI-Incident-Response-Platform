"""
RBAC and organization isolation permissions for Enterprise RAG Knowledge Base.
"""

from typing import cast

from rest_framework import permissions
from rest_framework.request import Request
from rest_framework.views import APIView

from apps.accounts.models import User


class IsKnowledgeOrganizationMember(permissions.BasePermission):
    """
    Ensure users can only access, search, chat, or modify knowledge documents
    belonging strictly to their own organization.
    """

    message = (
        "You do not have permission to access knowledge documents in this organization."
    )

    def has_permission(self, request: Request, view: APIView) -> bool:
        user = cast(User, request.user)
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        return bool(user.organization)

    def has_object_permission(self, request: Request, view: APIView, obj) -> bool:
        user = cast(User, request.user)
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        if not user.organization:
            return False
        return bool(
            getattr(obj, "organization_id", None) == user.organization_id
            or getattr(obj, "organization", None) == user.organization
        )


class IsCopilotSessionOwner(permissions.BasePermission):
    """
    Ensure users can only access their own Enterprise AI Copilot conversation sessions
    within their own organization.
    """

    message = (
        "You do not have permission to access conversation sessions belonging "
        "to another user or organization."
    )

    def has_permission(self, request: Request, view: APIView) -> bool:
        user = cast(User, request.user)
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        return bool(user.organization)

    def has_object_permission(self, request: Request, view: APIView, obj) -> bool:
        user = cast(User, request.user)
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        if not user.organization:
            return False

        session = getattr(obj, "session", None)
        target_org_id = (
            getattr(obj, "organization_id", None)
            or getattr(getattr(obj, "organization", None), "id", None)
            or getattr(session, "organization_id", None)
            or getattr(getattr(session, "organization", None), "id", None)
        )
        target_user_id = (
            getattr(obj, "user_id", None)
            or getattr(getattr(obj, "user", None), "id", None)
            or getattr(session, "user_id", None)
            or getattr(getattr(session, "user", None), "id", None)
        )
        return bool(target_org_id == user.organization_id and target_user_id == user.id)
