import os
import shutil
from django.conf import settings
from django.db.models.signals import post_delete
from django.dispatch import receiver

from .models import PrincipalEmployer


@receiver(post_delete, sender=PrincipalEmployer)
def delete_principal_employer_folder(sender, instance, **kwargs):
    """
    Deletes document_files/principal_employer/<SHORT_NAME>/ when a PE is deleted
    """

    if not instance.short_name:
        return

    folder_path = os.path.join(
        settings.MEDIA_ROOT,
        "principal_employer",
        instance.short_name
    )

    if os.path.isdir(folder_path):
        shutil.rmtree(folder_path)
