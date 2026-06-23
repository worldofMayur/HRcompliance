from django.urls import path
from .views import (
    VendorCreateAPIView,
    VendorListAPIView,
    VendorUpdateAPIView,
    VendorDeleteAPIView,
    VendorDocumentZipAPIView
)
from .mapping_views import (
    VendorBranchMappingCreateAPIView,
    VendorBranchMappingListAPIView,
    VendorMappedPEAPIView,
    VendorMappedStatesAPIView,
    VendorMappedBranchesAPIView,
    VendorMappedDocumentsAPIView,
    PEBranchDropdownAPIView,
    VendorBranchMappingUpdateAPIView, 
    AuditorMappingDetailsAPIView, # ✅ already here
)
from .compliance_views import VendorSubmitComplianceAPIView, FrozenAuditPeriodsAPIView
from .views import VendorCCEmailAPIView
from .mapping_views import VendorMappingMetaAPIView
from django.urls import path
from . import views
from . import compliance_views


urlpatterns = [

    # =========================
    # VENDOR CRUD
    # =========================
    path("create/", VendorCreateAPIView.as_view()),
    path("list/", VendorListAPIView.as_view()),
    path("<int:pk>/update/", VendorUpdateAPIView.as_view()),
    path("<int:pk>/delete/", VendorDeleteAPIView.as_view()),
    path("mapping-meta/", VendorMappingMetaAPIView.as_view()),
    path(
    "frozen-periods/",
    FrozenAuditPeriodsAPIView.as_view()
    ),

    # =========================
    # MAPPING (PE SIDE)
    # =========================
    path("mapping/create/", VendorBranchMappingCreateAPIView.as_view()),
    path("mapping/list/", VendorBranchMappingListAPIView.as_view()),
    path("auditor/mapping-details/", AuditorMappingDetailsAPIView.as_view()),

    # ✅ UPDATE API (FIXED URL)
    path("vendor-mapping/<int:pk>/", VendorBranchMappingUpdateAPIView.as_view()),
        path(
        "<int:vendor_id>/download-documents/",
        VendorDocumentZipAPIView.as_view(),
    ),

    # =========================
    # PE BRANCH DROPDOWN
    # =========================
    path("pe/branches/", PEBranchDropdownAPIView.as_view()),

    # =========================
    # VENDOR DROPDOWN APIs
    # =========================
    path("mapped-pe/", VendorMappedPEAPIView.as_view()),
    path("mapped-states/", VendorMappedStatesAPIView.as_view()),
    path("mapped-branches/", VendorMappedBranchesAPIView.as_view()),
    path("mapped-documents/", VendorMappedDocumentsAPIView.as_view()),

    # =========================
    # COMPLIANCE
    # =========================
    path("submit-compliance/", VendorSubmitComplianceAPIView.as_view()),
    path("cc-emails/", VendorCCEmailAPIView.as_view()),
    path(
        "reupload-compliance/",
        compliance_views.reupload_compliance,
        name="reupload-compliance",
    ),
]