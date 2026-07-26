import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user_a(db):
    return User.objects.create_user(email="a@example.com", password="pass-12345")


@pytest.fixture
def user_b(db):
    return User.objects.create_user(email="b@example.com", password="pass-12345")


@pytest.fixture
def auth_client_a(user_a):
    client = APIClient()
    token = RefreshToken.for_user(user_a)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")
    return client


@pytest.fixture
def auth_client_b(user_b):
    client = APIClient()
    token = RefreshToken.for_user(user_b)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")
    return client
