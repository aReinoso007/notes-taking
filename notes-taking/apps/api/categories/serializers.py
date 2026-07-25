from rest_framework import serializers

from .models import Category


class CategorySerializer(serializers.ModelSerializer):
    note_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Category
        fields = ("id", "name", "color", "note_count", "created_at")
        read_only_fields = ("id", "color", "note_count", "created_at")

    def create(self, validated_data):
        user = self.context["request"].user
        validated_data["user"] = user
        validated_data["color"] = Category.next_color_for_user(user)
        return super().create(validated_data)
