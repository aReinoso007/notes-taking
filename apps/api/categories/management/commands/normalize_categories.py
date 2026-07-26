from __future__ import annotations

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from categories.services import normalize_user_categories


class Command(BaseCommand):
    help = (
        "Rename Drama/Drame → Random Thoughts and set seed category colours "
        "(Random Thoughts #EF9C66, Personal #78ABA8, School #FCDC94)."
    )

    def handle(self, *args, **options):
        User = get_user_model()
        totals = {"renamed": 0, "merged": 0, "recolored": 0, "reordered": 0}
        for user in User.objects.all().iterator():
            stats = normalize_user_categories(user)
            for key in totals:
                totals[key] += stats[key]

        self.stdout.write(
            self.style.SUCCESS(
                "Normalized categories — "
                f"renamed={totals['renamed']} merged={totals['merged']} "
                f"recolored={totals['recolored']} reordered={totals['reordered']}"
            )
        )
