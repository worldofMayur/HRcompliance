from django.urls import path

from .views import (

    # =========================
    # CRUD
    # =========================
    AuditorCreateAPIView,
    AuditorListAPIView,
    AuditorUpdateAPIView,
    AuditorDeleteAPIView,

    # =========================
    # NOTIFICATIONS
    # =========================
    VendorNotificationAPIView,
    MarkNotificationReadAPIView,
    DownloadAuditorDocumentsAPIView,

    # =========================
    # AUDITOR FLOW
    # =========================
    AuditorMappedPEAPIView,
    AuditorMappedVendorAPIView,
    AuditorMappedBranchesAPIView,
    AuditorMappedStatesAPIView,

    # =========================
    # AUDIT CORE
    # =========================
    AuditChecklistAPIView,
    SaveAuditAPIView,
    AuditorCompliancePeriodAPIView,
    AuditorMappingDetailsAPIView,
    AuditorComplianceRemarksAPIView,
    DownloadAuditDocumentsZipAPIView,

    # =========================
    # FREEZE AUDIT REPORTS
    # =========================
    FreezeAuditReportsAPIView,
    DownloadCCPDFAPIView,

    # =========================
    # COMPLIANCE ARCHIVES
    # =========================
    ComplianceArchiveListAPIView,
    ComplianceArchiveDownloadAPIView,
    ExceptionalApprovalFilesAPIView,
    AuditSessionStatusAPIView,
    UpdateComplianceSummaryAPIView,
    )

urlpatterns = [

    # =====================================================
    # 🔹 AUDITOR CRUD APIs
    # =====================================================

    path(
        "create/",
        AuditorCreateAPIView.as_view(),
        name="auditor-create"
    ),

    path(
        "list/",
        AuditorListAPIView.as_view(),
        name="auditor-list"
    ),

    path(
        "<int:pk>/update/",
        AuditorUpdateAPIView.as_view(),
        name="auditor-update"
    ),

    path(
        "<int:pk>/delete/",
        AuditorDeleteAPIView.as_view(),
        name="auditor-delete"
    ),

    path(
        "<int:auditor_id>/download-documents/",
        DownloadAuditorDocumentsAPIView.as_view(),
        name="auditor-download-documents"
    ),

    # =====================================================
    # 🔹 DROPDOWN FLOW (AUDITOR MAPPING)
    # =====================================================

    path(
        "mapped-pe/",
        AuditorMappedPEAPIView.as_view(),
        name="auditor-mapped-pe"
    ),

    path(
        "mapped-vendors/",
        AuditorMappedVendorAPIView.as_view(),
        name="auditor-mapped-vendors"
    ),

    path(
        "mapped-states/",
        AuditorMappedStatesAPIView.as_view(),
        name="auditor-mapped-states"
    ),

    path(
        "mapped-branches/",
        AuditorMappedBranchesAPIView.as_view(),
        name="auditor-mapped-branches"
    ),

    # =====================================================
    # 🔹 AUDIT CORE
    # =====================================================

    path(
        "audit/checklist/<int:branch_id>/",
        AuditChecklistAPIView.as_view(),
        name="audit-checklist"
    ),

    path(
        "save-audit/",
        SaveAuditAPIView.as_view(),
        name="save-audit"
    ),

    path(
        "compliance-periods/",
        AuditorCompliancePeriodAPIView.as_view(),
        name="compliance-periods"
    ),

    path(
        "mapping-details/",
        AuditorMappingDetailsAPIView.as_view(),
        name="mapping-details"
    ),

    path(
        "audit/documents-zip/<int:branch_id>/",
        DownloadAuditDocumentsZipAPIView.as_view(),
        name="audit-documents-zip"
    ),

    path(
        "compliance-remarks/",
        AuditorComplianceRemarksAPIView.as_view(),
        name="auditor-compliance-remarks"
    ),

    # =====================================================
    # 🔹 NOTIFICATIONS
    # =====================================================

    path(
        "vendor/notifications/",
        VendorNotificationAPIView.as_view(),
        name="vendor-notifications"
    ),

    path(
        "vendor/notifications/<int:pk>/read/",
        MarkNotificationReadAPIView.as_view(),
        name="mark-notification-read"
    ),

    # =====================================================
    # 🔹 FREEZE AUDIT REPORTS
    # =====================================================

    path(
        "freeze-audit-reports/",
        FreezeAuditReportsAPIView.as_view(),
        name="freeze-audit-reports"
    ),

    path(
        "download-cc-pdf/<int:audit_id>/",
        DownloadCCPDFAPIView.as_view(),
        name="download-cc-pdf",
    ),

    # =====================================================
    # 🔹 COMPLIANCE ARCHIVES
    # =====================================================

    path(
        "compliance-archives/",
        ComplianceArchiveListAPIView.as_view(),
        name="compliance-archives"
    ),

    path(
        "compliance-archives/download/<int:archive_id>/",
        ComplianceArchiveDownloadAPIView.as_view(),
        name="compliance-archive-download"
    ),

    path(
        "exceptional-approval-files/<int:submission_id>/",
        ExceptionalApprovalFilesAPIView.as_view(),
        name="exceptional-approval-files"
    ),

    path(
        "audit-session-status/",
        AuditSessionStatusAPIView.as_view()
    ),
    path(
        "update-compliance-summary/",
        UpdateComplianceSummaryAPIView.as_view(),
        name="update-compliance-summary",
    ),
]