from django.urls import path
from .views import (
    AuditorCreateAPIView,
    AuditorListAPIView,
    AuditorUpdateAPIView,
    AuditorDeleteAPIView,
)

urlpatterns = [
    path("create/", AuditorCreateAPIView.as_view(), name="auditor-create"),
    path("list/", AuditorListAPIView.as_view(), name="auditor-list"),
    path("<int:pk>/update/", AuditorUpdateAPIView.as_view(), name="auditor-update"),
    path("<int:pk>/delete/", AuditorDeleteAPIView.as_view(), name="auditor-delete"),
]
