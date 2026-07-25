"""Test settings — Postgres when available, else SQLite for local/CI unit speed."""

import os

from .base import *  # noqa: F401, F403

DEBUG = False

PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

if os.environ.get("POSTGRES_HOST"):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.environ.get("POSTGRES_DB", "notes_test"),
            "USER": os.environ.get("POSTGRES_USER", "notes"),
            "PASSWORD": os.environ.get("POSTGRES_PASSWORD", "notes"),
            "HOST": os.environ.get("POSTGRES_HOST"),
            "PORT": os.environ.get("POSTGRES_PORT", "5432"),
        }
    }
else:
    # CI / local unit tests without Compose may use SQLite for the empty suite.
    # Runtime (Compose) always uses Postgres — see docker-compose.yml.
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": ":memory:",
        }
    }
