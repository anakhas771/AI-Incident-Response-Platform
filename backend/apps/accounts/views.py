from datetime import timedelta
from typing import Any, cast

from django.conf import settings
from django.db import transaction
from django.utils import timezone
from django.utils.crypto import get_random_string
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import generics, status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.common.tasks import send_async_email
from apps.logs.models import AuditAction
from apps.logs.services import AuditLogger

from .models import InvitationStatus, Organization, OrganizationInvitation, PasswordResetToken, User
from .permissions import IsAdmin, IsResponder, IsSameOrganization
from .serializers import ChangePasswordSerializer, CustomTokenObtainPairSerializer, InvitationAcceptSerializer, OrganizationInvitationSerializer, OrganizationSerializer, PasswordResetConfirmSerializer, PasswordResetRequestSerializer, UserDetailSerializer, UserRegistrationSerializer
from .token_utils import hash_lifecycle_token


@extend_schema(tags=["Authentication"], summary="Register a new user account", description="Registers a new enterprise user with email, password, role, and optional organization.", responses={201: UserDetailSerializer, 400: OpenApiResponse(description="Validation error")})
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

    def create(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserDetailSerializer(user).data, status=status.HTTP_201_CREATED)


@extend_schema(tags=["Authentication"], summary="User Login (Obtain JWT token pair)", description="Authenticates user using email and password, returning JWT access & refresh tokens alongside user info.")
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class: Any = CustomTokenObtainPairSerializer


@extend_schema(tags=["Authentication"], summary="Refresh JWT access token", description="Takes a valid refresh token and returns a new access token.")
class CustomTokenRefreshView(TokenRefreshView):
    pass


@extend_schema(tags=["Users"], summary="Retrieve or update user profile", description="Returns profile information for the currently authenticated user.")
class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserDetailSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self) -> User:
        return cast(User, self.request.user)


@extend_schema(tags=["Users"], summary="Change user password", description="Allows authenticated user to update their account password.", request=ChangePasswordSerializer, responses={200: OpenApiResponse(description="Password changed successfully."), 400: OpenApiResponse(description="Invalid password input.")})
class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = cast(User, request.user)
        user.set_password(serializer.validated_data["new_password"])
        user.save()
        return Response({"detail": "Password updated successfully."}, status=status.HTTP_200_OK)


@extend_schema(tags=["Organizations"], summary="Retrieve or update current organization", description="Returns organization details for the authenticated user's organization.")
class OrganizationDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = OrganizationSerializer
    permission_classes = [IsAuthenticated, IsSameOrganization]

    def get_object(self) -> Organization:
        user = cast(User, self.request.user)
        org = user.organization
        if not org:
            from rest_framework.exceptions import NotFound
            raise NotFound("User does not belong to any organization.")
        self.check_object_permissions(self.request, org)
        return cast(Organization, org)


@extend_schema(tags=["Authentication"], summary="Request Password Reset", description="Generates a password reset token and emails a one-time link to the user. Always returns success to prevent email enumeration.", responses={200: OpenApiResponse(description="Reset link sent if account exists.")})
class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request: Request) -> Response:
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].lower()
        try:
            user = User.objects.get(email=email, is_active=True)
            raw_token = get_random_string(64)
            expires_at = timezone.now() + timedelta(hours=24)
            PasswordResetToken.objects.create(user=user, token=hash_lifecycle_token(raw_token), expires_at=expires_at)
            reset_url = f"{settings.FRONTEND_BASE_URL.rstrip('/')}/reset-password?token={raw_token}"
            context = {"reset_url": reset_url, "email": user.email, "name": user.first_name}
            transaction.on_commit(lambda: send_async_email.delay(subject="Password Reset Request", template_name="emails/password_reset.html", context=context, recipient_list=[user.email]))
            AuditLogger.log_event(action=AuditAction.PASSWORD_RESET_REQUESTED, user=user, organization=user.organization, ip_address=request.META.get("REMOTE_ADDR"))
        except User.DoesNotExist:
            pass
        return Response({"detail": "If your account exists, a reset link has been sent."}, status=status.HTTP_200_OK)


