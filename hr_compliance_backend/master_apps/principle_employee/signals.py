import os
import shutil
from django.conf import settings
from django.db.models.signals import post_delete
from django.dispatch import receiver

from .models import PrincipalEmployer


@receiver(post_delete, sender=PrincipalEmployer)
def delete_principal_employer_folder(sender, instance, **kwargs):
    """
    Deletes principle_employee/<SHORT_NAME>/ when a PE is deleted
    """

    if not instance.short_name:
        return

    folder_path = os.path.join(
        settings.MEDIA_ROOT,
        "principle_employee",  # ✅ FIXED PATH
        instance.short_name.replace(" ", "_")
    )

    if os.path.isdir(folder_path):
        shutil.rmtree(folder_path)