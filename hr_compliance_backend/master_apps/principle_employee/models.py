from django.db import models
from django.utils.timezone import now
from .validators import validate_document_file
import os
from accounts.models import User


# =========================
# PRINCIPAL EMPLOYER MODEL
# =========================
class PrincipalEmployer(models.Model):

    # ✅ NEW
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="principalemployer_profile"
    )

    RULES_CHOICES = (
        ("central", "Central"),
        ("state", "State"),
    )

    name = models.CharField(max_length=255)
    short_name = models.CharField(max_length=50, unique=True)
    ho_address = models.TextField()

    contact_person = models.CharField(max_length=255)
    mobile = models.CharField(max_length=10, unique=True)
    email = models.EmailField(unique=True)

    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)

    nature_of_business = models.CharField(max_length=100)
    establishment_type = models.CharField(max_length=100)

    rules_applicable = models.CharField(
        max_length=20,
        choices=RULES_CHOICES,
    )

    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.short_name})"


# =========================
# DOCUMENT UPLOAD PATH
# =========================
def pe_document_upload_path(instance, filename):
    pe_short = instance.principal_employer.short_name.replace(" ", "_")
    return f"principle_employee/{pe_short}/{filename}"


# =========================
# PRINCIPAL EMPLOYER DOCUMENT
# =========================
class PrincipalEmployerDocument(models.Model):
    principal_employer = models.ForeignKey(
        PrincipalEmployer,
        on_delete=models.CASCADE,
        related_name="documents",
    )
    document = models.FileField(
        upload_to=pe_document_upload_path,
        validators=[validate_document_file],
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return os.path.basename(self.document.name)


# =========================
# PRINCIPAL EMPLOYER BRANCH
# =========================
class PrincipalEmployerBranch(models.Model):

    STATUS_CHOICES = (
        ("active", "Active"),
        ("closed", "Closed"),
    )

    principal_employer = models.ForeignKey(
        PrincipalEmployer,
        on_delete=models.CASCADE,
        related_name="branches",
    )

    state = models.CharField(max_length=100)
    short_name = models.CharField(max_length=100)
    address = models.TextField()

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="active"
    )

    document = models.FileField(
        upload_to="principal_employer_branches/",
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)