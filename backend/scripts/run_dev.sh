#!/usr/bin/env bash
set -e

echo "Starting Django Development Server with config.settings.development..."
python manage.py migrate --settings=config.settings.development
python manage.py runserver 0.0.0.0:8000 --settings=config.settings.development
