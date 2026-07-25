from django.contrib import admin

from .models import Category


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "color", "user", "created_at")
    list_filter = ("color",)
    search_fields = ("name", "user__email")
