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

        try:
            vendor = Vendor.objects.get(email=request.user.email)
        except Vendor.DoesNotExist:
            return Response(
                {"error": "Vendor profile not found"},
                status=404
            )

        pe_id = request.data.get("pe_id")
        branch_id = request.data.get("branch_id")
        state_id = request.data.get("state_id")
        selected_period = request.data.get("selected_period")

        if not all([pe_id, branch_id]):
            return Response(
                {"error": "Missing required fields"},
                status=400
            )

        index = 0
        latest_submission = None

        while True:

            file = request.FILES.get(f"document_{index}_file")
            remark = request.data.get(f"document_{index}_remark")
            document_id = request.data.get(f"document_{index}_id")

            # stop when no more files
            if not file:
                break

            # ===============================
            # MAIN COMPLIANCE DOCUMENTS
            # ===============================
            if document_id:

                mapping = VendorBranchMapping.objects.filter(
                    vendor=vendor,
                    principal_employer_id=pe_id,
                    branch_id=branch_id,
                    documents__id=document_id
                ).first()

                if mapping:

                    latest_submission = VendorComplianceSubmission.objects.create(
                        vendor=vendor,
                        principal_employer_id=pe_id,
                        branch_id=branch_id,
                        document_id=document_id,
                        state=mapping.branch.state,
                        audit_period=selected_period,
                        main_file=file,
                        remarks=remark
                    )

            # ===============================
            # ADDITIONAL / EXCEPTION FILES
            # ===============================
            else:

                existing_submission = VendorComplianceSubmission.objects.filter(
                    vendor=vendor,
                    principal_employer_id=pe_id,
                    branch_id=branch_id,
                    audit_period=selected_period
                ).order_by("-submitted_at").first()

                if existing_submission:

                    VendorComplianceSupportingFile.objects.create(
                        submission=existing_submission,
                        file=file
                    )

            index += 1

        return Response(
            {"message": "Compliance submitted successfully"},
            status=201
        )