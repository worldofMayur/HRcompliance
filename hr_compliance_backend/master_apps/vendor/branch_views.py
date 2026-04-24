from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.utils.timezone import now

from .branch_models import BranchState, VendorBranch
from .mapping_models import VendorBranchMapping
from .branch_serializers import (
    BranchStateSerializer,
    VendorBranchSerializer,
)


class VendorBranchMappingListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        # 🔐 Only show data for logged-in PE (recommended)
        mappings = VendorBranchMapping.objects.select_related(
            "vendor",
            "branch",
            "principal_employer",
            "auditor"
        ).filter(
            principal_employer__user=request.user
        )

        data = []

        today = now().date()  # ✅ current date

        for m in mappings:

            # ✅ STATUS LOGIC
            is_active = True

            if m.end_date:
                is_active = m.end_date >= today
            else:
                is_active = True  # keep active if no end_date

            data.append({
                "id": m.id,

                # ✅ NEW FIELD (FIRST PRIORITY FOR UI)
                "status": "Active" if is_active else "Inactive",

                # 🆕 Vendor details
                "vendor_short_name": m.vendor.short_name if m.vendor else "",
                "vendor_name": m.vendor.name if m.vendor else "",
                "vendor_email": m.vendor.email if m.vendor else "",
                "vendor_mobile": m.vendor.mobile if m.vendor else "",
                "nature_of_services": m.vendor.nature_of_services if m.vendor else "",

                # Mapping details
                "state": m.branch.state if m.branch else "",
                "branch": m.branch.short_name if m.branch else "",
                "start_date": m.start_date,
                "end_date": m.end_date,
                "audit_rule": m.rule,
                "audit_frequency": m.frequency,
                "auditor_name": m.auditor.name if m.auditor else "",
            })

        return Response(data)


# ===============================
# STATE LIST
# ===============================
class BranchStateListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        states = BranchState.objects.all().order_by("name")
        serializer = BranchStateSerializer(states, many=True)
        return Response(serializer.data)


# ===============================
# ADDRESS LIST (FILTER BY STATE)
# ===============================
class BranchAddressListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        state_name = request.GET.get("state")

        if not state_name:
            return Response([], status=status.HTTP_200_OK)

        branches = VendorBranch.objects.filter(
            state__name__iexact=state_name.strip()
        ).select_related("city", "state", "vendor")

        serializer = VendorBranchSerializer(branches, many=True)
        return Response(serializer.data)