"""
Service encapsulating SHA-256 file hashing and org-scoped duplicate detection
for the Enterprise RAG Knowledge Base.

Keeping this logic in a service (rather than inlining it in the view or
calling the utility directly) means:
- The view stays thin — no hashing details leak into HTTP handlers.
- Business rules (e.g. switching to BLAKE3, ignoring duplicates for admins)
  can be changed in one place.
- The service is independently unit-testable without spinning up a view.
"""

import logging
from typing import IO

from apps.knowledge.models import KnowledgeDocument
from apps.knowledge.utils.file_hash import calculate_file_hash

logger = logging.getLogger(__name__)


class FileHashService:
    """
    Stateless service providing SHA-256 based file hashing and
    organisation-scoped duplicate document detection.
    """

    @staticmethod
    def hash_file(file_obj: IO[bytes]) -> str:
        """
        Compute the SHA-256 hex digest of an uploaded file.

        Delegates to the utility function which handles pointer reset
        before and after reading so Django's storage backend can still
        write the file to disk normally.

        Args:
            file_obj: Any file-like object (InMemoryUploadedFile,
                      TemporaryUploadedFile, etc.)

        Returns:
            64-character lowercase hex string.
        """
        digest = calculate_file_hash(file_obj)
        logger.debug("Computed file hash: %s…", digest[:12])
        return digest

    @staticmethod
    def is_duplicate(file_hash: str, organization) -> bool:
        """
        Return True if a document with the given hash already exists
        within the organisation.

        Args:
            file_hash:    64-char SHA-256 hex string.
            organization: Organisation model instance (multi-tenant isolation).

        Returns:
            True  → duplicate exists, upload should be rejected.
            False → hash is new for this organisation.
        """
        exists = KnowledgeDocument.objects.filter(
            organization=organization,
            file_hash=file_hash,
        ).exists()

        if exists:
            logger.info(
                "Duplicate document detected (hash=%s…) for organisation %s",
                file_hash[:12],
                organization.id,
            )

        return exists

    @classmethod
    def check_and_hash(cls, file_obj: IO[bytes], organization) -> tuple[str, bool]:
        """
        Convenience method: hash the file and check for duplicates in one call.

        Args:
            file_obj:     Uploaded file-like object.
            organization: Organisation instance for tenant-scoped lookup.

        Returns:
            (file_hash, is_duplicate) tuple.
        """
        file_hash = cls.hash_file(file_obj)
        duplicate = cls.is_duplicate(file_hash, organization)
        return file_hash, duplicate
