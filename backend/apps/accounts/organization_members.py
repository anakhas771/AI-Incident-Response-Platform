from typing import cast

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import User
from .permissions import IsSameOrganization
from .serializers import UserDetailSerializer


class OrganizationMembersView(APIView):
    permission_classes = [IsAuthenticated, IsSameOrganization]

    def get(self, request):
        user = cast(User, request.user)
        if not user.organization_id:
            return Response(
                {"detail": "User does not belong to any organization."}, status=400
            )

        members = (
            User.objects.filter(organization_id=user.organization_id)
            .select_related("organization")
            .order_by("date_joined", "email")
        )
        return Response(
            UserDetailSerializer(members, many=True, context={"request": request}).data
        )
