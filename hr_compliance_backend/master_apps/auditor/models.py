from django.db import models


class Auditor(models.Model):
    name = models.CharField(max_length=255)
    short_name = models.CharField(max_length=50, unique=True)
    company = models.CharField(max_length=255)
    ho_address = models.TextField()
    mobile = models.CharField(max_length=10)
    email = models.EmailField(unique=True)
    start_date = models.DateField()
    end_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


def auditor_document_path(instance, filename):
    return f"auditor/{instance.auditor.short_name}/{filename}"


class AuditorDocument(models.Model):
    auditor = models.ForeignKey(
        Auditor,
        related_name="documents",
        on_delete=models.CASCADE
    )
    document = models.FileField(upload_to=auditor_document_path)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.auditor.short_name} document"
