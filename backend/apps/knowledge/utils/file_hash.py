"""
Utility for generating SHA-256 file hashes to power duplicate document detection.
"""

import hashlib
from typing import IO


def calculate_file_hash(file_obj: IO[bytes], chunk_size: int = 8192) -> str:
    """
    Stream a file object in chunks and return its SHA-256 hex digest.

    Resets the file pointer to the beginning both before reading and after
    hashing so downstream code (e.g. Django storage backends) can still read
    the file normally.

    Args:
        file_obj:   Any file-like object supporting .read() and .seek().
        chunk_size: Number of bytes per read iteration (default 8 KB).

    Returns:
        64-character lowercase SHA-256 hex string.
    """
    sha256 = hashlib.sha256()

    # Ensure we read from the start regardless of current pointer position.
    file_obj.seek(0)

    while True:
        chunk = file_obj.read(chunk_size)
        if not chunk:
            break
        sha256.update(chunk)

    # Reset pointer so Django storage can write the file to disk normally.
    file_obj.seek(0)

    return sha256.hexdigest()
