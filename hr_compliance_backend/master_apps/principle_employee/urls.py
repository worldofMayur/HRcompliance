from django.urls import path
from .views import (
    PrincipalEmployerCreateAPIView,
    PrincipalEmployerListAPIView,
    PrincipalEmployerDeleteAPIView,
    PrincipalEmployerUpdateAPIView,
    PrincipalEmployerBranchCreateAPIView,
    PrincipalEmployerBranchListAPIView,
    PrincipalEmployerBranchUpdateAPIView, # ✅ ADD THIS
)
from django.conf.urls.static import static
from django.conf import settings

urlpatterns = [
    path(
        "principal-employer/create/",
        PrincipalEmployerCreateAPIView.as_view(),
        name="principal-employer-create",
    ),
    path("principal-employer/list/", PrincipalEmployerListAPIView.as_view()),
    path(
        "principal-employer/<int:pk>/delete/",
        PrincipalEmployerDeleteAPIView.as_view(),
    ),
    path(
        "principal-employer/<int:pk>/update/",
        PrincipalEmployerUpdateAPIView.as_view(),
        name="principal-employer-update",
    ),

    # NEW
    path(
        "principal-employer/branch/create/",
        PrincipalEmployerBranchCreateAPIView.as_view(),
    ),
    path(
    "principal-employer/<int:pe_id>/branches/",
    PrincipalEmployerBranchListAPIView.as_view(),
    ),
    path(
    "principal-employer/branch/<int:pk>/update/",
    PrincipalEmployerBranchUpdateAPIView.as_view(),
    ),
]

urlpatterns += static(
    settings.MEDIA_URL,
    document_root=settings.MEDIA_ROOT
)
