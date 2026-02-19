from django.db import models

class DocumentMaster(models.Model):
    id = models.BigAutoField(primary_key=True)

    FREQUENCY_MONTHLY = "monthly"
    FREQUENCY_ANNUAL = "annually"
    FREQUENCY_ONE_TIME = "one_time"

    FREQUENCY_CHOICES = (
        (FREQUENCY_MONTHLY, "Monthly"),
        (FREQUENCY_ANNUAL, "Annually"),
        (FREQUENCY_ONE_TIME, "One Time"),
    )

    name = models.CharField(max_length=255, unique=True)
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "document_master"

    def __str__(self):
        return self.name
