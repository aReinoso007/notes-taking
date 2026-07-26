from django.db.models import Q
from rest_framework import viewsets
from rest_framework.pagination import CursorPagination
from rest_framework.permissions import IsAuthenticated

from .models import Note
from .serializers import NoteDetailSerializer, NoteListSerializer


class NoteCursorPagination(CursorPagination):
    page_size = 20
    ordering = "-updated_at"
    cursor_query_param = "cursor"


class NoteViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    pagination_class = NoteCursorPagination
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        qs = (
            Note.objects.for_user(self.request.user)
            .select_related("category")
            .order_by("-updated_at", "-id")
        )
        category_id = self.request.query_params.get("category")
        if category_id is not None:
            if category_id in ("", "null"):
                qs = qs.filter(category__isnull=True)
            else:
                qs = qs.filter(category_id=category_id)

        q = (self.request.query_params.get("q") or "").strip()
        if q:
            qs = qs.filter(Q(title__icontains=q) | Q(content__icontains=q))
        return qs

    def get_serializer_class(self):
        if self.action == "list":
            return NoteListSerializer
        return NoteDetailSerializer
