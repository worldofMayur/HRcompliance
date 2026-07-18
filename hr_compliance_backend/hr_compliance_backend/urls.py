from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse

from django.conf import settings
from django.conf.urls.static import static

from rest_framework_simplejwt.views import (
    TokenRefreshView,
    TokenVerifyView,
)

# ==========================================================
# HOME ROUTE
# ==========================================================
def home(request):
    return HttpResponse("HR Compliance Backend Running Successfully")


# ==========================================================
# URL PATTERNS
# ==========================================================
urlpatterns = [

    # HOME
    path("", home),

    # ADMIN
    path("admin/", admin.site.urls),

    # JWT
    path(
        "api/token/refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh",
    ),

    path(
        "api/token/verify/",
        TokenVerifyView.as_view(),
        name="token_verify",
    ),

    # ======================================================
    # AUTH (GLOBAL)
    # ======================================================
    path("api/auth/", include("accounts.urls")),

    # ======================================================
    # SUPERADMIN (MASTER)
    # ======================================================
    path("api/", include("master_apps.principle_employee.urls")),

    # ======================================================
    # VENDOR
    # ======================================================
    path("api/vendor/", include("master_apps.vendor.urls")),

    # ======================================================
    # AUDITOR
    # ======================================================
    path("api/auditor/", include("master_apps.auditor.urls")),

    # ======================================================
    # DOCUMENTS
    # ======================================================
    path(
        "api/document-master/",
        include("master_apps.documents.urls"),
    ),

    # ======================================================
    # CHECKLIST
    # ======================================================
    path(
        "api/checklist/",
        include("master_apps.checklist.urls"),
    ),

    # ======================================================
    # BRANCHES
    # ======================================================
    path(
        "api/",
        include("master_apps.vendor.branch_urls"),
    ),
]

# ==========================================================
# MEDIA FILES
# ==========================================================
urlpatterns += static(
    settings.MEDIA_URL,
    document_root=settings.MEDIA_ROOT,
)