from django.core.management.base import BaseCommand
from documents.models import DocumentMaster


class Command(BaseCommand):
    def handle(self, *args, **kwargs):
        using = "default"

        docs = [
            ("Muster Roll cum Wage Register", "PE", "MONTHLY"),
            ("Attendance Register", "PE", "MONTHLY"),
            ("Pay Slip", "PE", "MONTHLY"),
            ("PF Challan & Remittance Copy", "ALL", "MONTHLY"),
            ("ESIC Contribution Report", "ALL", "MONTHLY"),
        ]

        for name, module, freq in docs:
            DocumentMaster.objects.using(using).get_or_create(
                name=name,
                defaults={
                    "applicable_to": module,
                    "frequency": freq,
                },
            )

        self.stdout.write(self.style.SUCCESS("Document Master seeded successfully"))
