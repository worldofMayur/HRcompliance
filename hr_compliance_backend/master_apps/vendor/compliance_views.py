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
        mappings = VendorBranchMapping.objects.filter(
            vendor=vendor,
            principal_employer_id=pe_id,
            branch_id=branch_id
        )

        valid_mapping_exists = False

        for mapping in mappings:
            apply_pending_updates(mapping)

            new_status = mapping.update_status()
            if mapping.status != new_status:
                mapping.status = new_status
                mapping.save()

            if mapping.status == "Active" and (
                not mapping.end_date or mapping.end_date >= now().date()
            ):
                valid_mapping_exists = True
                break

        if not valid_mapping_exists:
            return Response(
                {"error": "Cannot submit. Contract expired."},
                status=400
            )

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
                mapping_qs = VendorBranchMapping.objects.filter(
                    vendor=vendor,
                    principal_employer_id=pe_id,
                    branch_id=branch_id,
                    documents__id=document_id
                )

                mapping = None

                for m in mapping_qs:
                    apply_pending_updates(m)

                    new_status = m.update_status()
                    if m.status != new_status:
                        m.status = new_status
                        m.save()

                    if m.status == "Active" and (
                        not m.end_date or m.end_date >= now().date()
                    ):
                        mapping = m
                        break

                if not mapping:
                    return Response(
                        {"error": "Contract expired or invalid mapping"},
                        status=400
                    )

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