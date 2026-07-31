"""
RBAC and organization isolation permissions for Enterprise RAG Knowledge Base.
"""

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
        user: User = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        return bool(user.organization)

    def has_object_permission(self, request: Request, view: APIView, obj) -> bool:
        user: User = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        if not user.organization:
            return False
        return (
            getattr(obj, "organization_id", None) == user.organization_id
            or getattr(obj, "organization", None) == user.organization
        )
