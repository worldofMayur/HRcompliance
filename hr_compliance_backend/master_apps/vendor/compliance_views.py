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
from master_apps.principle_employee.models import PrincipalEmployer
from master_apps.vendor.branch_models import VendorBranch
from master_apps.documents.models import DocumentMaster
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
        document_id = request.data.get("document_id")
        state_id = request.data.get("state_id")
        remarks = request.data.get("remarks")

        main_file = request.FILES.get("file")

        if not all([pe_id, branch_id, document_id, main_file]):
            return Response(
                {"error": "Missing required fields"},
                status=400
            )

        # Fetch mapping to auto-fill audit period
        mapping = VendorBranchMapping.objects.filter(
            vendor=vendor,
            principal_employer_id=pe_id,
            branch_id=branch_id,
            document_id=document_id
        ).first()

        if not mapping:
            return Response(
                {"error": "Invalid mapping"},
                status=400
            )

        submission = VendorComplianceSubmission.objects.create(
            vendor=vendor,
            principal_employer_id=pe_id,
            branch_id=branch_id,
            document_id=document_id,
            state=mapping.branch.state.name,
            audit_period=mapping.audit_period,
            main_file=main_file,
            remarks=remarks
        )

        # Save supporting files
        for key, file in request.FILES.items():
            if key.startswith("extra_file_"):
                VendorComplianceSupportingFile.objects.create(
                    submission=submission,
                    file=file
                )

        return Response(
            {"message": "Compliance submitted successfully"},
            status=201
        )