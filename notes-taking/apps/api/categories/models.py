from __future__ import annotations

from django.conf import settings
from django.db import models
from django.db.models import Case, Count, IntegerField, Value, When


CATEGORY_PALETTE = ("#EF9C66", "#FCDC94", "#C8CFA0", "#78ABA8")
SEED_CATEGORY_NAMES = ("Random Thoughts", "School", "Personal")
# Fixed colours for signup-seeded categories (palette still used for later creates).
SEED_CATEGORY_COLORS = {
    "Random Thoughts": "#EF9C66",
    "School": "#FCDC94",
    "Personal": "#78ABA8",
}


class CategoryQuerySet(models.QuerySet):
    def for_user(self, user):
        return self.filter(user=user)

    def with_note_counts(self):
        return self.annotate(note_count=Count("notes", distinct=True))

    def in_display_order(self):
        """Random Thoughts → School → Personal, then any others by created_at."""
        whens = [
            When(name=name, then=Value(index))
            for index, name in enumerate(SEED_CATEGORY_NAMES)
        ]
        return self.annotate(
            _display_order=Case(
                *whens,
                default=Value(len(SEED_CATEGORY_NAMES)),
                output_field=IntegerField(),
            )
        ).order_by("_display_order", "created_at", "id")


class CategoryManager(models.Manager):
    def get_queryset(self):
        return CategoryQuerySet(self.model, using=self._db)

    def for_user(self, user):
        return self.get_queryset().for_user(user)


class Category(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="categories",
    )
    name = models.CharField(max_length=60)
    color = models.CharField(max_length=7)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = CategoryManager()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "name"],
                name="uniq_category_name_per_user",
            )
        ]
        ordering = ["created_at"]

    def __str__(self) -> str:
        return self.name

    @classmethod
    def next_color_for_user(cls, user) -> str:
        """Assign the least-used palette colour (deterministic, maximises variety)."""
        counts = {color: 0 for color in CATEGORY_PALETTE}
        for color in cls.objects.for_user(user).values_list("color", flat=True):
            if color in counts:
                counts[color] += 1
        return min(CATEGORY_PALETTE, key=lambda c: (counts[c], CATEGORY_PALETTE.index(c)))
