from master_apps.checklist.models import *
from master_apps.documents.models import *

state = State.objects.get(name="Punjab")

act, _ = Act.objects.get_or_create(
    name="Punjab Labour Compliance Act"
)

StateAct.objects.get_or_create(
    state=state,
    act=act
)

compliance, _ = ComplianceNature.objects.get_or_create(
    name="General"
)

documents_data = [
    {
        "document": "Appointment Letter",
        "section": "Section 1A",
        "form": "Form I",
        "audit_particulars": "Employee Appointment Verification",
        "guides": [
            "Verify appointment letter is issued to all employees",
            "Check employee designation and joining date correctness",
            "Ensure employee signature is available on appointment letter"
        ]
    },
    {
        "document": "CLRA License",
        "section": "Section 7",
        "form": "Form VI",
        "audit_particulars": "Contract Labour License Verification",
        "guides": [
            "Verify CLRA license validity period",
            "Check contractor name and establishment details",
            "Ensure maximum worker limit is not exceeded"
        ]
    },
    {
        "document": "PF Challan",
        "section": "Section 22",
        "form": "PF Form",
        "audit_particulars": "PF Contribution Verification",
        "guides": [
            "Verify PF challan payment status",
            "Check UAN numbers correctness",
            "Ensure PF deposited within due date"
        ]
    }
]

created_count = 0

for item in documents_data:

    try:
        document = DocumentMaster.objects.get(
            name=item["document"]
        )

    except DocumentMaster.DoesNotExist:
        print("Document not found:", item["document"])
        continue

    section, _ = Section.objects.get_or_create(
        act=act,
        section_number=item["section"],
        defaults={
            "title": item["section"]
        }
    )

    for guide in item["guides"]:

        AuditChecklist.objects.create(
            state=state,
            act=act,
            compliance_nature=compliance,
            section=section,
            document=document,
            audit_particulars=item["audit_particulars"],
            form_number=item["form"],
            auditor_guide=guide,
            is_active=True
        )

        created_count += 1

print("Successfully created", created_count, "rows")