from django.contrib.auth.models import AbstractUser
from django.db import models


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

    reset_password_used = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.username} ({self.role})"
