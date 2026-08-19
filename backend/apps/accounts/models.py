import uuid
from typing import Any, ClassVar

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from apps.common.models import TimeStampedUUIDModel


class Organization(TimeStampedUUIDModel):
    """Enterprise organization model for multi-tenant incident response."""

    name: models.CharField = models.CharField(max_length=255)
    slug: models.SlugField = models.SlugField(
        max_length=255, unique=True, db_index=True
    )
    description: models.TextField = models.TextField(blank=True, default="")
    is_active: models.BooleanField = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]
        verbose_name = _("Organization")
        verbose_name_plural = _("Organizations")

    def __str__(self) -> str:
        return str(self.name)


class Role(models.TextChoices):
    ADMIN = "ADMIN", _("Admin")
    ANALYST = "ANALYST", _("Analyst")
    RESPONDER = "RESPONDER", _("Responder")
    VIEWER = "VIEWER", _("Viewer")


class UserManager(BaseUserManager["User"]):
    """Custom user manager using email as the authentication identifier."""

    def create_user(
        self, email: str, password: str | None = None, **extra_fields: Any
    ) -> "User":
        if not email:
            raise ValueError(_("The Email field must be set"))
        email = self.normalize_email(email).strip()
        if "username" not in extra_fields or not extra_fields["username"]:
            extra_fields["username"] = str(uuid.uuid4())
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(
        self, email: str, password: str | None = None, **extra_fields: Any
    ) -> "User":
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("role", Role.ADMIN)

        if extra_fields.get("is_staff") is not True:
            raise ValueError(_("Superuser must have is_staff=True."))
        if extra_fields.get("is_superuser") is not True:
            raise ValueError(_("Superuser must have is_superuser=True."))

        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    """Custom enterprise user model with email auth, organization and RBAC."""

    id: models.UUIDField = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False
    )
    email: models.EmailField = models.EmailField(
        _("email address"), unique=True, db_index=True
    )
    username: models.CharField = models.CharField(
        max_length=150, unique=True, null=True, blank=True
    )
    role: models.CharField = models.CharField(
        max_length=20, choices=Role.choices, default=Role.VIEWER
    )
    organization: models.ForeignKey = models.ForeignKey(
        Organization,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="users",
    )
    organization_id: Any
    phone_number: models.CharField = models.CharField(
        max_length=20, blank=True, default=""
    )
    avatar: models.FileField = models.FileField(
        upload_to="avatars/", blank=True, null=True
    )

    created_at: models.DateTimeField = models.DateTimeField(auto_now_add=True)
    updated_at: models.DateTimeField = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    objects: ClassVar[UserManager] = UserManager()  # type: ignore[assignment]

    class Meta:
        ordering = ["-date_joined"]
        verbose_name = _("User")
        verbose_name_plural = _("Users")

    def __str__(self) -> str:
        return str(self.email)

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip() or self.email


class PasswordResetToken(TimeStampedUUIDModel):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="password_reset_tokens"
    )
    token = models.CharField(max_length=64, unique=True, db_index=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = _("Password Reset Token")
        verbose_name_plural = _("Password Reset Tokens")

    @property
    def is_valid(self) -> bool:
        return not self.used and self.expires_at > timezone.now()


class InvitationStatus(models.TextChoices):
    PENDING = "PENDING", _("Pending")
    ACCEPTED = "ACCEPTED", _("Accepted")
    REVOKED = "REVOKED", _("Revoked")


class OrganizationInvitation(TimeStampedUUIDModel):
    email = models.EmailField(db_index=True)
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="invitations"
    )
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.VIEWER)
    token = models.CharField(max_length=64, unique=True, db_index=True)
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="created_invitations"
    )
    expires_at = models.DateTimeField()
    status = models.CharField(
        max_length=20,
        choices=InvitationStatus.choices,
        default=InvitationStatus.PENDING,
    )
    accepted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = _("Organization Invitation")
        verbose_name_plural = _("Organization Invitations")
        unique_together = [("email", "organization", "status")]

    @property
    def is_valid(self) -> bool:
        return (
            self.status == InvitationStatus.PENDING and self.expires_at > timezone.now()
        )

    def __str__(self) -> str:
        return f"Invite for {self.email} to {self.organization.name}"
