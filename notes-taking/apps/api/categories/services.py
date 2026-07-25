from __future__ import annotations

import random

from django.db import transaction

from categories.models import CATEGORY_PALETTE, SEED_CATEGORY_NAMES, Category


@transaction.atomic
def seed_categories_for_user(user) -> list[Category]:
    """Create 3 seeded categories with distinct palette colours."""
    names = random.sample(list(SEED_CATEGORY_NAMES), 3)
    colors = random.sample(list(CATEGORY_PALETTE), 3)
    return [
        Category.objects.create(user=user, name=name, color=color)
        for name, color in zip(names, colors, strict=True)
    ]


@transaction.atomic
def create_user_with_seed_categories(*, email: str, password: str):
    from django.contrib.auth import get_user_model

    User = get_user_model()
    user = User.objects.create_user(email=email, password=password)
    seed_categories_for_user(user)
    return user
