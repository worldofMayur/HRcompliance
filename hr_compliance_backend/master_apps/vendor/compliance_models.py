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

from master_apps.vendor.utils import (
    vendor_document_upload_path
)

from master_apps.vendor.constants import (
    WorkflowStatus,
    WORKFLOW_STATUS_CHOICES
)


from django.utils.timezone import now
import os

def compliance_upload_path(
    instance,
    filename
):

    import os

    from master_apps.vendor.utils import (
        build_audit_folder_path
    )

    base_path = build_audit_folder_path(

        vendor=instance.vendor,

        pe=instance.principal_employer,

        branch=instance.branch,

        audit_period=instance.audit_period,
    )

    filename = os.path.basename(
        filename
    )

    folder = (
        "reuploaded_documents"
        if instance.is_reuploaded
        else "main_documents"
    )

    return os.path.join(

        base_path,

        folder,

        filename
    )

def compliance_main_upload_path(instance, filename):

    return vendor_document_upload_path(
        instance,
        filename
    )

# ===============================
# 📁 SUPPORTING FILE PATH
# ===============================
def compliance_supporting_upload_path(
    instance,
    filename
):

    import os

    from master_apps.vendor.utils import (
        build_audit_folder_path
    )

    submission = instance.submission

    base_path = build_audit_folder_path(

        vendor=submission.vendor,

        pe=submission.principal_employer,

        branch=submission.branch,

        audit_period=submission.audit_period,
    )

    filename = os.path.basename(
        filename
    )

    return os.path.join(

        base_path,

        "supporting_files",

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
    # 📄 MAIN FILE
    # ===============================
    main_file = models.FileField(
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
        upload_to=compliance_supporting_upload_path,
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
        upload_to=compliance_upload_path,
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


def exceptional_approval_upload_path(
    instance,
    filename
):

    import os

    from master_apps.vendor.utils import (
        build_audit_folder_path
    )

    submission = instance.submission

    base_path = build_audit_folder_path(

        vendor=submission.vendor,

        pe=submission.principal_employer,

        branch=submission.branch,

        audit_period=submission.audit_period,
    )

    filename = os.path.basename(
        filename
    )

    return os.path.join(

        base_path,

        "exception_approval",

        filename
    )


def exceptional_approval_upload_path(
    instance,
    filename
):

    import os

    from master_apps.vendor.utils import (
        build_audit_folder_path
    )

    submission = instance.submission

    base_path = build_audit_folder_path(

        vendor=submission.vendor,

        pe=submission.principal_employer,

        branch=submission.branch,

        audit_period=submission.audit_period,
    )

    filename = os.path.basename(
        filename
    )

    return os.path.join(

        base_path,

        "exception_approval",

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