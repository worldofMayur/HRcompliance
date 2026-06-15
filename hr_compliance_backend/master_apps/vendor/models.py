from django.db import models
import os
from accounts.models import User
from django.utils.text import slugify

from master_apps.vendor.path_manager import (
    generate_unique_filename
)

from master_apps.principle_employee.validators import (
    validate_document_file
)


def vendor_document_upload_path(
    instance,
    filename
):

    folder = slugify(
        instance.vendor.short_name
    )

    filename = generate_unique_filename(
        filename
    )

    return os.path.join(

        "vendor",

        folder,

        "master_documents",

        filename
    )


class Vendor(models.Model):

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="vendor_profile"
    )

    name = models.CharField(max_length=255)
    short_name = models.CharField(max_length=50, unique=True)
    ho_address = models.TextField()

    contact_person = models.CharField(max_length=255)
    mobile = models.CharField(max_length=10)
    email = models.EmailField()

    nature_of_services = models.CharField(max_length=100)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class VendorDocument(models.Model):
    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.CASCADE,
        related_name="documents"
    )
    document = models.FileField(
        upload_to=vendor_document_upload_path,
        validators=[validate_document_file]
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return os.path.basename(self.document.name)

class VendorCCEmail(models.Model):
    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.CASCADE,
        related_name="cc_emails"
    )
    email = models.EmailField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.vendor.short_name} - {self.email}"

class SystemNotification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    title = models.CharField(max_length=255)
    message = models.TextField()
    data = models.JSONField(null=True, blank=True)

    type = models.CharField(max_length=20)  # VENDOR / AUDITOR

    is_read = models.BooleanField(default=False)

    branch_id = models.IntegerField(null=True, blank=True)
    audit_period = models.CharField(max_length=100, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)