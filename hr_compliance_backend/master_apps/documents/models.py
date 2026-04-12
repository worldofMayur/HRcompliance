from django.db import models
from master_apps.principle_employee.models import PrincipalEmployer

class AuditSubmission(models.Model):
    id = models.BigAutoField(primary_key=True)

    state = models.CharField(max_length=255)

    audit_period = models.CharField(max_length=100)

    main_file = models.FileField(upload_to="compliance/main/")

    remarks = models.TextField(blank=True, null=True)

    submitted_at = models.DateTimeField()

    branch_id = models.IntegerField()

    document_id = models.IntegerField()

    class Meta:
        managed = False   # 🔥 VERY IMPORTANT (table already exists)
        db_table = "compliance_submission"   # 👈 CHANGE THIS if needed

    def __str__(self):
        return str(self.id)

class DocumentMaster(models.Model):
    id = models.BigAutoField(primary_key=True)

    FREQUENCY_MONTHLY = "monthly"
    FREQUENCY_ANNUAL = "annually"
    FREQUENCY_ONE_TIME = "one_time"

    FREQUENCY_CHOICES = (
        ("monthly", "Monthly"),
        ("quarterly", "Quarterly"),
        ("half_yearly", "Half Yearly"),
        ("annually", "Annually"),
        ("one_time", "One Time"),
    )

    name = models.CharField(max_length=255)

    # NEW FIELD
    principal_employer = models.ForeignKey(
        PrincipalEmployer,
        null=True,
        blank=True,
        on_delete=models.CASCADE
    )

    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "document_master"

    def __str__(self):
        return self.name