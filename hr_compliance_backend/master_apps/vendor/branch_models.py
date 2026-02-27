from django.db import models
from .models import Vendor


class BranchState(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class BranchCity(models.Model):
    state = models.ForeignKey(
        BranchState,
        on_delete=models.CASCADE,
        related_name="cities"
    )
    name = models.CharField(max_length=100)

    class Meta:
        unique_together = ("state", "name")

    def __str__(self):
        return f"{self.name} ({self.state.name})"


class VendorBranch(models.Model):
    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.CASCADE,
        related_name="branches"
    )

    state = models.ForeignKey(BranchState, on_delete=models.CASCADE)
    city = models.ForeignKey(BranchCity, on_delete=models.CASCADE)

    address = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.vendor.short_name} - {self.city.name}"