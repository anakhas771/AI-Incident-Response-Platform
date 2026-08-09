#!/bin/sh
set -e

export DJANGO_SETTINGS_MODULE=config.settings.test

pytest "$@"