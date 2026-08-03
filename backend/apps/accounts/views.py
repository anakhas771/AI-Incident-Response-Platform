from typing import Any, cast

from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import Organization, User
from .permissions import IsSameOrganization
from .serializers import (
    ChangePasswordSerializer,
    CustomTokenObtainPairSerializer,
    OrganizationSerializer,
    UserDetailSerializer,
    UserRegistrationSerializer,
)


@extend_schema(
    tags=["Authentication"],
    summary="Register a new user account",
    description="Registers a new enterprise user with email, password, role, and optional organization.",
    responses={
        201: UserDetailSerializer,
        400: OpenApiResponse(description="Validation error"),
    },
)
class RegisterView(generics.CreateAPIView):
    """
    Public endpoint for registering a new user.
    """

    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

    def create(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        output_serializer = UserDetailSerializer(user)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)


@extend_schema(
    tags=["Authentication"],
    summary="User Login (Obtain JWT token pair)",
    description="Authenticates user using email and password, returning JWT access & refresh tokens alongside user info.",
)
class CustomTokenObtainPairView(TokenObtainPairView):
    """
    SimpleJWT login view utilizing custom email authentication.
    """

    serializer_class: Any = CustomTokenObtainPairSerializer


@extend_schema(
    tags=["Authentication"],
    summary="Refresh JWT access token",
    description="Takes a valid refresh token and returns a new access token.",
)
class CustomTokenRefreshView(TokenRefreshView):
    """
    SimpleJWT token refresh view.
    """

    pass


@extend_schema(
    tags=["Users"],
    summary="Retrieve or update user profile",
    description="Returns profile information for the currently authenticated user.",
)
class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    Endpoint for authenticated user to manage their own profile.
    """

    serializer_class = UserDetailSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self) -> User:
        return self.request.user  # type: ignore[return-value]


@extend_schema(
    tags=["Users"],
    summary="Change user password",
    description="Allows authenticated user to update their account password.",
    request=ChangePasswordSerializer,
    responses={
        200: OpenApiResponse(description="Password changed successfully."),
        400: OpenApiResponse(description="Invalid password input."),
    },
)
class ChangePasswordView(APIView):
    """
    Endpoint for password change.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        serializer = ChangePasswordSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        user = request.user
        user.set_password(serializer.validated_data["new_password"])
        user.save()
        return Response(
            {"detail": "Password updated successfully."},
            status=status.HTTP_200_OK,
        )


@extend_schema(
    tags=["Organizations"],
    summary="Retrieve or update current organization",
    description="Returns organization details for the authenticated user's organization.",
)
class OrganizationDetailView(generics.RetrieveUpdateAPIView):
    """
    Endpoint to view and manage user's organization.
    """

    serializer_class = OrganizationSerializer
    permission_classes = [IsAuthenticated, IsSameOrganization]

    def get_object(self) -> Organization:
        user = cast(User, self.request.user)
        org = user.organization
        if not org:
            self.raise_exception_or_404()
        self.check_object_permissions(self.request, org)
        return cast(Organization, org)

    def raise_exception_or_404(self) -> None:
        from rest_framework.exceptions import NotFound

        raise NotFound("User does not belong to any organization.")
