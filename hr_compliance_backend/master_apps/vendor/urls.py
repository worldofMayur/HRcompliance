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

from .dashboard_views import (
    BranchDashboardKPIAPIView,
    BranchDashboardStateSummaryAPIView,
    BranchDashboardMonthlyTrendAPIView,
)

# Report Views Import
from .report_views import (
    BranchWiseVendorReportAPIView,
    PEReportStatesAPIView,
    PEReportBranchesAPIView,
    PEReportVendorsAPIView,
    PEReportServicesAPIView,
    PEReportAuditPeriodsAPIView,
    
    # Exceptional Report - Dedicated APIs
    PEExceptionalStatesAPIView,
    PEExceptionalBranchesAPIView,
    PEExceptionalVendorsAPIView,
    PEExceptionalAuditPeriodsAPIView,
    ExceptionalApprovalReportAPIView,
    PEComplianceVendorsAPIView,
    PEComplianceAuditPeriodsAPIView,
    PECompliancePeriodicitiesAPIView,
    ComplianceReportAPIView,
    DocumentWiseComplianceReportAPIView,
)

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
    path(
        "dashboard/branch/kpi/",
        BranchDashboardKPIAPIView.as_view(),
    ),
    path(
        "dashboard/branch/state-summary/",
        BranchDashboardStateSummaryAPIView.as_view(),
    ),
    path(
        "dashboard/branch/monthly-trend/",
        BranchDashboardMonthlyTrendAPIView.as_view(),
    ),

    # Branch Wise Report Filters
    path("reports/states/", PEReportStatesAPIView.as_view()),
    path("reports/branches/", PEReportBranchesAPIView.as_view()),
    path("reports/vendors/", PEReportVendorsAPIView.as_view()),
    path("reports/services/", PEReportServicesAPIView.as_view()),
    path("reports/audit-periods/", PEReportAuditPeriodsAPIView.as_view()),

    # Exceptional Approval Report Filters (Dedicated)
    path("reports/exception-states/", PEExceptionalStatesAPIView.as_view()),
    path("reports/exception-branches/", PEExceptionalBranchesAPIView.as_view()),
    path("reports/exception-vendors/", PEExceptionalVendorsAPIView.as_view()),
    path("reports/exception/audit-periods/", PEExceptionalAuditPeriodsAPIView.as_view()),
    path(
    "reports/compliance-vendors/",
        PEComplianceVendorsAPIView.as_view(),
    ),

    path(
        "reports/compliance-audit-periods/",
        PEComplianceAuditPeriodsAPIView.as_view(),
    ),
    path(
        "reports/compliance-periodicities/",
        PECompliancePeriodicitiesAPIView.as_view(),
    ),

    # Exceptional Approval Report Generation
    path(
        "reports/exceptional-approval/",
        ExceptionalApprovalReportAPIView.as_view(),
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
    path(
        "reports/compliance/",
        ComplianceReportAPIView.as_view(),
    ),

    # =========================
    # PE DROPDOWN
    # =========================
    path(
        "pe/branches/",
        PEBranchDropdownAPIView.as_view(),
    ),

    path("reports/document-wise/", DocumentWiseComplianceReportAPIView.as_view()),

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