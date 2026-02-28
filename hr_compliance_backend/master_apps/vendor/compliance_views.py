from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction

from .compliance_models import (
    VendorComplianceSubmission,
    VendorComplianceSupportingFile
)
from .models import Vendor
from .mapping_models import VendorBranchMapping


class VendorSubmitComplianceAPIView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):

        if request.user.role != "VENDOR":
            return Response({"error": "Unauthorized"}, status=403)

        vendor = Vendor.objects.get(email=request.user.email)

        pe_id = request.data.get("pe_id")
        branch_id = request.data.get("branch_id")
        state_id = request.data.get("state_id")

        if not all([pe_id, branch_id]):
            return Response(
                {"error": "Missing required fields"},
                status=400
            )

        index = 0

        while True:
            document_id = request.data.get(f"document_{index}_id")
            file = request.FILES.get(f"document_{index}_file")
            remark = request.data.get(f"document_{index}_remark")

            if not document_id or not file:
                break

            # Validate mapping
            mapping = VendorBranchMapping.objects.filter(
                vendor=vendor,
                principal_employer_id=pe_id,
                branch_id=branch_id,
                document_id=document_id
            ).first()

            if not mapping:
                index += 1
                continue

            # Create submission
            VendorComplianceSubmission.objects.create(
                vendor=vendor,
                principal_employer_id=pe_id,
                branch_id=branch_id,
                document_id=document_id,
                state=mapping.branch.state.name,
                audit_period=mapping.audit_period,
                main_file=file,
                remarks=remark
            )

            index += 1

        return Response(
            {"message": "Compliance submitted successfully"},
            status=201
        )