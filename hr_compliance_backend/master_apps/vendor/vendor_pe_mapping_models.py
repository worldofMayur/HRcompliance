from django.db import models
from master_apps.vendor.models import Vendor
from master_apps.principle_employee.models import PrincipalEmployer


class VendorPEMapping(models.Model):

    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.CASCADE,
        related_name="pe_mappings"
    )

    principal_employer = models.ForeignKey(
        PrincipalEmployer,
        on_delete=models.CASCADE,
        related_name="vendor_mappings"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("vendor", "principal_employer")

    def __str__(self):
        return f"{self.vendor.short_name} → {self.principal_employer.short_name}"