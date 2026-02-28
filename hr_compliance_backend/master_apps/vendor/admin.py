from django.contrib import admin

from .mapping_models import VendorBranchMapping
from .compliance_models import (
    VendorComplianceSubmission,
    VendorComplianceSupportingFile
)

admin.site.register(VendorBranchMapping)
admin.site.register(VendorComplianceSubmission)
admin.site.register(VendorComplianceSupportingFile)