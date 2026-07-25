"""Step 1 — custom User model behaviour."""

import pytest
from django.contrib.auth import get_user_model
from django.db import IntegrityError

User = get_user_model()


@pytest.mark.django_db
class TestUserModel:
    def test_username_field_is_email(self):
        assert User.USERNAME_FIELD == "email"
        assert User.REQUIRED_FIELDS == []

    def test_create_user_with_email_and_password(self):
        user = User.objects.create_user(
            email="alex@example.com",
            password="secure-pass-123",
        )
        assert user.email == "alex@example.com"
        assert user.check_password("secure-pass-123")
        assert user.is_active is True
        assert user.is_staff is False
        assert user.is_superuser is False

    def test_email_is_normalized(self):
        user = User.objects.create_user(
            email="Alex@Example.COM",
            password="secure-pass-123",
        )
        assert user.email == "Alex@example.com"

    def test_create_user_requires_email(self):
        with pytest.raises(ValueError, match="email"):
            User.objects.create_user(email="", password="secure-pass-123")

    def test_email_must_be_unique(self):
        User.objects.create_user(email="dup@example.com", password="secure-pass-123")
        with pytest.raises(IntegrityError):
            User.objects.create_user(email="dup@example.com", password="other-pass-123")

    def test_create_superuser(self):
        user = User.objects.create_superuser(
            email="admin@example.com",
            password="secure-pass-123",
        )
        assert user.is_staff is True
        assert user.is_superuser is True

    def test_str_returns_email(self):
        user = User.objects.create_user(
            email="str@example.com",
            password="secure-pass-123",
        )
        assert str(user) == "str@example.com"
