import os

from django.db.models.signals import post_delete, pre_save
from django.dispatch import receiver

from .compliance_models import (
    VendorComplianceSubmission,
    VendorComplianceSupportingFile,
    VendorComplianceFileVersion,
    ExceptionalApprovalDocument,
)


def delete_file(path):

    if not path:
        return

    if os.path.isfile(path):
        os.remove(path)

    current_dir = os.path.dirname(path)

    while current_dir:

        try:

            if os.listdir(current_dir):
                break

            os.rmdir(current_dir)

            parent = os.path.dirname(current_dir)

            if parent == current_dir:
                break

            current_dir = parent

        except Exception:
            break


# ======================================
# DELETE FILES AFTER MODEL DELETE
# ======================================

@receiver(post_delete, sender=VendorComplianceSubmission)
def delete_submission_files(sender, instance, **kwargs):

    if instance.main_file:
        delete_file(instance.main_file.path)

    if instance.file:
        delete_file(instance.file.path)

    if getattr(instance, "clearance_certificate", None):
        delete_file(instance.clearance_certificate.path)


@receiver(post_delete, sender=VendorComplianceSupportingFile)
def delete_supporting_file(sender, instance, **kwargs):

    if instance.file:
        delete_file(instance.file.path)


@receiver(post_delete, sender=VendorComplianceFileVersion)
def delete_version_file(sender, instance, **kwargs):

    if instance.file:
        delete_file(instance.file.path)


@receiver(post_delete, sender=ExceptionalApprovalDocument)
def delete_exceptional_file(sender, instance, **kwargs):

    if instance.file:
        delete_file(instance.file.path)


# ======================================
# DELETE REPLACED FILES
# ======================================

@receiver(pre_save, sender=VendorComplianceSubmission)
def auto_delete_old_file(sender, instance, **kwargs):

    if not instance.pk:
        return

    try:

        old_instance = VendorComplianceSubmission.objects.get(
            pk=instance.pk
        )

    except VendorComplianceSubmission.DoesNotExist:
        return

    # MAIN FILE REPLACED
    if (
        old_instance.main_file
        and old_instance.main_file != instance.main_file
    ):

        delete_file(old_instance.main_file.path)

    # CLEARANCE CERTIFICATE REPLACED
    if (
        getattr(old_instance, "clearance_certificate", None)
        and old_instance.clearance_certificate != instance.clearance_certificate
    ):

        delete_file(old_instance.clearance_certificate.path)