from django.urls import path

from .views import (
    VendorCreateAPIView,
    VendorListAPIView,
    VendorUpdateAPIView,
    VendorDeleteAPIView,
    VendorDocumentZipAPIView,
    VendorCCEmailAPIView,
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
    AuditorMappingDetailsAPIView,
    VendorMappingMetaAPIView,
)

from .compliance_views import (
    VendorSubmitComplianceAPIView,
    FrozenAuditPeriodsAPIView,
)

from .report_views import BranchWiseVendorReportAPIView

from . import compliance_views


urlpatterns = [

    # =========================
    # VENDOR CRUD
    # =========================

    path("create/", VendorCreateAPIView.as_view()),
    path("list/", VendorListAPIView.as_view()),
    path("<int:pk>/update/", VendorUpdateAPIView.as_view()),
    path("<int:pk>/delete/", VendorDeleteAPIView.as_view()),

    path(
        "<int:vendor_id>/download-documents/",
        VendorDocumentZipAPIView.as_view(),
    ),

    path(
        "cc-emails/",
        VendorCCEmailAPIView.as_view(),
    ),

    # =========================
    # REPORTS
    # =========================

    path(
        "reports/branch-wise/",
        BranchWiseVendorReportAPIView.as_view(),
    ),

    # =========================
    # MAPPING
    # =========================

    path(
        "mapping/create/",
        VendorBranchMappingCreateAPIView.as_view(),
    ),

    path(
        "mapping/list/",
        VendorBranchMappingListAPIView.as_view(),
    ),

    path(
        "vendor-mapping/<int:pk>/",
        VendorBranchMappingUpdateAPIView.as_view(),
    ),

    path(
        "mapping-meta/",
        VendorMappingMetaAPIView.as_view(),
    ),

    path(
        "auditor/mapping-details/",
        AuditorMappingDetailsAPIView.as_view(),
    ),

    # =========================
    # PE DROPDOWN
    # =========================

    path(
        "pe/branches/",
        PEBranchDropdownAPIView.as_view(),
    ),

    # =========================
    # VENDOR DROPDOWNS
    # =========================

    path(
        "mapped-pe/",
        VendorMappedPEAPIView.as_view(),
    ),

    path(
        "mapped-states/",
        VendorMappedStatesAPIView.as_view(),
    ),

    path(
        "mapped-branches/",
        VendorMappedBranchesAPIView.as_view(),
    ),

    path(
        "mapped-documents/",
        VendorMappedDocumentsAPIView.as_view(),
    ),

    # =========================
    # COMPLIANCE
    # =========================

    path(
        "submit-compliance/",
        VendorSubmitComplianceAPIView.as_view(),
    ),

    path(
        "frozen-periods/",
        FrozenAuditPeriodsAPIView.as_view(),
    ),

    path(
        "reupload-compliance/",
        compliance_views.reupload_compliance,
        name="reupload-compliance",
    ),
]