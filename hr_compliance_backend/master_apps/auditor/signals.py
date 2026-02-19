import os
import shutil
from django.conf import settings
from django.db.models.signals import post_delete
from django.dispatch import receiver

from .models import Auditor


@receiver(post_delete, sender=Auditor)
def delete_auditor_folder(sender, instance, **kwargs):
    """
    Deletes documents_files/auditor/<SHORT_NAME>/ when an Auditor is deleted
    """
    if not instance.short_name:
        return

    auditor_folder_path = os.path.join(
        settings.MEDIA_ROOT,
        "auditor",
        instance.short_name
    )

    if os.path.isdir(auditor_folder_path):
        shutil.rmtree(auditor_folder_path)
