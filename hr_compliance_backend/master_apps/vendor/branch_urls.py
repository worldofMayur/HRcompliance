from django.urls import path
from .branch_views import (
    BranchStateListAPIView,
    BranchAddressListAPIView,
)

urlpatterns = [
    path("branches/states/", BranchStateListAPIView.as_view()),
    path("branches/addresses/", BranchAddressListAPIView.as_view()),

    # ADD THIS
    path("branches/by-state/", BranchAddressListAPIView.as_view()),
]