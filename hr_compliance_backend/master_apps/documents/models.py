from django.db import models
from master_apps.principle_employee.models import PrincipalEmployer

import os

from master_apps.vendor.path_manager import (
    build_submission_subfolder,
    generate_unique_filename,
)

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

    submission = instance.vendor_submission

    archive_folder_map = {

        "CC_PDF":
            "compliance_clearance_certificate",

        "FREEZE_REPORT":
            "audit_logs",

        "EXCEPTIONAL_APPROVAL":
            "exceptional_approval",
    }

    folder = archive_folder_map.get(

        instance.archive_type,

        "audit_archive"
    )

    filename = generate_unique_filename(
        filename
    )

    return os.path.join(

        build_submission_subfolder(
            submission,
            folder
        ),

        filename
    )


# ======================================
# 📦 COMPLIANCE AUDIT ARCHIVE
# ======================================

class ComplianceAuditArchive(models.Model):

    ARCHIVE_TYPE_CHOICES = [

        ("CC_PDF", "CC PDF"),

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