@extend_schema(tags=["Authentication"], summary="Confirm Password Reset", description="Resets the password using a valid one-time token.", responses={200: OpenApiResponse(description="Password changed successfully.")})
class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request: Request) -> Response:
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        reset_token_obj = serializer.validated_data["reset_token_obj"]
        with transaction.atomic():
            user.set_password(serializer.validated_data["new_password"])
            user.save()
            reset_token_obj.used = True
            reset_token_obj.save(update_fields=["used", "updated_at"])
            AuditLogger.log_event(action=AuditAction.PASSWORD_CHANGED, user=user, organization=user.organization, ip_address=request.META.get("REMOTE_ADDR"))
        return Response({"detail": "Password has been reset successfully."}, status=status.HTTP_200_OK)


@extend_schema(tags=["Organizations"])
class OrganizationInvitationViewSet(viewsets.ModelViewSet):
    serializer_class = OrganizationInvitationSerializer
    permission_classes = [IsAuthenticated, IsSameOrganization, (IsAdmin | IsResponder)]

    def get_queryset(self):
        user = cast(User, self.request.user)
        return OrganizationInvitation.objects.filter(organization=user.organization).order_by("-created_at")

    def create(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        user = cast(User, request.user)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].lower()
        org = user.organization
        if User.objects.filter(email=email, organization=org).exists():
            return Response({"detail": "User is already in the organization."}, status=status.HTTP_400_BAD_REQUEST)
        if OrganizationInvitation.objects.filter(email=email, organization=org, status=InvitationStatus.PENDING, expires_at__gt=timezone.now()).exists():
            return Response({"detail": "A pending invitation already exists for this email."}, status=status.HTTP_400_BAD_REQUEST)
        raw_token = get_random_string(64)
        expires_at = timezone.now() + timedelta(days=7)
        with transaction.atomic():
            invitation = serializer.save(organization=org, created_by=user, token=hash_lifecycle_token(raw_token), expires_at=expires_at, status=InvitationStatus.PENDING)
            invitation_url = f"{settings.FRONTEND_BASE_URL.rstrip('/')}/accept-invitation?token={raw_token}"
            context = {"invitation_url": invitation_url, "email": invitation.email, "role": invitation.role, "org_name": org.name, "inviter_name": user.full_name}
            transaction.on_commit(lambda: send_async_email.delay(subject=f"Invitation to join {org.name}", template_name="emails/invitation.html", context=context, recipient_list=[invitation.email]))
            AuditLogger.log_event(action=AuditAction.USER_INVITED, user=user, organization=org, ip_address=request.META.get("REMOTE_ADDR"), metadata={"invited_email": invitation.email, "role": invitation.role})
        return Response(self.get_serializer(invitation).data, status=status.HTTP_201_CREATED)


@extend_schema(tags=["Authentication"], summary="Accept Organization Invitation", description="Validates an invitation token and updates the user's organization and role.", responses={200: OpenApiResponse(description="Invitation accepted.")})
class InvitationAcceptView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        serializer = InvitationAcceptSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        invitation = serializer.validated_data["invitation"]
        user = cast(User, request.user)
        if invitation.email.lower() != user.email.lower():
            return Response({"detail": "This invitation was sent to a different email address."}, status=status.HTTP_403_FORBIDDEN)
        with transaction.atomic():
            invitation.status = InvitationStatus.ACCEPTED
            invitation.accepted_at = timezone.now()
            invitation.save(update_fields=["status", "accepted_at", "updated_at"])
            user.organization = invitation.organization
            user.role = invitation.role
            user.save(update_fields=["organization", "role", "updated_at"])
            AuditLogger.log_event(action=AuditAction.INVITATION_ACCEPTED, user=user, organization=invitation.organization, ip_address=request.META.get("REMOTE_ADDR"), metadata={"role": invitation.role})
        return Response({"detail": "Invitation accepted successfully."}, status=status.HTTP_200_OK)
