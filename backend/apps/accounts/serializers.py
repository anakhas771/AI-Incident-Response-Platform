from typing import Any, Dict, cast

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import InvitationStatus, Organization, OrganizationInvitation, PasswordResetToken, Role, User
from .token_utils import hash_lifecycle_token

UserModel = get_user_model()


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ["id", "name", "slug", "description", "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "slug", "created_at", "updated_at"]

    def create(self, validated_data: Dict[str, Any]) -> Organization:
        name = validated_data.get("name", "")
        slug = slugify(name)
        base_slug = slug
        counter = 1
        while Organization.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
        validated_data["slug"] = slug
        return cast(Organization, super().create(validated_data))


class UserDetailSerializer(serializers.ModelSerializer):
    organization = OrganizationSerializer(read_only=True)
    full_name = serializers.CharField(read_only=True)
    avatar = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = [
            "id", "email", "first_name", "last_name", "full_name", "role",
            "organization", "phone_number", "avatar", "is_active", "date_joined",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "email", "role", "date_joined", "created_at", "updated_at"]

    def get_fields(self):
        fields = super().get_fields()
        request = self.context.get("request")
        if request is not None:
            fields["avatar"].help_text = "Profile image upload."
        return fields


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={"input_type": "password"})
    password_confirm = serializers.CharField(write_only=True, required=True, style={"input_type": "password"})
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    role = serializers.ChoiceField(choices=Role.choices, required=True)
    organization_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    organization_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    invitation_token = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ["email", "password", "password_confirm", "first_name", "last_name", "role", "organization_name", "organization_id", "invitation_token", "phone_number"]

    def validate_email(self, value: str) -> str:
        value = value.lower().strip()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Account already exists")
        return value

    def validate(self, attrs: Dict[str, Any]) -> Dict[str, Any]:
        password = attrs.get("password")
        if not attrs.get("password_confirm"):
            raise serializers.ValidationError({"password_confirm": ["password_confirm required"]})
        if password != attrs.get("password_confirm"):
            raise serializers.ValidationError({"password_confirm": ["Passwords do not match."]})
        role = attrs.get("role")
        if role == Role.ADMIN and not attrs.get("organization_name") and not attrs.get("invitation_token"):
            raise serializers.ValidationError({"role": ["Cannot register as ADMIN without creating a new organization or using an invitation."]})
        user_temp = User(email=attrs.get("email"), first_name=attrs.get("first_name", ""), last_name=attrs.get("last_name", ""))
        try:
            validate_password(str(password), user=user_temp)
        except DjangoValidationError as err:
            raise serializers.ValidationError({"password": list(err.messages)}) from err
        return attrs

    def create(self, validated_data: Dict[str, Any]) -> User:
        validated_data.pop("password_confirm", None)
        password = validated_data.pop("password")
        org_name = validated_data.pop("organization_name", None)
        org_id = validated_data.pop("organization_id", None)
        inv_token = validated_data.pop("invitation_token", None)
        organization = None
        if inv_token:
            try:
                invitation = OrganizationInvitation.objects.get(token=hash_lifecycle_token(inv_token), status=InvitationStatus.PENDING)
                if invitation.expires_at < timezone.now():
                    raise serializers.ValidationError({"invitation_token": "Invitation has expired."})
                if invitation.email.lower() != validated_data["email"].lower():
                    raise serializers.ValidationError({"email": "Email does not match invitation."})
                organization = invitation.organization
                validated_data["role"] = invitation.role
            except OrganizationInvitation.DoesNotExist as err:
                raise serializers.ValidationError({"invitation_token": "Invalid or expired invitation token."}) from err
        elif org_id:
            try:
                organization = Organization.objects.get(id=org_id)
            except Organization.DoesNotExist as err:
                raise serializers.ValidationError({"organization_id": "Organization not found."}) from err
        elif org_name:
            slug = slugify(org_name)
            base_slug = slug
            counter = 1
            while Organization.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            organization = Organization.objects.create(name=org_name, slug=slug)
        return User.objects.create_user(password=password, organization=organization, **validated_data)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = User.USERNAME_FIELD
    default_error_messages = {"no_active_account": _("Invalid email or password")}

    @classmethod
    def get_token(cls, user: Any) -> Any:
        token = super().get_token(user)
        user_obj = cast(User, user)
        token["email"] = user_obj.email
        token["role"] = user_obj.role
        token["organization_id"] = str(user_obj.organization_id) if user_obj.organization_id else None
        token["full_name"] = user_obj.full_name
        return token

    def validate(self, attrs: Dict[str, Any]) -> Dict[str, Any]:
        email_key = self.username_field
        if email_key in attrs and isinstance(attrs[email_key], str):
            attrs[email_key] = attrs[email_key].lower().strip()
        try:
            data = super().validate(attrs)
        except AuthenticationFailed as err:
            raise AuthenticationFailed(_("Invalid email or password")) from err
        data["user"] = cast(Any, UserDetailSerializer(self.user, context=self.context).data)
        return data


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True)
    new_password_confirm = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs: Dict[str, Any]) -> Dict[str, Any]:
        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError({"new_password_confirm": "New passwords do not match."})
        user = self.context["request"].user
        if not user.check_password(attrs["old_password"]):
            raise serializers.ValidationError({"old_password": "Old password is incorrect."})
        validate_password(attrs["new_password"], user=user)
        return attrs


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)


class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, write_only=True)
    new_password_confirm = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs: Dict[str, Any]) -> Dict[str, Any]:
        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError({"new_password_confirm": "Passwords do not match."})
        try:
            reset_token = PasswordResetToken.objects.select_related("user").get(token=hash_lifecycle_token(attrs["token"]))
        except PasswordResetToken.DoesNotExist:
            raise serializers.ValidationError({"token": "Invalid or expired reset token."}) from None
        if not reset_token.is_valid:
            raise serializers.ValidationError({"token": "Invalid or expired reset token."})
        try:
            validate_password(attrs["new_password"], user=reset_token.user)
        except DjangoValidationError as err:
            raise serializers.ValidationError({"new_password": list(err.messages)}) from err
        attrs["user"] = reset_token.user
        attrs["reset_token_obj"] = reset_token
        return attrs


class OrganizationInvitationSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrganizationInvitation
        fields = ["id", "email", "organization", "role", "status", "created_at", "expires_at", "accepted_at"]
        read_only_fields = ["id", "organization", "status", "created_at", "expires_at", "accepted_at"]


class InvitationAcceptSerializer(serializers.Serializer):
    token = serializers.CharField(required=True)

    def validate(self, attrs: Dict[str, Any]) -> Dict[str, Any]:
        try:
            invitation = OrganizationInvitation.objects.get(token=hash_lifecycle_token(attrs["token"]), status=InvitationStatus.PENDING)
        except OrganizationInvitation.DoesNotExist:
            raise serializers.ValidationError({"token": "Invalid or expired invitation."}) from None
        if invitation.expires_at < timezone.now():
            raise serializers.ValidationError({"token": "Invitation has expired."})
        attrs["invitation"] = invitation
        return attrs
