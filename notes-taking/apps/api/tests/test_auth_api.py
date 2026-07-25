"""Step 3 — signup / login / refresh / logout + category seeding."""

import pytest
from django.contrib.auth import get_user_model

from categories.models import CATEGORY_PALETTE, Category

User = get_user_model()

SIGNUP_URL = "/api/v1/auth/signup/"
LOGIN_URL = "/api/v1/auth/login/"
LOGOUT_URL = "/api/v1/auth/logout/"
ME_URL = "/api/v1/auth/me/"
REFRESH_URL = "/api/v1/auth/refresh/"


@pytest.mark.django_db
class TestAuthAPI:
    def test_signup_creates_user_and_returns_tokens(self, api_client):
        response = api_client.post(
            SIGNUP_URL,
            {"email": "new@example.com", "password": "securepass1"},
            format="json",
        )
        assert response.status_code == 201
        body = response.json()
        assert body["user"]["email"] == "new@example.com"
        assert "access" in body and "refresh" in body
        assert User.objects.filter(email="new@example.com").exists()

    def test_signup_seeds_exactly_three_distinct_categories(self, api_client):
        response = api_client.post(
            SIGNUP_URL,
            {"email": "seed@example.com", "password": "securepass1"},
            format="json",
        )
        assert response.status_code == 201
        user = User.objects.get(email="seed@example.com")
        cats = {c.name: c.color for c in Category.objects.for_user(user)}
        assert cats == {
            "Random Thoughts": "#EF9C66",
            "School": "#FCDC94",
            "Personal": "#78ABA8",
        }
        assert set(cats.values()).issubset(set(CATEGORY_PALETTE))

    def test_signup_duplicate_email(self, api_client, user_a):
        response = api_client.post(
            SIGNUP_URL,
            {"email": "a@example.com", "password": "securepass1"},
            format="json",
        )
        assert response.status_code == 400

    def test_signup_invalid_email(self, api_client):
        response = api_client.post(
            SIGNUP_URL,
            {"email": "not-an-email", "password": "securepass1"},
            format="json",
        )
        assert response.status_code == 400

    def test_signup_weak_password_rejected(self, api_client):
        response = api_client.post(
            SIGNUP_URL,
            {"email": "weak@example.com", "password": "short"},
            format="json",
        )
        assert response.status_code == 400

    def test_login_valid(self, api_client, user_a):
        response = api_client.post(
            LOGIN_URL,
            {"email": "a@example.com", "password": "pass-12345"},
            format="json",
        )
        assert response.status_code == 200
        assert response.json()["user"]["email"] == "a@example.com"
        assert "access" in response.json()

    def test_login_invalid_credentials(self, api_client, user_a):
        response = api_client.post(
            LOGIN_URL,
            {"email": "a@example.com", "password": "wrong-password"},
            format="json",
        )
        assert response.status_code == 400

    def test_me_requires_auth(self, api_client):
        assert api_client.get(ME_URL).status_code == 401

    def test_me_returns_user(self, auth_client_a, user_a):
        response = auth_client_a.get(ME_URL)
        assert response.status_code == 200
        assert response.json()["user"]["email"] == user_a.email

    def test_refresh_and_logout(self, api_client, user_a):
        login = api_client.post(
            LOGIN_URL,
            {"email": "a@example.com", "password": "pass-12345"},
            format="json",
        )
        refresh = login.json()["refresh"]
        refreshed = api_client.post(REFRESH_URL, {"refresh": refresh}, format="json")
        assert refreshed.status_code == 200
        assert "access" in refreshed.json()

        # After rotation, original refresh may be blacklisted; use new refresh if present
        new_refresh = refreshed.json().get("refresh", refresh)
        api_client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {login.json()['access']}"
        )
        logout = api_client.post(LOGOUT_URL, {"refresh": new_refresh}, format="json")
        assert logout.status_code == 204

        reuse = api_client.post(REFRESH_URL, {"refresh": new_refresh}, format="json")
        assert reuse.status_code == 401
