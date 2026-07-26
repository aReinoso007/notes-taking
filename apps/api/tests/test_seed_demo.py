"""Step 9 — demo seed management command."""

import pytest
from django.contrib.auth import get_user_model
from django.core.management import call_command

from categories.models import Category
from notes.models import Note

User = get_user_model()

DEMO_EMAIL = "demo@notes.local"


@pytest.mark.django_db
class TestSeedDemo:
    def test_seed_demo_creates_user_categories_and_notes(self):
        call_command("seed_demo")

        user = User.objects.get(email=DEMO_EMAIL)
        assert user.check_password("demo-pass-1234")
        assert Category.objects.for_user(user).count() == 3
        assert Note.objects.for_user(user).count() == 5
        assert Note.objects.for_user(user).filter(category__isnull=True).count() == 1

    def test_seed_demo_is_idempotent(self):
        call_command("seed_demo")
        call_command("seed_demo")

        user = User.objects.get(email=DEMO_EMAIL)
        assert User.objects.filter(email=DEMO_EMAIL).count() == 1
        assert Category.objects.for_user(user).count() == 3
        assert Note.objects.for_user(user).count() == 5
