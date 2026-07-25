"""Normalize Drama → Random Thoughts and fixed seed colours."""

import pytest
from django.core.management import call_command

from categories.models import Category
from notes.models import Note


@pytest.mark.django_db
class TestNormalizeCategories:
    def test_renames_drama_and_sets_colours(self, user_a):
        Category.objects.create(user=user_a, name="Drama", color="#C8CFA0")
        Category.objects.create(user=user_a, name="Personal", color="#EF9C66")
        Category.objects.create(user=user_a, name="School", color="#FCDC94")

        call_command("normalize_categories")

        cats = {c.name: c.color for c in Category.objects.for_user(user_a)}
        assert "Drama" not in cats
        assert cats["Random Thoughts"] == "#EF9C66"
        assert cats["Personal"] == "#78ABA8"
        assert cats["School"] == "#FCDC94"

    def test_merges_drama_into_existing_random_thoughts(self, user_a):
        rt = Category.objects.create(
            user=user_a, name="Random Thoughts", color="#FCDC94"
        )
        drama = Category.objects.create(user=user_a, name="Drama", color="#C8CFA0")
        Note.objects.create(user=user_a, category=drama, title="x", content="y")

        call_command("normalize_categories")

        assert not Category.objects.for_user(user_a).filter(name="Drama").exists()
        assert Note.objects.for_user(user_a).get().category_id == rt.id
        assert (
            Category.objects.for_user(user_a).get(name="Random Thoughts").color
            == "#EF9C66"
        )
