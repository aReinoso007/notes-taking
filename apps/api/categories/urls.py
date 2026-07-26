from django.urls import path

from .views import CategoryViewSet

category_list = CategoryViewSet.as_view({"get": "list", "post": "create"})
category_detail = CategoryViewSet.as_view(
    {"patch": "partial_update", "delete": "destroy"}
)

urlpatterns = [
    path("", category_list, name="category-list"),
    path("<int:pk>/", category_detail, name="category-detail"),
]
