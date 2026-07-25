from __future__ import annotations

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from categories.models import Category
from notes.models import Note

DEMO_EMAIL = "demo@notes.local"
DEMO_PASSWORD = "demo-pass-1234"

# Deterministic palette pairing for a reliable demo grid.
DEMO_CATEGORIES = (
    ("Random Thoughts", "#EF9C66"),
    ("School", "#FCDC94"),
    ("Personal", "#78ABA8"),
)

DEMO_NOTES = (
    {
        "title": "A Deep and Contemplative Personal Reflection",
        "category": "Random Thoughts",
        "content": (
            "Life has been a whirlwind of events and emotions lately.\n\n"
            "I'm learning to sit with the quiet moments — the ones between "
            "meetings and messages — and actually *notice* them.\n\n"
            "## Tiny wins\n\n"
            "- Made tea without doomscrolling\n"
            "- Wrote three honest sentences\n"
            "- Called it a day before midnight\n"
        ),
        "days_ago": 0,
    },
    {
        "title": "Study plan for finals week",
        "category": "School",
        "content": (
            "### Monday\n\nReview chapter notes.\n\n"
            "### Tuesday\n\nPractice problems — timed.\n\n"
            "Remember: **sleep is also studying.**\n"
        ),
        "days_ago": 1,
    },
    {
        "title": "Grocery list (sort of)",
        "category": "Personal",
        "content": (
            "- Oat milk\n"
            "- Bread\n"
            "- Something green\n"
            "- Boba pearls (obviously)\n"
        ),
        "days_ago": 4,
    },
    {
        "title": "Untitled thoughts",
        "category": "Random Thoughts",
        "content": (
            "Pouring this out before it evaporates:\n\n"
            "> Curiosity is a better compass than certainty.\n"
        ),
        "days_ago": 16,
    },
    {
        "title": "No category on purpose",
        "category": None,
        "content": "This one stays uncategorised so the muted card tint shows up.",
        "days_ago": 2,
    },
)


class Command(BaseCommand):
    help = (
        "Create (or reset) a demo user with sample categories and notes "
        f"({DEMO_EMAIL} / {DEMO_PASSWORD})."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--email",
            default=DEMO_EMAIL,
            help=f"Demo account email (default: {DEMO_EMAIL})",
        )
        parser.add_argument(
            "--password",
            default=DEMO_PASSWORD,
            help="Demo account password",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        User = get_user_model()
        email = options["email"]
        password = options["password"]

        user = User.objects.filter(email=email).first()
        created = user is None
        if user is None:
            user = User.objects.create_user(email=email, password=password)
        else:
            user.set_password(password)
            user.save(update_fields=["password"])

        # Reset demo content so re-runs are predictable.
        Note.objects.for_user(user).delete()
        Category.objects.for_user(user).delete()

        categories = {
            name: Category.objects.create(user=user, name=name, color=color)
            for name, color in DEMO_CATEGORIES
        }

        now = timezone.now()
        for spec in DEMO_NOTES:
            cat_name = spec["category"]
            note = Note(
                user=user,
                category=categories[cat_name] if cat_name else None,
                title=spec["title"],
                content=spec["content"],
            )
            note.save()
            # Backdate updated_at for relative card dates in the demo.
            Note.objects.filter(pk=note.pk).update(
                updated_at=now - timezone.timedelta(days=spec["days_ago"]),
                created_at=now - timezone.timedelta(days=spec["days_ago"] + 1),
            )

        action = "Created" if created else "Reset"
        self.stdout.write(
            self.style.SUCCESS(
                f"{action} demo user {email} with "
                f"{len(categories)} categories and {len(DEMO_NOTES)} notes."
            )
        )
        self.stdout.write(f"  Login: {email} / {password}")
