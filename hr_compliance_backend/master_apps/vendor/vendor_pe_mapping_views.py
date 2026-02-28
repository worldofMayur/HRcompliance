from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from master_apps.vendor.mapping_models import VendorBranchMapping
from master_apps.principle_employee.models import PrincipalEmployer
from master_apps.principle_employee.serializers import PrincipalEmployerSerializer


class VendorMappedPEListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        if request.user.role != "VENDOR":
            return Response([])

        vendor = getattr(request.user, "vendor_profile", None)
        if not vendor:
            return Response([])

        # 🔥 Get distinct PE IDs from VendorBranchMapping
        pe_ids = VendorBranchMapping.objects.filter(
            vendor=vendor
        ).values_list("principal_employer_id", flat=True).distinct()

        principal_employers = PrincipalEmployer.objects.filter(
            id__in=pe_ids
        )

        serializer = PrincipalEmployerSerializer(
            principal_employers,
            many=True
        )

        return Response(serializer.data)