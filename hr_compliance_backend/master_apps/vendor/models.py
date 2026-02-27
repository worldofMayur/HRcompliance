from django.db import models
import os
from accounts.models import User


def vendor_document_upload_path(instance, filename):
    return os.path.join(
        "vendor",
        instance.vendor.short_name,
        filename
    )


class Vendor(models.Model):

    # ✅ NEW (safe nullable link)
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
    mobile = models.CharField(max_length=10, unique=True)
    email = models.EmailField(unique=True)

    start_date = models.DateField()
    end_date = models.DateField()

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
    document = models.FileField(upload_to=vendor_document_upload_path)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return os.path.basename(self.document.name)