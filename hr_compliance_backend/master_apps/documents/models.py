from django.db import models
from master_apps.principle_employee.models import PrincipalEmployer

class AuditSubmission(models.Model):
    id = models.BigAutoField(primary_key=True)

    state = models.CharField(max_length=255)

    audit_period = models.CharField(max_length=100)

    main_file = models.FileField(upload_to="compliance/main/")

    remarks = models.TextField(blank=True, null=True)

    submitted_at = models.DateTimeField()

    branch_id = models.IntegerField()

    document_id = models.IntegerField()

    class Meta:
        managed = False   # 🔥 VERY IMPORTANT (table already exists)
        db_table = "compliance_submission"   # 👈 CHANGE THIS if needed

    def __str__(self):
        return str(self.id)

class DocumentMaster(models.Model):
    id = models.BigAutoField(primary_key=True)

    FREQUENCY_MONTHLY = "monthly"
    FREQUENCY_ANNUAL = "annually"
    FREQUENCY_ONE_TIME = "one_time"

    FREQUENCY_CHOICES = (
        ("monthly", "Monthly"),
        ("quarterly", "Quarterly"),
        ("half_yearly", "Half Yearly"),
        ("annually", "Annually"),
        ("one_time", "One Time"),
    )

    name = models.CharField(max_length=255)

    # NEW FIELD
    principal_employer = models.ForeignKey(
        PrincipalEmployer,
        null=True,
        blank=True,
        on_delete=models.CASCADE
    )

    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "document_master"

    def __str__(self):
        return self.name


def compliance_archive_upload_path(
    instance,
    filename
):

    import os

    from master_apps.vendor.utils import (
        build_audit_folder_path
    )

    submission = instance.vendor_submission

    base_path = build_audit_folder_path(

        vendor=submission.vendor,

        pe=submission.principal_employer,

        branch=submission.branch,

        audit_period=submission.audit_period,
    )

    filename = os.path.basename(
        filename
    )

    archive_folder_map = {

        "CC_PDF":
            "CC_Certificate",

        "CLEARANCE_EMAIL":
            "Clearance_Email",

        "FREEZE_REPORT":
            "Audit_Archive",

        "EXCEPTIONAL_APPROVAL":
            (
                "Exceptional_Approval_"
                "Supporting_Document_"
                "Uploaded_By_Auditor"
            ),
    }

    folder = archive_folder_map.get(

        instance.archive_type,

        "Audit_Archive"
    )

    return os.path.join(

        base_path,

        folder,

        filename
    )


# ======================================
# 📦 COMPLIANCE AUDIT ARCHIVE
# ======================================

class ComplianceAuditArchive(models.Model):

    ARCHIVE_TYPE_CHOICES = [

        ("CC_PDF", "CC PDF"),

        ("CLEARANCE_EMAIL", "Clearance Email"),

        ("FREEZE_REPORT", "Freeze Report"),

        ("EXCEPTIONAL_APPROVAL", "Exceptional Approval"),
    ]

    vendor_submission = models.ForeignKey(

        "vendor.VendorComplianceSubmission",

        on_delete=models.CASCADE,

        related_name="audit_archives"
    )

    archive_type = models.CharField(

        max_length=50,

        choices=ARCHIVE_TYPE_CHOICES
    )

    file = models.FileField(
        upload_to=compliance_archive_upload_path,
        max_length=500,
        null=True,
        blank=True
    )

    
    uploaded_by = models.ForeignKey(

        "accounts.User",

        null=True,

        blank=True,

        on_delete=models.SET_NULL
    )

    remarks = models.TextField(

        null=True,

        blank=True
    )

    created_at = models.DateTimeField(

        auto_now_add=True
    )

    class Meta:

        db_table = "compliance_audit_archive"

        ordering = ["-created_at"]

    def __str__(self):

        return (
            f"{self.archive_type} - "
            f"{self.vendor_submission_id}"
        )