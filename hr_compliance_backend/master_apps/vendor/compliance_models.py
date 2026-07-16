import os
from uuid import uuid4

from django.db import models
from django.utils.text import slugify
from django.utils.timezone import now

from master_apps.vendor.models import Vendor
from master_apps.principle_employee.models import (
    PrincipalEmployer,
    PrincipalEmployerBranch
)
from master_apps.documents.models import DocumentMaster

from master_apps.vendor.constants import (
    WorkflowStatus,
    WORKFLOW_STATUS_CHOICES
)
from master_apps.vendor.storage import OverwriteStorage

# ==================== UPDATED IMPORTS ====================
from master_apps.vendor.path_manager import (
    build_submission_subfolder,
    generate_unique_filename,
    normalize_audit_period,     # ← Added
)
# ========================================================


def compliance_upload_path(instance, filename):
    """Main + Reuploaded Documents"""
    submission = instance
    folder = "reuploaded_documents" if getattr(instance, 'is_reuploaded', False) else "main_documents"
    filename = generate_unique_filename(filename)
    return os.path.join(
        build_submission_subfolder(submission, folder),
        filename
    )


def supporting_file_upload_path(instance, filename):
    """Supporting Files"""
    filename = generate_unique_filename(filename)
    return os.path.join(
        build_submission_subfolder(instance.submission, "supporting_files"),
        filename
    )

def version_file_upload_path(instance, filename):
    """Reuploaded Version Files"""

    filename = generate_unique_filename(filename)

    return os.path.join(

        build_submission_subfolder(
            instance.submission,
            "reuploaded_documents"
        ),

        filename
    )


def compliance_clearance_certificate_path(instance, filename):
    """Compliance Clearance Certificate"""

    filename = generate_unique_filename(filename)

    return os.path.join(
        build_submission_subfolder(
            instance,
            "compliance_clearance_certificate"
        ),
        filename
    )


# ==========================================
# ⚠️ MIGRATION COMPATIBILITY FUNCTION
# ==========================================
def compliance_main_upload_path(
    instance,
    filename
):

    return compliance_upload_path(
        instance,
        filename
    )

# ======================================
# LEGACY SUPPORTING FILE PATH
# (Required for old migrations)
# ======================================

def compliance_supporting_upload_path(
    instance,
    filename
):

    return supporting_file_upload_path(
        instance,
        filename
    )

# ===============================
# 📄 MAIN SUBMISSION MODEL
# ===============================
class VendorComplianceSubmission(models.Model):

    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.CASCADE,
        related_name="compliance_submissions"
    )

    principal_employer = models.ForeignKey(
        PrincipalEmployer,
        on_delete=models.CASCADE
    )

    branch = models.ForeignKey(
        PrincipalEmployerBranch,
        on_delete=models.CASCADE
    )

    document = models.ForeignKey(
        DocumentMaster,
        on_delete=models.CASCADE
    )

    state = models.CharField(
        max_length=100
    )

    audit_period = models.CharField(
        max_length=100,
        null=True,
        blank=True
    )

    # ===============================
    # 📊 COMPLIANCE SUMMARY
    # ===============================

    male_employees = models.PositiveIntegerField(
        null=True,
        blank=True
    )

    female_employees = models.PositiveIntegerField(
        null=True,
        blank=True
    )

    gross_wages = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        null=True,
        blank=True
    )

    net_wages = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        null=True,
        blank=True
    )

    pf_remittance_date = models.DateField(
        null=True,
        blank=True
    )

    esic_remittance_date = models.DateField(
        null=True,
        blank=True
    )

    rc_remittance_date = models.DateField(
        null=True,
        blank=True
    )

    lwf_remittance_date = models.DateField(
        null=True,
        blank=True
    )

    # ===============================
    # 📄 MAIN FILE
    # ===============================
    main_file = models.FileField(
        storage=OverwriteStorage(),
        upload_to=compliance_upload_path,
        max_length=500
        )

    original_filename = models.CharField(
        max_length=255,
        null=True,
        blank=True
    )

    # ===============================
    # 📝 REMARKS
    # ===============================
    general_remark = models.TextField(
        null=True,
        blank=True
    )

    reupload_remark = models.TextField(
        null=True,
        blank=True
    )

    # ===============================
    # 📧 CC EMAILS
    # ===============================
    cc_emails = models.JSONField(
        null=True,
        blank=True,
        help_text="List of CC email recipients"
    )

    is_cc_issued = models.BooleanField(
        default=False
    )

    cc_issued_at = models.DateTimeField(
        null=True,
        blank=True
    )

    # ===============================
    # 📄 CLEARANCE CERTIFICATE
    # ===============================

    clearance_certificate = models.FileField(
        upload_to=compliance_clearance_certificate_path,
        null=True,
        blank=True,
        max_length=500
    )

    audit_report_pdf = models.FileField(
        upload_to=compliance_clearance_certificate_path,
        null=True,
        blank=True,
        max_length=500
    )

    # ===============================
    # 📤 CLEARANCE EMAIL TRACKING
    # ===============================
    clearance_email_sent = models.BooleanField(
        default=False
    )

    clearance_email_sent_at = models.DateTimeField(
        null=True,
        blank=True
    )

    # ===============================
    # 🔄 WORKFLOW STATUS
    # ===============================
    workflow_status = models.CharField(
        max_length=50,
        choices=WORKFLOW_STATUS_CHOICES,
        default=WorkflowStatus.SUBMITTED
    )

    has_exceptional_approval = models.BooleanField(
        default=False
    )

    # ===============================
    # ❄️ FREEZE TRACKING
    # ===============================
    is_frozen = models.BooleanField(
        default=False
    )

    frozen_at = models.DateTimeField(
        null=True,
        blank=True
    )

    # ===============================
    # 🔁 REUPLOAD TRACKING
    # ===============================
    file = models.FileField(
        upload_to=compliance_upload_path,
        max_length=500,
        null=True,
        blank=True
    )

    is_reuploaded = models.BooleanField(
        default=False
    )

    reuploaded_at = models.DateTimeField(
        null=True,
        blank=True
    )

    # ===============================
    # 📚 VERSION TRACKING
    # ===============================
    version = models.IntegerField(
        default=1
    )

    # ===============================
    # ⏰ TIMESTAMPS
    # ===============================
    submitted_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):

        return (
            f"{self.vendor.short_name} - "
            f"{self.document.name} - "
            f"{self.audit_period}"
        )

    def save(self, *args, **kwargs):

        if self.pk:
            old = VendorComplianceSubmission.objects.get(pk=self.pk)

            self.vendor = old.vendor
            self.principal_employer = old.principal_employer
            self.branch = old.branch
            self.audit_period = old.audit_period
            self.document = old.document

        is_new = self.pk is None

        temp_file = self.main_file if is_new else None

        if is_new:
            self.main_file = None

        super().save(*args, **kwargs)

        if is_new and temp_file:
            self.main_file = temp_file
            super().save(update_fields=["main_file"])

        if self.main_file:
            print(
                "\n📁 MAIN FILE SAVED:",
                self.main_file.name
            )

        if self.file:
            print(
                "\n📁 REUPLOAD FILE SAVED:",
                self.file.name
            )

        if self.clearance_certificate:
            print(
                "\n📁 CC FILE SAVED:",
                self.clearance_certificate.name
            )

