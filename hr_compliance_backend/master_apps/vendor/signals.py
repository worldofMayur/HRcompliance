import os
import shutil
from django.conf import settings
from django.db.models.signals import post_delete
from django.dispatch import receiver

from .models import Vendor


@receiver(post_delete, sender=Vendor)
def delete_vendor_folder(sender, instance, **kwargs):
    """
    Deletes vendor/<SHORT_NAME>/ when a Vendor is deleted
    """

    if not instance.short_name:
        return

    folder_name = instance.short_name.replace(" ", "_")  # ✅ ensure consistency

    vendor_folder_path = os.path.join(
        settings.MEDIA_ROOT,
        "vendor",
        folder_name
    )

    if os.path.isdir(vendor_folder_path):
        shutil.rmtree(vendor_folder_path)