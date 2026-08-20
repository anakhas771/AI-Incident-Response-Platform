import logging

from django.core.management.base import BaseCommand

from apps.accounts.models import User
from apps.knowledge.models import ChatSession

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Assigns orphan/admin-owned ChatSession records to a specific development admin user."

    def add_arguments(self, parser):
        parser.add_argument(
            "--email",
            type=str,
            default="demo@incident.ai",
            help="The email of the user to assign the sessions to.",
        )

    def handle(self, *args, **options):
        email = options["email"]
        try:
            target_user = User.objects.get(email=email)
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f"User with email {email} does not exist.")
            )
            return

        # Find sessions that do not belong to the target user
        sessions = ChatSession.objects.exclude(user=target_user)
        count = sessions.count()

        if count == 0:
            self.stdout.write(
                self.style.SUCCESS("No orphan or incorrectly assigned sessions found.")
            )
            return

        for session in sessions:
            session.user = target_user
            session.organization = target_user.organization
            session.save(update_fields=["user", "organization"])

        self.stdout.write(
            self.style.SUCCESS(f"Successfully reassigned {count} sessions to {email}.")
        )
