from django.db import models
from .models import Vendor
from .branch_models import VendorBranch
from master_apps.auditor.models import Auditor
from master_apps.documents.models import DocumentMaster
from master_apps.principle_employee.models import PrincipalEmployer


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

    # ✅ ADD THIS (VERY IMPORTANT)
    principal_employer = models.ForeignKey(
        PrincipalEmployer,
        on_delete=models.CASCADE,
        related_name="vendor_branch_mappings",
        null=True,
        blank=True
    )

    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.CASCADE,
        related_name="branch_mappings"
    )

    branch = models.ForeignKey(
        VendorBranch,
        on_delete=models.CASCADE,
        related_name="vendor_mappings"
    )

    auditor = models.ForeignKey(
        Auditor,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    document = models.ForeignKey(
        DocumentMaster,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    start_date = models.DateField()
    end_date = models.DateField()

    rule = models.CharField(
        max_length=20,
        choices=RULE_CHOICES
    )

    frequency = models.CharField(
        max_length=20,
        choices=FREQUENCY_CHOICES
    )

    audit_period = models.CharField(
        max_length=100,
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = (
            "principal_employer",
            "vendor",
            "branch",
            "start_date",
        )

    def __str__(self):
        return f"{self.principal_employer.short_name} → {self.vendor.short_name} → {self.branch.address}"