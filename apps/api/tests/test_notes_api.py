"""Step 4 — notes API, pagination, cross-user isolation."""

import pytest

from categories.models import Category
from notes.models import Note

URL = "/api/v1/notes/"


@pytest.mark.django_db
class TestNotesAPI:
    def test_create_and_retrieve(self, auth_client_a, user_a):
        cat = Category.objects.create(user=user_a, name="School", color="#EF9C66")
        created = auth_client_a.post(
            URL,
            {
                "title": "Essay",
                "content": "# Draft\n\nHello **world**",
                "category": cat.id,
            },
            format="json",
        )
        assert created.status_code == 201
        body = created.json()
        assert body["title"] == "Essay"
        assert "content" in body
        assert body["preview_text"]
        assert body["category"]["id"] == cat.id

        detail = auth_client_a.get(f"{URL}{body['id']}/")
        assert detail.status_code == 200
        assert detail.json()["content"] == "# Draft\n\nHello **world**"

    def test_list_returns_preview_not_content(self, auth_client_a, user_a):
        Note.objects.create(
            user=user_a,
            title="Card",
            content="# Secret full body",
        )
        response = auth_client_a.get(URL)
        assert response.status_code == 200
        results = response.json()["results"]
        assert len(results) == 1
        assert "preview_text" in results[0]
        assert "content" not in results[0]

    def test_filter_by_category(self, auth_client_a, user_a):
        cat = Category.objects.create(user=user_a, name="Drama", color="#78ABA8")
        Note.objects.create(user=user_a, title="In", category=cat)
        Note.objects.create(user=user_a, title="Out")
        response = auth_client_a.get(URL, {"category": cat.id})
        titles = [n["title"] for n in response.json()["results"]]
        assert titles == ["In"]

    def test_patch_updates(self, auth_client_a, user_a):
        note = Note.objects.create(user=user_a, title="Old", content="a")
        response = auth_client_a.patch(
            f"{URL}{note.id}/",
            {"title": "New", "content": "## Updated"},
            format="json",
        )
        assert response.status_code == 200
        assert response.json()["title"] == "New"
        assert "Updated" in response.json()["preview_text"]

    def test_delete(self, auth_client_a, user_a):
        note = Note.objects.create(user=user_a, title="Bye")
        assert auth_client_a.delete(f"{URL}{note.id}/").status_code == 204
        assert not Note.objects.filter(pk=note.pk).exists()

    def test_user_a_gets_404_on_user_b_note(self, auth_client_a, user_b):
        note = Note.objects.create(user=user_b, title="Private")
        assert auth_client_a.get(f"{URL}{note.id}/").status_code == 404
        assert auth_client_a.patch(
            f"{URL}{note.id}/", {"title": "Hack"}, format="json"
        ).status_code == 404
        assert auth_client_a.delete(f"{URL}{note.id}/").status_code == 404

    def test_cannot_assign_other_users_category(self, auth_client_a, user_b):
        foreign = Category.objects.create(user=user_b, name="Nope", color="#EF9C66")
        response = auth_client_a.post(
            URL,
            {"title": "x", "category": foreign.id},
            format="json",
        )
        assert response.status_code == 400

    def test_cursor_pagination(self, auth_client_a, user_a):
        for i in range(25):
            Note.objects.create(user=user_a, title=f"N{i}")
        first = auth_client_a.get(URL)
        assert first.status_code == 200
        assert len(first.json()["results"]) == 20
        assert first.json()["next"] is not None
