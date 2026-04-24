from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from django.utils.timezone import now
from django.db.models import Q
import json

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

        # 🔐 Role Check
        if request.user.role != "VENDOR":
            return Response({"error": "Unauthorized"}, status=403)

        # 🔍 Get Vendor
        try:
            vendor = Vendor.objects.get(email=request.user.email)
        except Vendor.DoesNotExist:
            return Response(
                {"error": "Vendor profile not found"},
                status=404
            )

        # 📥 Request Data
        pe_id = request.data.get("pe_id")
        branch_id = request.data.get("branch_id")
        selected_period = request.data.get("selected_period")
        general_remark = request.data.get("general_remark")

        # ✅ NEW: CC EMAILS
        cc_emails = request.data.get("cc_emails")
        if cc_emails:
            try:
                cc_emails = json.loads(cc_emails)
            except:
                cc_emails = []
        else:
            cc_emails = []

        if not all([pe_id, branch_id]):
            return Response(
                {"error": "Missing required fields"},
                status=400
            )

        # 🚨 CRITICAL: BLOCK EXPIRED CONTRACT
        active_mapping_exists = VendorBranchMapping.objects.filter(
            vendor=vendor,
            principal_employer_id=pe_id,
            branch_id=branch_id
        ).filter(
            Q(end_date__isnull=True) | Q(end_date__gte=now().date())
        ).exists()

        if not active_mapping_exists:
            return Response(
                {"error": "Cannot submit. Contract expired."},
                status=400
            )

        index = 0
        latest_submission = None
        remark_saved = False  # ✅ ensures remark saved only once

        # 🔁 Loop through uploaded documents
        while True:

            file = request.FILES.get(f"document_{index}_file")
            document_id = request.data.get(f"document_{index}_id")

            # 🛑 Stop loop when no more files
            if not file:
                break

            # ===============================
            # 📄 MAIN DOCUMENTS
            # ===============================
            if document_id:

                mapping = VendorBranchMapping.objects.filter(
                    vendor=vendor,
                    principal_employer_id=pe_id,
                    branch_id=branch_id,
                    documents__id=document_id
                ).filter(
                    Q(end_date__isnull=True) | Q(end_date__gte=now().date())
                ).first()

                # 🚨 HARD BLOCK (extra safety)
                if not mapping:
                    return Response(
                        {"error": "Contract expired or invalid mapping"},
                        status=400
                    )

                latest_submission = VendorComplianceSubmission.objects.create(
                    vendor=vendor,
                    principal_employer_id=pe_id,
                    branch_id=branch_id,
                    document_id=document_id,
                    state=mapping.branch.state,
                    audit_period=selected_period,
                    main_file=file,
                    general_remark=general_remark if not remark_saved else None,
                    cc_emails=cc_emails if not remark_saved else None  # ✅ NEW
                )

                remark_saved = True  # ✅ mark as saved

            # ===============================
            # 📎 ADDITIONAL FILES
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