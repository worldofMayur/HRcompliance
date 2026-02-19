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
    path("api/vendor/", include("master_apps.vendor.urls")),
    path("api/auditor/", include("master_apps.auditor.urls")),
    path("api/", include("master_apps.documents.urls")),
    path("api/checklist/", include("master_apps.checklist.urls")),

    # ======================
    # PORTALS (OPTIONAL – IF URLS EXIST)
    # ======================
    # path("api/pe/", include("portal_apps.pe_portal.urls")),
    # path("api/vendor-portal/", include("portal_apps.vendor_portal.urls")),
    # path("api/auditor-portal/", include("portal_apps.auditor_portal.urls")),
]

# ======================
# MEDIA FILES
# ======================
if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT,
    )
