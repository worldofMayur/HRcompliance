# documents/urls.py
from django.urls import path
from .views import (
    DocumentMasterListAPIView,
    DocumentMasterCreateAPIView,
    DocumentMasterUpdateAPIView,
    DocumentMasterDeleteAPIView,
    DocumentMasterBulkDeleteAPIView,
    DocumentMasterBulkUpdateAPIView,
)

urlpatterns = [
    path("document-master/list/", DocumentMasterListAPIView.as_view()),
    path("document-master/create/", DocumentMasterCreateAPIView.as_view()),
    path("document-master/<int:pk>/update/", DocumentMasterUpdateAPIView.as_view()),
    path("document-master/<int:pk>/delete/", DocumentMasterDeleteAPIView.as_view()),

    # 🔥 BULK ACTIONS
    path("document-master/bulk-delete/", DocumentMasterBulkDeleteAPIView.as_view()),
    path("document-master/bulk-update/", DocumentMasterBulkUpdateAPIView.as_view()),
]
