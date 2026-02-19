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


class ComplianceNature(models.Model):
    name = models.CharField(max_length=255, unique=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class Section(models.Model):
    act = models.ForeignKey(Act, on_delete=models.CASCADE)
    section_number = models.CharField(max_length=50)
    title = models.CharField(max_length=255)

    def __str__(self):
        return f"{self.section_number} - {self.title}"


class Rule(models.Model):
    section = models.ForeignKey(Section, on_delete=models.CASCADE)
    rule_number = models.CharField(max_length=50)
    description = models.TextField()

    def __str__(self):
        return self.rule_number


# =========================
# CHECKLIST MASTER
# =========================

class AuditChecklist(models.Model):
    state = models.ForeignKey(State, on_delete=models.PROTECT)
    act = models.ForeignKey(Act, on_delete=models.PROTECT)
    compliance_nature = models.ForeignKey(ComplianceNature, on_delete=models.PROTECT)
    section = models.ForeignKey(Section, on_delete=models.PROTECT)
    rule = models.ForeignKey(Rule, on_delete=models.PROTECT)
    document = models.ForeignKey(
        "documents.DocumentMaster",
        on_delete=models.PROTECT
    )

    auditor_guide = models.TextField()
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.act} - {self.document}"
