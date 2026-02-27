from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from .mapping_models import VendorBranchMapping
from .mapping_serializers import VendorBranchMappingSerializer
from master_apps.principle_employee.models import PrincipalEmployer

class VendorBranchMappingCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):

        if request.user.role != "PE":
            return Response({"error": "Unauthorized"}, status=403)

        try:
            pe = PrincipalEmployer.objects.get(
                email=request.user.email
            )
        except PrincipalEmployer.DoesNotExist:
            return Response({"error": "PE profile not found"}, status=400)

        data = request.data.copy()
        data["principal_employer"] = pe.id

        serializer = VendorBranchMappingSerializer(data=data)

        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Mapping created"}, status=201)

        return Response(serializer.errors, status=400)


# ===============================
# LIST BY VENDOR
# ===============================
class VendorBranchMappingListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        vendor_id = request.GET.get("vendor")

        if not vendor_id:
            return Response([], status=200)

        mappings = VendorBranchMapping.objects.filter(
            vendor_id=vendor_id
        ).select_related("vendor", "branch", "auditor", "document")

        serializer = VendorBranchMappingSerializer(mappings, many=True)
        return Response(serializer.data)