"""Step 4 — categories API, annotated counts, no N+1."""

import pytest

from categories.models import Category
from notes.models import Note

URL = "/api/v1/categories/"


@pytest.mark.django_db
class TestCategoriesAPI:
    def test_list_returns_annotated_counts(self, auth_client_a, user_a):
        cat = Category.objects.create(user=user_a, name="School", color="#EF9C66")
        Note.objects.create(user=user_a, title="n1", category=cat)
        Note.objects.create(user=user_a, title="n2", category=cat)
        Note.objects.create(user=user_a, title="orphan")

        response = auth_client_a.get(URL)
        assert response.status_code == 200
        body = response.json()
        assert len(body) == 1
        assert body[0]["name"] == "School"
        assert body[0]["note_count"] == 2
        assert body[0]["color"] == "#EF9C66"

    def test_list_is_user_scoped(self, auth_client_a, user_a, user_b):
        Category.objects.create(user=user_a, name="Mine", color="#EF9C66")
        Category.objects.create(user=user_b, name="Theirs", color="#FCDC94")
        names = [c["name"] for c in auth_client_a.get(URL).json()]
        assert names == ["Mine"]

    def test_list_orders_seed_categories_first(self, auth_client_a, user_a):
        Category.objects.create(user=user_a, name="Personal", color="#78ABA8")
        Category.objects.create(user=user_a, name="School", color="#FCDC94")
        Category.objects.create(user=user_a, name="Random Thoughts", color="#EF9C66")
        Category.objects.create(user=user_a, name="Extra", color="#C8CFA0")

        names = [c["name"] for c in auth_client_a.get(URL).json()]
        assert names[:3] == ["Random Thoughts", "School", "Personal"]
        assert names[-1] == "Extra"

    def test_create_assigns_least_used_color(self, auth_client_a, user_a):
        Category.objects.create(user=user_a, name="One", color="#EF9C66")
        Category.objects.create(user=user_a, name="Two", color="#FCDC94")
        Category.objects.create(user=user_a, name="Three", color="#C8CFA0")
        response = auth_client_a.post(URL, {"name": "Four"}, format="json")
        assert response.status_code == 201
        assert response.json()["color"] == "#78ABA8"

    def test_create_accepts_any_hex_color(self, auth_client_a):
        response = auth_client_a.post(
            URL,
            {"name": "Custom", "color": "#3d8b6e"},
            format="json",
        )
        assert response.status_code == 201
        assert response.json()["name"] == "Custom"
        assert response.json()["color"] == "#3D8B6E"

    def test_create_rejects_invalid_and_blocked_colors(self, auth_client_a):
        bad = auth_client_a.post(
            URL, {"name": "Nope", "color": "orange"}, format="json"
        )
        assert bad.status_code == 400
        blocked = auth_client_a.post(
            URL, {"name": "Nope", "color": "#9747FF"}, format="json"
        )
        assert blocked.status_code == 400

    def test_patch_rename(self, auth_client_a, user_a):
        cat = Category.objects.create(user=user_a, name="Old", color="#EF9C66")
        response = auth_client_a.patch(
            f"{URL}{cat.id}/", {"name": "New"}, format="json"
        )
        assert response.status_code == 200
        assert response.json()["name"] == "New"

    def test_delete_nulls_notes(self, auth_client_a, user_a):
        cat = Category.objects.create(user=user_a, name="Gone", color="#EF9C66")
        note = Note.objects.create(user=user_a, title="Keep", category=cat)
        response = auth_client_a.delete(f"{URL}{cat.id}/")
        assert response.status_code == 204
        note.refresh_from_db()
        assert note.category_id is None

    def test_user_a_cannot_delete_user_b_category(self, auth_client_a, user_b):
        cat = Category.objects.create(user=user_b, name="Secret", color="#EF9C66")
        assert auth_client_a.delete(f"{URL}{cat.id}/").status_code == 404

    def test_list_note_counts_query_budget(
        self, auth_client_a, user_a, django_assert_num_queries
    ):
        cats = [
            Category.objects.create(
                user=user_a, name=f"C{i}", color="#EF9C66"
            )
            for i in range(5)
        ]
        for cat in cats:
            for j in range(3):
                Note.objects.create(user=user_a, title=f"{cat.name}-{j}", category=cat)

        # Auth + annotated list should not N+1 per category.
        with django_assert_num_queries(2):
            response = auth_client_a.get(URL)
            assert response.status_code == 200
            assert len(response.json()) == 5
