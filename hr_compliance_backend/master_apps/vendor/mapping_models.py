from django.db import models
from django.utils.timezone import now
from .models import Vendor
from master_apps.principle_employee.models import PrincipalEmployerBranch, PrincipalEmployer
from master_apps.auditor.models import Auditor
from master_apps.documents.models import DocumentMaster
from datetime import date


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

        print("---- STATUS DEBUG ----")
        print("TODAY:", today)
        print("START:", self.start_date)
        print("END:", self.end_date)
        print("EFFECTIVE:", self.effective_date)

        if self.effective_date and self.effective_date > today:
            return "Active"

        if (
            self.principal_employer and
            hasattr(self.principal_employer, "status") and
            self.principal_employer.status == "Inactive"
        ):
            return "Inactive"

        if self.end_date and self.end_date < today:
            return "Inactive"

        return "Active"

    # =========================
    # ✅ CONTROLLED SAVE
    # =========================

    def save(self, *args, **kwargs):
        today = now().date()

        # 🔥 FIX STRING DATES (GLOBAL SAFETY)
        if isinstance(self.start_date, str):
            self.start_date = date.fromisoformat(self.start_date)

        if isinstance(self.end_date, str):
            self.end_date = date.fromisoformat(self.end_date)

        if isinstance(self.effective_date, str):
            self.effective_date = date.fromisoformat(self.effective_date)

        # 🔥 STATUS LOGIC
        self.status = self.update_status()

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

    # 🔥 ADD THIS (VERY IMPORTANT)
    effective_date = models.DateField(db_index=True)

    old_data = models.JSONField(null=True, blank=True)
    new_data = models.JSONField(null=True, blank=True)

    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["mapping", "effective_date"]),
        ]

    def __str__(self):
        return f"Mapping {self.mapping.id} - {self.change_type}"