#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""

import os
import sys
from pathlib import Path
import dotenv


def main():
    """Run administrative tasks."""
    # Load environment variables from .env file if available
    base_dir = Path(__file__).resolve().parent
    env_file = base_dir / ".env"
    if env_file.exists():
        dotenv.load_dotenv(env_file)

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
