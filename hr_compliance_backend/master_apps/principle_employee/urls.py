from django.urls import path
from django.conf.urls.static import static
from django.conf import settings

from .views import (
    PrincipalEmployerCreateAPIView,
    PrincipalEmployerListAPIView,
    PrincipalEmployerDeleteAPIView,
    PrincipalEmployerUpdateAPIView,
    PrincipalEmployerBranchCreateAPIView,
    PrincipalEmployerBranchListAPIView,
    PrincipalEmployerBranchUpdateAPIView,
    PrincipalEmployerDocumentZipAPIView,
    PrincipalEmployerBranchDocumentZipAPIView,   # ✅ Add this
)

urlpatterns = [

    # ==============================
    # PRINCIPAL EMPLOYER APIs
    # ==============================
    path(
        "principal-employer/create/",
        PrincipalEmployerCreateAPIView.as_view(),
        name="principal-employer-create",
    ),

    path(
        "principal-employer/list/",
        PrincipalEmployerListAPIView.as_view(),
        name="principal-employer-list",
    ),

    path(
        "principal-employer/<int:pk>/update/",
        PrincipalEmployerUpdateAPIView.as_view(),
        name="principal-employer-update",
    ),

    path(
        "principal-employer/<int:pk>/delete/",
        PrincipalEmployerDeleteAPIView.as_view(),
        name="principal-employer-delete",
    ),

    # ==============================
    # DOWNLOAD ALL PE DOCUMENTS ZIP
    # ==============================
    path(
        "principal-employer/<int:pe_id>/download-documents/",
        PrincipalEmployerDocumentZipAPIView.as_view(),
        name="pe-document-zip",
    ),

    # ==============================
    # BRANCH APIs
    # ==============================
    path(
        "principal-employer/branch/create/",
        PrincipalEmployerBranchCreateAPIView.as_view(),
        name="branch-create",
    ),

    path(
        "principal-employer/<int:pe_id>/branches/",
        PrincipalEmployerBranchListAPIView.as_view(),
        name="branch-list",
    ),

    path(
        "principal-employer/branch/<int:pk>/update/",
        PrincipalEmployerBranchUpdateAPIView.as_view(),
        name="branch-update",
    ),

    path(
        "<int:pe_id>/download-branch-documents/",
        PrincipalEmployerBranchDocumentZipAPIView.as_view(),
    ),
]

# ==============================
# MEDIA FILES (DEV ONLY)
# ==============================
urlpatterns += static(
    settings.MEDIA_URL,
    document_root=settings.MEDIA_ROOT,
)