from django.db import models
from .models import Vendor
from master_apps.principle_employee.models import PrincipalEmployerBranch
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

    created_at = models.DateTimeField(auto_now_add=True)