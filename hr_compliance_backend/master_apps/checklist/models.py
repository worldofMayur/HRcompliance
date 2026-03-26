from django.db import models


# =========================
# MASTER TABLES
# =========================

class State(models.Model):
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=10, unique=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class Act(models.Model):
    name = models.CharField(max_length=255, unique=True)
    act_code = models.CharField(max_length=50, blank=True, null=True)
    is_central_act = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class StateAct(models.Model):
    state = models.ForeignKey(State, on_delete=models.CASCADE)
    act = models.ForeignKey(Act, on_delete=models.CASCADE)

    class Meta:
        unique_together = ("state", "act")

    def __str__(self):
        return f"{self.state} - {self.act}"


class ComplianceNature(models.Model):
    name = models.CharField(max_length=255, unique=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class Section(models.Model):
    act = models.ForeignKey(Act, on_delete=models.CASCADE)
    section_number = models.CharField(max_length=50)
    title = models.CharField(max_length=255)

    class Meta:
        unique_together = ("act", "section_number")

    def __str__(self):
        return f"{self.section_number} - {self.title}"


class Rule(models.Model):
    section = models.ForeignKey(Section, on_delete=models.CASCADE)
    rule_number = models.CharField(max_length=50)
    description = models.TextField(blank=True, null=True)

    class Meta:
        unique_together = ("section", "rule_number")

    def __str__(self):
        return self.rule_number


# =========================
# CHECKLIST MASTER (UPDATED)
# =========================

class AuditChecklist(models.Model):

    state = models.ForeignKey(State, on_delete=models.PROTECT)
    act = models.ForeignKey(Act, on_delete=models.PROTECT)

    # 🔥 keep this (backend dependency)
    compliance_nature = models.ForeignKey(ComplianceNature, on_delete=models.PROTECT)

    section = models.ForeignKey(Section, on_delete=models.PROTECT)

    # 🔥 OPTIONAL
    rule = models.ForeignKey(Rule, on_delete=models.PROTECT, null=True, blank=True)

    document = models.ForeignKey(
        "documents.DocumentMaster",
        on_delete=models.PROTECT
    )

    # ✅ NEW FIELDS (MATCHES YOUR EXCEL)
    audit_particulars = models.TextField(blank=True, null=True)
    form_number = models.CharField(max_length=100, blank=True, null=True)

    # ✅ MAIN FIELD (Guidelines for Auditor)
    auditor_guide = models.TextField()

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["state", "act"]),
            models.Index(fields=["is_active"]),
        ]

    def __str__(self):
        return f"{self.act} - {self.document}"