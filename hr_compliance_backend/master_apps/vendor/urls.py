from django.urls import path
from .views import (
    VendorCreateAPIView,
    VendorListAPIView,
    VendorUpdateAPIView,
    VendorDeleteAPIView,
)
from .mapping_views import (
    VendorBranchMappingCreateAPIView,
    VendorBranchMappingListAPIView,
    VendorMappedPEAPIView,
    VendorMappedStatesAPIView,
    VendorMappedBranchesAPIView,
    VendorMappedDocumentsAPIView,
)
from .compliance_views import VendorSubmitComplianceAPIView


urlpatterns = [

    # EXISTING ROUTES
    path("create/", VendorCreateAPIView.as_view()),
    path("list/", VendorListAPIView.as_view()),
    path("<int:pk>/update/", VendorUpdateAPIView.as_view()),
    path("<int:pk>/delete/", VendorDeleteAPIView.as_view()),

    # MAPPING
    path("mapping/create/", VendorBranchMappingCreateAPIView.as_view()),
    path("mapping/list/", VendorBranchMappingListAPIView.as_view()),

    # DROPDOWNS
    path("mapped-pe/", VendorMappedPEAPIView.as_view()),
    path("mapped-states/", VendorMappedStatesAPIView.as_view()),
    path("mapped-branches/", VendorMappedBranchesAPIView.as_view()),
    path("mapped-documents/", VendorMappedDocumentsAPIView.as_view()),

    # ✅ SUBMIT COMPLIANCE (FIXED)
    path("submit-compliance/", VendorSubmitComplianceAPIView.as_view()),
]