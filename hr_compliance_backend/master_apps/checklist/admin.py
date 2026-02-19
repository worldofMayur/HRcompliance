from django.contrib import admin
from .models import (
    State,
    Act,
    StateAct,
    ComplianceNature,
    Section,
    Rule,
    AuditChecklist,
)

admin.site.register(State)
admin.site.register(Act)
admin.site.register(StateAct)
admin.site.register(ComplianceNature)
admin.site.register(Section)
admin.site.register(Rule)
admin.site.register(AuditChecklist)
