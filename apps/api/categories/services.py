from __future__ import annotations

from django.db import transaction

from categories.models import (
    SEED_CATEGORY_COLORS,
    SEED_CATEGORY_NAMES,
    Category,
)


@transaction.atomic
def seed_categories_for_user(user) -> list[Category]:
    """Create the three seeded categories with their fixed palette colours."""
    return [
        Category.objects.create(
            user=user,
            name=name,
            color=SEED_CATEGORY_COLORS[name],
        )
        for name in SEED_CATEGORY_NAMES
    ]


@transaction.atomic
def create_user_with_seed_categories(*, email: str, password: str):
    from django.contrib.auth import get_user_model

    User = get_user_model()
    user = User.objects.create_user(email=email, password=password)
    seed_categories_for_user(user)
    return user


@transaction.atomic
def normalize_user_categories(user) -> dict[str, int]:
    """
    Rename Drama → Random Thoughts (merging if needed), enforce seed colours,
    and stamp created_at so display order is Random Thoughts → School → Personal.
    """
    from django.utils import timezone

    stats = {"renamed": 0, "merged": 0, "recolored": 0, "reordered": 0}

    drama = Category.objects.for_user(user).filter(name__iexact="Drama").first()
    if drama is None:
        drama = Category.objects.for_user(user).filter(name__iexact="Drame").first()

    if drama is not None:
        target = (
            Category.objects.for_user(user)
            .filter(name="Random Thoughts")
            .exclude(pk=drama.pk)
            .first()
        )
        if target is None:
            drama.name = "Random Thoughts"
            drama.color = SEED_CATEGORY_COLORS["Random Thoughts"]
            drama.save(update_fields=["name", "color"])
            stats["renamed"] += 1
        else:
            drama.notes.update(category=target)
            drama.delete()
            stats["merged"] += 1

    for name, color in SEED_CATEGORY_COLORS.items():
        updated = (
            Category.objects.for_user(user)
            .filter(name=name)
            .exclude(color=color)
            .update(color=color)
        )
        stats["recolored"] += updated

    base = timezone.now().replace(microsecond=0)
    for index, name in enumerate(SEED_CATEGORY_NAMES):
        updated = (
            Category.objects.for_user(user)
            .filter(name=name)
            .update(created_at=base.replace(second=index))
        )
        stats["reordered"] += updated

    return stats
