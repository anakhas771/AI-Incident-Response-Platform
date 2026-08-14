import logging
from typing import Any, Dict

from apps.accounts.models import Organization, User
from apps.logs.models import AuditLog

logger = logging.getLogger("audit")


class AuditLogger:
    @staticmethod
    def log_event(
        action: str,
        organization: Organization | None = None,
        user: User | None = None,
        ip_address: str | None = None,
        metadata: Dict[str, Any] | None = None,
    ) -> None:
        """
        Record a sensitive security event.
        Never log passwords, tokens, or JWTs in metadata.
        """
        if metadata is None:
            metadata = {}

        # Strip any sensitive keys if accidentally passed
        sensitive_keys = ["password", "token", "jwt", "secret"]
        safe_metadata = {
            k: v
            for k, v in metadata.items()
            if not any(s in k.lower() for s in sensitive_keys)
        }

        AuditLog.objects.create(
            action=action,
            organization=organization,
            user=user,
            ip_address=ip_address,
            metadata=safe_metadata,
        )

        org_msg = f"Org: {organization.id}" if organization else "No Org"
        user_msg = f"User: {user.email}" if user else "No User"
        logger.info(f"AUDIT {action} | {org_msg} | {user_msg} | Meta: {safe_metadata}")
