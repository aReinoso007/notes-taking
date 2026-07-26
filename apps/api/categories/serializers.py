import re

from rest_framework import serializers

from .models import Category

# Figma slice annotation — never a category colour.
BLOCKED_COLORS = {"#9747FF"}
HEX_COLOR_RE = re.compile(r"^#([0-9A-Fa-f]{6})$")


def normalize_hex_color(value: str) -> str:
    """Return canonical #RRGGBB or raise ValidationError."""
    raw = value.strip()
    if not raw.startswith("#"):
        raw = f"#{raw}"
    if not HEX_COLOR_RE.match(raw):
        raise serializers.ValidationError("Color must be a hex value like #EF9C66.")
    canonical = raw.upper()
    # Keep letter casing style consistent with existing palette (#EF9C66).
    canonical = "#" + canonical[1:].upper()
    if canonical in BLOCKED_COLORS:
        raise serializers.ValidationError("That colour isn’t allowed.")
    return canonical


class CategorySerializer(serializers.ModelSerializer):
    note_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Category
        fields = ("id", "name", "color", "note_count", "created_at")
        read_only_fields = ("id", "note_count", "created_at")
        extra_kwargs = {
            "color": {"required": False, "allow_null": True},
        }

    def validate_color(self, value: str | None) -> str | None:
        if value is None or value == "":
            return None
        return normalize_hex_color(value)

    def create(self, validated_data):
        user = self.context["request"].user
        validated_data["user"] = user
        color = validated_data.pop("color", None)
        validated_data["color"] = color or Category.next_color_for_user(user)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if validated_data.get("color") is None:
            validated_data.pop("color", None)
        return super().update(instance, validated_data)
