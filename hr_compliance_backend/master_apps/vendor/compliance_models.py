from django.db import models
from master_apps.vendor.models import Vendor
from master_apps.principle_employee.models import PrincipalEmployer
from master_apps.principle_employee.models import PrincipalEmployerBranch
from master_apps.documents.models import DocumentMaster

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

    state = models.CharField(max_length=100)

    audit_period = models.CharField(
        max_length=100,
        null=True,
        blank=True
    )

    main_file = models.FileField(
        upload_to="compliance/main/"
    )

    remarks = models.TextField(
        null=True,
        blank=True
    )

    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.vendor.short_name} - {self.document.name}"

class VendorComplianceSupportingFile(models.Model):

    submission = models.ForeignKey(
        VendorComplianceSubmission,
        on_delete=models.CASCADE,
        related_name="supporting_files"
    )

    file = models.FileField(
        upload_to="compliance/supporting/"
    )

    uploaded_at = models.DateTimeField(auto_now_add=True)