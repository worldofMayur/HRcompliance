import os
from uuid import uuid4
from django.db import models
from django.utils.text import slugify

from master_apps.vendor.models import Vendor
from master_apps.principle_employee.models import PrincipalEmployer, PrincipalEmployerBranch
from master_apps.documents.models import DocumentMaster


# ===============================
# 📁 MAIN FILE PATH
# ===============================
def compliance_main_upload_path(instance, filename):
    filename = f"{uuid4().hex}_{filename}"

    pe_name = slugify(instance.principal_employer.short_name)
    vendor_name = slugify(instance.vendor.short_name)
    audit_period = slugify(instance.audit_period or "general")

    return os.path.join(
        "compliance",
        pe_name,
        vendor_name,
        audit_period,
        "main",
        filename
    )


# ===============================
# 📁 SUPPORTING FILE PATH
# ===============================
def compliance_supporting_upload_path(instance, filename):
    filename = f"{uuid4().hex}_{filename}"

    submission = instance.submission

    pe_name = slugify(submission.principal_employer.short_name)
    vendor_name = slugify(submission.vendor.short_name)
    audit_period = slugify(submission.audit_period or "general")

    return os.path.join(
        "compliance",
        pe_name,
        vendor_name,
        audit_period,
        "exception_approval_documents",
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

    state = models.CharField(max_length=100)

    audit_period = models.CharField(
        max_length=100,
        null=True,
        blank=True
    )

    main_file = models.FileField(
        upload_to=compliance_main_upload_path
    )

    general_remark = models.TextField(
        null=True,
        blank=True
    )

    # ✅ NEW FIELD (CC EMAILS)
    cc_emails = models.JSONField(
        null=True,
        blank=True,
        help_text="List of CC email recipients"
    )
    is_cc_issued = models.BooleanField(default=False)
    cc_issued_at = models.DateTimeField(null=True, blank=True)

    submitted_at = models.DateTimeField(auto_now_add=True)

        # ===============================
    # 🔁 REUPLOAD TRACKING
    # ===============================

    previous_file = models.FileField(
        upload_to=compliance_main_upload_path,
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

    reupload_remark = models.TextField(
        null=True,
        blank=True
    )

    def __str__(self):
        return f"{self.vendor.short_name} - {self.document.name} - {self.audit_period}"


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
        upload_to=compliance_supporting_upload_path
    )

    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Supporting File - {self.submission.id}"