from django.urls import path
from .views import (
    AuditorCreateAPIView,
    AuditorListAPIView,
    AuditorUpdateAPIView,
    AuditorDeleteAPIView,
)

urlpatterns = [
    path("create/", AuditorCreateAPIView.as_view()),
    path("list/", AuditorListAPIView.as_view()),
    path("<int:pk>/update/", AuditorUpdateAPIView.as_view()),
    path("<int:pk>/delete/", AuditorDeleteAPIView.as_view()),
]