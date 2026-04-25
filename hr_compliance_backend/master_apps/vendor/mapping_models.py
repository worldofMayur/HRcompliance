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
        blank=True,
        related_name="vendor_mappings"
    )

    # ✅ DATE FIELDS
    start_date = models.DateField(db_index=True)
    end_date = models.DateField(db_index=True)

    # 🔥 NEW: EFFECTIVE DATE
    effective_date = models.DateField(null=True, blank=True)

    rule = models.CharField(max_length=20, choices=RULE_CHOICES)
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES)

    # ✅ STATUS FIELD (kept for DB but controlled safely)
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default="Active",
        db_index=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    # =========================
    # ✅ SAFE STATUS LOGIC
    # =========================
    def update_status(self):
        today = now().date()

        # 1️⃣ PE inactive
        if (
            self.principal_employer and
            hasattr(self.principal_employer, "status") and
            self.principal_employer.status == "Inactive"
        ):
            return "Inactive"

        # 2️⃣ End date expired
        if self.end_date and self.end_date < today:
            return "Inactive"

        return "Active"

    # =========================
    # ✅ CONTROLLED SAVE
    # =========================
    def save(self, *args, **kwargs):
        today = now().date()

        # 🔥 APPLY STATUS ONLY IF EFFECTIVE DATE IS VALID
        if not self.effective_date or self.effective_date <= today:
            self.status = self.update_status()

        # ❗ If effective_date is future → do not change status yet
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.vendor} - {self.branch} ({self.status})"


# =========================
# 🔥 HISTORY TRACKING MODEL
# =========================
class VendorMappingHistory(models.Model):
    mapping = models.ForeignKey(
        VendorBranchMapping,
        on_delete=models.CASCADE,
        related_name="history"
    )

    changed_by = models.CharField(max_length=100)
    change_type = models.CharField(max_length=50)

    old_data = models.JSONField(null=True, blank=True)
    new_data = models.JSONField(null=True, blank=True)

    changed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Mapping {self.mapping.id} - {self.change_type}"