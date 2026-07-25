from __future__ import annotations

import re

from django.conf import settings
from django.db import models

PREVIEW_MAX_LENGTH = 400


def strip_markdown(text: str, max_length: int = PREVIEW_MAX_LENGTH) -> str:
    """Derive plain preview text from raw markdown, capped at max_length."""
    if not text:
        return ""
    s = text
    s = re.sub(r"```[\s\S]*?```", " ", s)
    s = re.sub(r"`[^`]*`", " ", s)
    s = re.sub(r"!\[([^\]]*)\]\([^)]+\)", r"\1", s)
    s = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", s)
    s = re.sub(r"^#{1,6}\s+", "", s, flags=re.MULTILINE)
    s = re.sub(r"^[\s>*+-]+", "", s, flags=re.MULTILINE)
    s = re.sub(r"[*_~]+", "", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s[:max_length]


class NoteQuerySet(models.QuerySet):
    def for_user(self, user):
        return self.filter(user=user)


class NoteManager(models.Manager):
    def get_queryset(self):
        return NoteQuerySet(self.model, using=self._db)

    def for_user(self, user):
        return self.get_queryset().for_user(user)


class Note(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notes",
    )
    category = models.ForeignKey(
        "categories.Category",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notes",
    )
    title = models.CharField(max_length=255, blank=True)
    content = models.TextField(blank=True)
    preview_text = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = NoteManager()

    class Meta:
        ordering = ["-updated_at"]
        indexes = [
            models.Index(fields=["user", "-updated_at"]),
        ]

    def __str__(self) -> str:
        return self.title or f"Note {self.pk}"

    def save(self, *args, **kwargs):
        self.preview_text = strip_markdown(self.content)
        super().save(*args, **kwargs)
