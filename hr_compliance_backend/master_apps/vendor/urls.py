from django.urls import path
from .views import (
    VendorCreateAPIView,
    VendorListAPIView,
    VendorUpdateAPIView,
    VendorDeleteAPIView,
)

# NEW IMPORTS (mapping engine)
from .mapping_views import (
    VendorBranchMappingCreateAPIView,
    VendorBranchMappingListAPIView,
)
from .vendor_pe_mapping_views import VendorMappedPEListAPIView

urlpatterns = [
    # =========================
    # EXISTING ROUTES (UNCHANGED)
    # =========================
    path("create/", VendorCreateAPIView.as_view()),
    path("list/", VendorListAPIView.as_view()),
    path("<int:pk>/update/", VendorUpdateAPIView.as_view()),
    path("<int:pk>/delete/", VendorDeleteAPIView.as_view()),

    # =========================
    # VENDOR BRANCH MAPPING (NEW)
    # =========================
    path("mapping/create/", VendorBranchMappingCreateAPIView.as_view()),
    path("mapping/list/", VendorBranchMappingListAPIView.as_view()),
    path("mapped-pe/", VendorMappedPEListAPIView.as_view()),
]