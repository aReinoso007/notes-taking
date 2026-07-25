from rest_framework import serializers

from categories.models import Category

from .models import Note


class NoteListSerializer(serializers.ModelSerializer):
    category = serializers.SerializerMethodField()

    class Meta:
        model = Note
        fields = (
            "id",
            "title",
            "preview_text",
            "category",
            "created_at",
            "updated_at",
        )

    def get_category(self, obj):
        if obj.category_id is None:
            return None
        return {
            "id": obj.category_id,
            "name": obj.category.name,
            "color": obj.category.color,
        }


class NoteDetailSerializer(serializers.ModelSerializer):
    category = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.none(),
        allow_null=True,
        required=False,
    )
    category_detail = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Note
        fields = (
            "id",
            "title",
            "content",
            "preview_text",
            "category",
            "category_detail",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "preview_text", "created_at", "updated_at")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        if request is not None and hasattr(request, "user"):
            self.fields["category"].queryset = Category.objects.for_user(request.user)

    def get_category_detail(self, obj):
        if obj.category_id is None:
            return None
        return {
            "id": obj.category_id,
            "name": obj.category.name,
            "color": obj.category.color,
        }

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Expose nested category shape for clients; keep write as PK.
        data["category"] = data.pop("category_detail")
        return data
