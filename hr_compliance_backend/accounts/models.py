from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator


class User(AbstractUser):
    ROLE_CHOICES = (
        ("SUPERADMIN", "Super Admin"),
        ("PE", "Principal Employer"),
        ("VENDOR", "Vendor"),
        ("AUDITOR", "Auditor"),
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default="PE"
    )

    # ✅ Email should be unique and normalized
    email = models.EmailField(unique=True)

    # ✅ Mobile validation (10 digit Indian format)
    mobile = models.CharField(
        max_length=10,
        unique=True,
        null=True,
        blank=True,
        validators=[
            RegexValidator(
                regex=r'^\d{10}$',
                message="Mobile number must be exactly 10 digits"
            )
        ]
    )

    # ✅ Prevent reuse of reset link
    reset_password_used = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        # ✅ Normalize email to avoid duplicates like TEST@gmail.com vs test@gmail.com
        if self.email:
            self.email = self.email.strip().lower()

        # ✅ Normalize username (safe, doesn't break existing logic)
        if self.username:
            self.username = self.username.strip()

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.username} ({self.role})"


def is_business_active(self):
    """
    Check if linked business account is active.
    DOES NOT block login, only used for API-level control.
    """

    if self.role == "PE":
        pe = getattr(self, "principalemployer_profile", None)
        if pe and pe.status == "Inactive":
            return False

    if self.role == "VENDOR":
        vendor = getattr(self, "vendor_profile", None)
        if vendor:
            # If ALL mappings inactive → block
            if not vendor.branch_mappings.filter(status="Active").exists():
                return False

    return True