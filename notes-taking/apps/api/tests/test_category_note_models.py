"""Step 2 — Category + Note models, managers, preview_text, palette."""

import pytest
from django.contrib.auth import get_user_model
from django.db import IntegrityError

from categories.models import CATEGORY_PALETTE, Category
from notes.models import Note, strip_markdown

User = get_user_model()


@pytest.fixture
def user_a(db):
    return User.objects.create_user(email="a@example.com", password="pass-12345")


@pytest.fixture
def user_b(db):
    return User.objects.create_user(email="b@example.com", password="pass-12345")


@pytest.mark.django_db
class TestCategoryModel:
    def test_palette_has_exactly_four_colours(self):
        assert CATEGORY_PALETTE == ("#EF9C66", "#FCDC94", "#C8CFA0", "#78ABA8")

    def test_unique_name_per_user(self, user_a):
        Category.objects.create(user=user_a, name="School", color="#EF9C66")
        with pytest.raises(IntegrityError):
            Category.objects.create(user=user_a, name="School", color="#FCDC94")

    def test_same_name_allowed_for_different_users(self, user_a, user_b):
        Category.objects.create(user=user_a, name="School", color="#EF9C66")
        other = Category.objects.create(user=user_b, name="School", color="#FCDC94")
        assert other.pk is not None

    def test_for_user_scopes_queryset(self, user_a, user_b):
        Category.objects.create(user=user_a, name="Mine", color="#EF9C66")
        Category.objects.create(user=user_b, name="Theirs", color="#FCDC94")
        assert list(Category.objects.for_user(user_a).values_list("name", flat=True)) == [
            "Mine"
        ]

    def test_next_color_picks_least_used(self, user_a):
        Category.objects.create(user=user_a, name="One", color="#EF9C66")
        Category.objects.create(user=user_a, name="Two", color="#FCDC94")
        Category.objects.create(user=user_a, name="Three", color="#C8CFA0")
        assert Category.next_color_for_user(user_a) == "#78ABA8"

    def test_next_color_ties_break_by_palette_order(self, user_a):
        assert Category.next_color_for_user(user_a) == "#EF9C66"


@pytest.mark.django_db
class TestNoteModel:
    def test_preview_text_stripped_and_capped_on_save(self, user_a):
        long_md = "# Hello\n\n" + ("word " * 200) + "\n\n**bold**"
        note = Note.objects.create(user=user_a, title="T", content=long_md)
        assert "**" not in note.preview_text
        assert "#" not in note.preview_text
        assert len(note.preview_text) <= 400
        assert note.preview_text.startswith("Hello")

    def test_for_user_scopes_queryset(self, user_a, user_b):
        Note.objects.create(user=user_a, title="A")
        Note.objects.create(user=user_b, title="B")
        assert list(Note.objects.for_user(user_a).values_list("title", flat=True)) == ["A"]

    def test_category_delete_nulls_fk_not_notes(self, user_a):
        cat = Category.objects.create(user=user_a, name="Drama", color="#78ABA8")
        note = Note.objects.create(user=user_a, title="Keep me", category=cat)
        cat.delete()
        note.refresh_from_db()
        assert Note.objects.filter(pk=note.pk).exists()
        assert note.category_id is None


class TestStripMarkdown:
    def test_empty(self):
        assert strip_markdown("") == ""

    def test_links_and_emphasis(self):
        assert strip_markdown("[click](https://x.com) and **bold**") == "click and bold"