# ===============================
# 📎 SUPPORTING FILE MODEL
# ===============================
class VendorComplianceSupportingFile(models.Model):

    submission = models.ForeignKey(
        VendorComplianceSubmission,
        on_delete=models.CASCADE,
        related_name="supporting_files"
    )

    file = models.FileField(
        upload_to=supporting_file_upload_path,
        max_length=500
    )

    uploaded_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):

        return (
            f"Supporting File - "
            f"{self.submission.id}"
        )

    def save(self, *args, **kwargs):

        super().save(*args, **kwargs)

        if self.file:

            print(
                "\n📁 SUPPORTING FILE SAVED:",
                self.file.name
            )


# ===============================
# 📚 FILE VERSION HISTORY
# ===============================
class VendorComplianceFileVersion(models.Model):

    submission = models.ForeignKey(
        VendorComplianceSubmission,
        on_delete=models.CASCADE,
        related_name="file_versions"
    )

    file = models.FileField(
        upload_to=version_file_upload_path,
        max_length=500
    )

    version = models.IntegerField(
        default=1
    )

    uploaded_at = models.DateTimeField(
        auto_now_add=True
    )

    is_reupload = models.BooleanField(
        default=False
    )

    def __str__(self):

        return (
            f"{self.submission.id} - "
            f"Version {self.version}"
        )

    def save(self, *args, **kwargs):

        super().save(*args, **kwargs)

        if self.file:

            print(
                "\n📁 VERSION FILE SAVED:",
                self.file.name
            )


def exceptional_approval_upload_path(instance, filename):
    """Exceptional Approval Documents (Auditor)"""
    filename = generate_unique_filename(filename)
    return os.path.join(
        build_submission_subfolder(instance.submission, "exceptional_approval"),
        filename
    )


# ===============================
# 📎 EXCEPTIONAL APPROVAL DOCUMENTS
# ===============================
class ExceptionalApprovalDocument(models.Model):

    submission = models.ForeignKey(
        VendorComplianceSubmission,
        on_delete=models.CASCADE,
        related_name="exceptional_documents"
    )

    file = models.FileField(
        upload_to=exceptional_approval_upload_path,
        max_length=500
    )

    uploaded_at = models.DateTimeField(
        auto_now_add=True
    )

    remark = models.TextField(
        null=True,
        blank=True
    )

    def __str__(self):

        return (
            f"Exceptional Approval - "
            f"{self.submission.id}"
        )

    def save(self, *args, **kwargs):

        super().save(*args, **kwargs)

        if self.file:

            print(
                "\n📁 EXCEPTIONAL APPROVAL SAVED:",
                self.file.name
            )