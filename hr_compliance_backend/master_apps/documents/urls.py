from django.urls import path
from .views import (
    DocumentMasterListAPIView,
    DocumentMasterCreateAPIView,
    DocumentMasterUpdateAPIView,
    DocumentMasterDeleteAPIView,
    DocumentMasterBulkDeleteAPIView,
    DocumentMasterBulkUpdateAPIView,
    PEDropdownAPIView,
)

urlpatterns = [
    path("list/", DocumentMasterListAPIView.as_view()),
    path("create/", DocumentMasterCreateAPIView.as_view()),
    path("<int:pk>/update/", DocumentMasterUpdateAPIView.as_view()),
    path("<int:pk>/delete/", DocumentMasterDeleteAPIView.as_view()),

    path("bulk-delete/", DocumentMasterBulkDeleteAPIView.as_view()),
    path("bulk-update/", DocumentMasterBulkUpdateAPIView.as_view()),

    path("pe-dropdown/", PEDropdownAPIView.as_view()),
]