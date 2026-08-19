from django.utils import timezone
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView

from .models import InvitationStatus, OrganizationInvitation
from .token_utils import hash_lifecycle_token


class InvitationPreviewView(APIView):
    """Return non-sensitive invitation details for a bearer token."""

    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        token = request.query_params.get("token")
        if not token:
            return Response(
                {"detail": "Invitation token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            invitation = OrganizationInvitation.objects.select_related(
                "organization"
            ).get(
                token=hash_lifecycle_token(token),
                status=InvitationStatus.PENDING,
            )
        except OrganizationInvitation.DoesNotExist:
            return Response(
                {"detail": "Invalid or expired invitation."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if invitation.expires_at < timezone.now():
            return Response(
                {"detail": "Invitation has expired."}, status=status.HTTP_410_GONE
            )

        return Response(
            {
                "email": invitation.email,
                "organization_name": invitation.organization.name,
                "role": invitation.role,
                "expires_at": invitation.expires_at,
            },
            status=status.HTTP_200_OK,
        )
