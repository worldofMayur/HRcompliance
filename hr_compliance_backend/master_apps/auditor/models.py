from django.db import models
from accounts.models import User

import os

from django.utils.text import slugify

from master_apps.vendor.path_manager import (
    generate_unique_filename
)


class Auditor(models.Model):

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="auditor_profile"
    )

    name = models.CharField(max_length=255)
    short_name = models.CharField(max_length=50, unique=True)
    company = models.CharField(max_length=255)
    ho_address = models.TextField()

    # ✅ increased length (safe, no breaking)
    mobile = models.CharField(max_length=15)

    email = models.EmailField()

    start_date = models.DateField()
    end_date = models.DateField()

    show_auditor_guidelines = models.BooleanField(
        default=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


# ===============================
# 📁 DOCUMENT UPLOAD PATH
# ===============================
def auditor_document_path(
    instance,
    filename
):

    folder = slugify(
        instance.auditor.short_name
    )

    filename = generate_unique_filename(
        filename
    )

    return os.path.join(

        "auditor",

        folder,

        "master_documents",

        filename
    )


class AuditorDocument(models.Model):

    auditor = models.ForeignKey(
        Auditor,
        related_name="documents",
        on_delete=models.CASCADE
    )

    document = models.FileField(upload_to=auditor_document_path)

    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.auditor.short_name} document"


# ===============================
# 📊 AUDIT ENTRY MODEL (UPDATED SAFE)
# ===============================
class AuditEntry(models.Model):

    auditor = models.ForeignKey(
        Auditor,
        on_delete=models.CASCADE,
        related_name="audit_entries"
    )

    checklist = models.ForeignKey(
        "checklist.AuditChecklist",
        on_delete=models.CASCADE
    )

    submission = models.ForeignKey(
        "vendor.VendorComplianceSubmission",
        on_delete=models.CASCADE,
        related_name="audit_entries",
        null=True,
        blank=True,
    )

    # ✅ KEEPING SAME (no breaking change)
    branch_id = models.IntegerField()

    audit_period = models.CharField(max_length=100)

    # ✅ CONTROLLED STATUS
    STATUS_CHOICES = [
        ("Complied", "Complied"),
        ("Not Complied", "Not Complied"),
        ("Not Applicable", "Not Applicable"),
        ("Not Applicable For Audit Period", "Not Applicable For Audit Period"),
        ("Delayed Complied", "Delayed Complied"),
        ("Exceptional Approval - Delayed Complied", "Exceptional Approval - Delayed Complied"),
        ("Exceptional Approval- Not Complied", "Exceptional Approval- Not Complied"),
        ("Incorrect Document Submitted", "Incorrect Document Submitted"),
    ]

    status = models.CharField(
        max_length=50,
        choices=STATUS_CHOICES
    )

    observation = models.TextField(blank=True, null=True)
    recommendation = models.TextField(blank=True, null=True)

    # ✅ optional future use (safe)
    submitted_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # ✅ PREVENT DUPLICATES (VERY IMPORTANT)
        unique_together = ("checklist", "branch_id", "audit_period")

        # ✅ PERFORMANCE OPTIMIZATION
        indexes = [
            models.Index(fields=["branch_id", "audit_period"]),
        ]

    def __str__(self):
        return f"{self.auditor.short_name} - {self.audit_period}"



class AuditSession(models.Model):

    STATUS_CHOICES = [
        ("DRAFT", "Draft"),
        ("SUBMITTED", "Submitted"),
        ("FROZEN", "Frozen"),
    ]

    auditor = models.ForeignKey(
        Auditor,
        on_delete=models.CASCADE
    )

    branch_id = models.IntegerField()

    audit_period = models.CharField(
        max_length=100
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="DRAFT"
    )

    last_saved_at = models.DateTimeField(
        auto_now=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:

        unique_together = (
            "auditor",
            "branch_id",
            "audit_period"
        )

    def __str__(self):

        return (
            f"{self.audit_period} - "
            f"{self.status}"
        )