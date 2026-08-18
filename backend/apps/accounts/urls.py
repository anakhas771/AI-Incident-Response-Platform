from django.urls import path
from rest_framework.routers import DefaultRouter

from .invitation_preview import InvitationPreviewView
from .views import (
    ChangePasswordView,
    CustomTokenObtainPairView,
    CustomTokenRefreshView,
    InvitationAcceptView,
    OrganizationCreateView,
    OrganizationDetailView,
    OrganizationInvitationViewSet,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    RegisterView,
    UserProfileView,
)

router = DefaultRouter()
router.register(r"auth/invitations", OrganizationInvitationViewSet, basename="invitations")

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="auth-register"),
    path("auth/login/", CustomTokenObtainPairView.as_view(), name="auth-login"),
    path("auth/refresh/", CustomTokenRefreshView.as_view(), name="auth-refresh"),
    path("auth/me/", UserProfileView.as_view(), name="auth-me"),
    path("auth/change-password/", ChangePasswordView.as_view(), name="auth-change-password"),
    path("auth/organization/", OrganizationDetailView.as_view(), name="organization-detail"),
    path("auth/organizations/", OrganizationCreateView.as_view(), name="organization-create"),
    path("auth/password-reset/", PasswordResetRequestView.as_view(), name="auth-password-reset"),
    path("auth/password-reset/confirm/", PasswordResetConfirmView.as_view(), name="auth-password-reset-confirm"),
    path("auth/invitations/preview/", InvitationPreviewView.as_view(), name="invitations-preview"),
    path("auth/invitations/accept/", InvitationAcceptView.as_view(), name="invitations-accept"),
] + router.urls
