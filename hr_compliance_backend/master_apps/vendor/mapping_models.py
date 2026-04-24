from django.db import models
from django.utils.timezone import now
from .models import Vendor
from master_apps.principle_employee.models import PrincipalEmployerBranch, PrincipalEmployer
from master_apps.auditor.models import Auditor
from master_apps.documents.models import DocumentMaster


class VendorBranchMapping(models.Model):

    RULE_CHOICES = (
        ("CENTRAL", "Central"),
        ("STATE", "State"),
    )

    FREQUENCY_CHOICES = (
        ("MONTHLY", "Monthly"),
        ("QUARTERLY", "Quarterly"),
        ("HALF_YEARLY", "Half Yearly"),
        ("ANNUALLY", "Annually"),
    )

    STATUS_CHOICES = (
        ("Active", "Active"),
        ("Inactive", "Inactive"),
    )

    principal_employer = models.ForeignKey(
        PrincipalEmployer,
        on_delete=models.CASCADE,
        related_name="vendor_branch_mappings"
    )

    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.CASCADE,
        related_name="branch_mappings"
    )

    branch = models.ForeignKey(
        PrincipalEmployerBranch,
        on_delete=models.CASCADE,
        related_name="vendor_mappings"
    )

    auditor = models.ForeignKey(
        Auditor,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    # ✅ MULTIPLE DOCUMENTS
    documents = models.ManyToManyField(
        DocumentMaster,
        blank=True
    )

    start_date = models.DateField()
    end_date = models.DateField()

    rule = models.CharField(max_length=20, choices=RULE_CHOICES)

    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES)

    # ✅ STATUS FIELD (with index for performance)
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default="Active",
        db_index=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    # =========================
    # ✅ STATUS LOGIC (SAFE)
    # =========================
    def update_status(self):
        today = now().date()

        # 1️⃣ If PE is inactive → force inactive (safe check)
        if (
            self.principal_employer and
            hasattr(self.principal_employer, "status") and
            self.principal_employer.status == "Inactive"
        ):
            self.status = "Inactive"
            return

        # 2️⃣ If end_date passed → inactive
        if self.end_date and self.end_date < today:
            self.status = "Inactive"
        else:
            self.status = "Active"

    # =========================
    # ✅ AUTO UPDATE ON SAVE
    # =========================
    def save(self, *args, **kwargs):
        self.update_status()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.vendor} - {self.branch} ({self.status})"