from typing import Any, Dict

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.utils.text import slugify
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Organization, User

UserModel = get_user_model()


class OrganizationSerializer(serializers.ModelSerializer):
    """
    Serializer for Enterprise Organization management.
    """

    class Meta:
        model = Organization
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "slug", "created_at", "updated_at"]

    def create(self, validated_data: Dict[str, Any]) -> Organization:
        name = validated_data.get("name", "")
        slug = slugify(name)
        # Ensure unique slug
        base_slug = slug
        counter = 1
        while Organization.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
        validated_data["slug"] = slug
        return super().create(validated_data)


class UserDetailSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for User profile viewing and management.
    """

    organization = OrganizationSerializer(read_only=True)
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "role",
            "organization",
            "phone_number",
            "is_active",
            "date_joined",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "email",
            "role",
            "date_joined",
            "created_at",
            "updated_at",
        ]


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for public user registration with email, password validation,
    and optional organization setup.
    """

    password = serializers.CharField(
        write_only=True, required=True, style={"input_type": "password"}
    )
    password_confirm = serializers.CharField(
        write_only=True, required=True, style={"input_type": "password"}
    )
    organization_name = serializers.CharField(
        write_only=True, required=False, allow_blank=True
    )
    organization_id = serializers.UUIDField(
        write_only=True, required=False, allow_null=True
    )

    class Meta:
        model = User
        fields = [
            "email",
            "password",
            "password_confirm",
            "first_name",
            "last_name",
            "role",
            "organization_name",
            "organization_id",
            "phone_number",
        ]

    def validate_email(self, value: str) -> str:
        value = value.lower().strip()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                "A user with this email address already exists."
            )
        return value

    def validate(self, attrs: Dict[str, Any]) -> Dict[str, Any]:
        password = attrs.get("password")
        password_confirm = attrs.get("password_confirm")

        if password != password_confirm:
            raise serializers.ValidationError(
                {"password_confirm": "Passwords do not match."}
            )

        # Validate password strength
        user_temp = User(
            email=attrs.get("email"),
            first_name=attrs.get("first_name", ""),
            last_name=attrs.get("last_name", ""),
        )
        validate_password(password, user=user_temp)

        return attrs

    def create(self, validated_data: Dict[str, Any]) -> User:
        validated_data.pop("password_confirm", None)
        password = validated_data.pop("password")
        org_name = validated_data.pop("organization_name", None)
        org_id = validated_data.pop("organization_id", None)

        organization = None
        if org_id:
            try:
                organization = Organization.objects.get(id=org_id)
            except Organization.DoesNotExist as err:
                raise serializers.ValidationError(
                    {"organization_id": "Organization not found."}
                ) from err
        elif org_name:
            slug = slugify(org_name)
            base_slug = slug
            counter = 1
            while Organization.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            organization = Organization.objects.create(name=org_name, slug=slug)

        user = User.objects.create_user(
            password=password, organization=organization, **validated_data
        )
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom SimpleJWT serializer augmenting JWT token with email-based authentication
    and additional payload claims (email, role, organization_id).
    """

    username_field = User.USERNAME_FIELD

    @classmethod
    def get_token(cls, user: User) -> Any:
        token = super().get_token(user)

        # Custom claims embedded in token
        token["email"] = user.email
        token["role"] = user.role
        token["organization_id"] = (
            str(user.organization_id) if user.organization_id else None
        )
        token["full_name"] = user.full_name
        return token

    def validate(self, attrs: Dict[str, Any]) -> Dict[str, Any]:
        data = super().validate(attrs)
        # Append user metadata to login response body
        data["user"] = UserDetailSerializer(self.user).data
        return data


class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer for logged-in user password change.
    """

    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True)
    new_password_confirm = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs: Dict[str, Any]) -> Dict[str, Any]:
        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError(
                {"new_password_confirm": "New passwords do not match."}
            )
        user = self.context["request"].user
        if not user.check_password(attrs["old_password"]):
            raise serializers.ValidationError(
                {"old_password": "Old password is incorrect."}
            )
        validate_password(attrs["new_password"], user=user)
        return attrs
