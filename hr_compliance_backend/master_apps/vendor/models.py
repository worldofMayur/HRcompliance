from django.db import models
import os


def vendor_document_upload_path(instance, filename):
    """
    documents_files/vendor/<SHORT_NAME>/<filename>
    """
    return os.path.join(
        "vendor",
        instance.vendor.short_name,
        filename
    )


class Vendor(models.Model):
    name = models.CharField(max_length=255)
    short_name = models.CharField(max_length=50, unique=True)
    ho_address = models.TextField()

    contact_person = models.CharField(max_length=255)
    mobile = models.CharField(max_length=10, unique=True)
    email = models.EmailField(unique=True)

    start_date = models.DateField()
    end_date = models.DateField()

    # ✅ FREE TEXT (matches input box)
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
