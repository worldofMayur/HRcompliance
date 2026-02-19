import os
import shutil
from django.conf import settings
from django.db.models.signals import post_delete
from django.dispatch import receiver

from .models import Vendor


@receiver(post_delete, sender=Vendor)
def delete_vendor_folder(sender, instance, **kwargs):
    """
    Deletes documents_files/vendor/<SHORT_NAME>/ when a Vendor is deleted
    """
    if not instance.short_name:
        return

    vendor_folder_path = os.path.join(
        settings.MEDIA_ROOT,
        "vendor",
        instance.short_name
    )

    if os.path.isdir(vendor_folder_path):
        shutil.rmtree(vendor_folder_path)
