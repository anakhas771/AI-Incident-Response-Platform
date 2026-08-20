import logging
from typing import Any

from django.core.management.base import BaseCommand
from django.utils.text import slugify

from apps.accounts.models import Organization, Role, User

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Creates or updates the default enterprise demo account idempotently."

    def handle(self, *args: Any, **options: Any) -> None:
        org_name = "Demo Security Operations"
        org_slug = slugify(org_name)

        organization, created_org = Organization.objects.get_or_create(
            slug=org_slug,
            defaults={
                "name": org_name,
                "description": "Default Enterprise Incident Command Workspace",
                "is_active": True,
            },
        )
        if created_org:
            self.stdout.write(
                self.style.SUCCESS(f"Created Demo Organization: '{org_name}'")
            )

        demo_email = "demo@incident.ai"
        demo_password = "Demo@123456"

        user = User.objects.filter(email=demo_email).first()
        if user:
            user.first_name = "Demo"
            user.last_name = "Admin"
            user.role = Role.ADMIN
            user.organization = organization
            user.is_active = True
            user.set_password(demo_password)
            user.save()
            self.stdout.write(
                self.style.SUCCESS(
                    f"Successfully updated demo user credentials for: {demo_email}"
                )
            )
        else:
            User.objects.create_user(
                email=demo_email,
                password=demo_password,
                first_name="Demo",
                last_name="Admin",
                role=Role.ADMIN,
                organization=organization,
                is_active=True,
            )
            self.stdout.write(
                self.style.SUCCESS(
                    f"Successfully created demo user account for: {demo_email}"
                )
            )
