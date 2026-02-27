from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .vendor_pe_mapping_models import VendorPEMapping
from master_apps.principle_employee.serializers import PrincipalEmployerSerializer


class VendorMappedPEListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "VENDOR":
            return Response([])

        vendor = getattr(request.user, "vendor_profile", None)
        if not vendor:
            return Response([])

        mappings = VendorPEMapping.objects.filter(
            vendor=vendor
        ).select_related("principal_employer")

        pe_list = [m.principal_employer for m in mappings]

        serializer = PrincipalEmployerSerializer(pe_list, many=True)
        return Response(serializer.data)