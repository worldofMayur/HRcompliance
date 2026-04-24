from django.urls import path
from .branch_views import (
    BranchStateListAPIView,
    BranchAddressListAPIView,
)
from .branch_views import VendorBranchMappingListAPIView


urlpatterns = [
    path("branches/states/", BranchStateListAPIView.as_view()),
    path("branches/addresses/", BranchAddressListAPIView.as_view()),

    # ADD THIS
    path("branches/by-state/", BranchAddressListAPIView.as_view()),
    path("vendor-mapping/list/", VendorBranchMappingListAPIView.as_view()),
]