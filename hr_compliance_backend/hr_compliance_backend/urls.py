from django.contrib import admin
from django.urls import path, include

from django.conf import settings
from django.conf.urls.static import static


urlpatterns = [
    path("admin/", admin.site.urls),

    # ======================
    # AUTH (GLOBAL)
    # ======================
    path("api/auth/", include("accounts.urls")),

    # ======================
    # SUPERADMIN (MASTER)
    # ======================
    path("api/", include("master_apps.principle_employee.urls")),

    # VENDOR
    path("api/vendor/", include("master_apps.vendor.urls")),

    # AUDITOR
    path("api/auditor/", include("master_apps.auditor.urls")),

    # DOCUMENTS  (EXPLICIT PREFIX ADDED — NO BREAKAGE)
    path("api/documents/", include("master_apps.documents.urls")),

    # CHECKLIST
    path("api/checklist/", include("master_apps.checklist.urls")),

    # BRANCHES
    path("api/", include("master_apps.vendor.branch_urls")),
]


# ======================
# MEDIA FILES
# ======================
if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT,
    )