from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from .branch_models import BranchState, VendorBranch
from .branch_serializers import (
    BranchStateSerializer,
    VendorBranchSerializer,
)


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