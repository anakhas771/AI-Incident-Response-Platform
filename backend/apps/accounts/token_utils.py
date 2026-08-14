import hashlib


def hash_lifecycle_token(token: str) -> str:
    """Return a deterministic SHA-256 digest for a random lifecycle token."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
