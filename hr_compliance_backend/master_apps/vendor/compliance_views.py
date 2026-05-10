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
from .utils import apply_pending_updates
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from accounts.models import User
from .models import SystemNotification


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
            
        active_mapping_exists = mapping is not None

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


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def reupload_compliance(request):

    try:

        # ===============================
        # 🔐 ROLE CHECK
        # ===============================

        if request.user.role != "VENDOR":
            return Response(
                {"error": "Unauthorized"},
                status=403
            )

        # ===============================
        # 🔍 GET VENDOR
        # ===============================

        try:

            vendor = Vendor.objects.get(
                email=request.user.email
            )

        except Vendor.DoesNotExist:

            return Response(
                {"error": "Vendor profile not found"},
                status=404
            )

        # ===============================
        # 📥 REQUEST DATA
        # ===============================

        branch_id = request.data.get("branch_id")

        selected_period = request.data.get(
            "selected_period"
        )

        general_remark = request.data.get(
            "general_remark",
            ""
        )

        uploaded_count = 0
        reuploaded_documents = []

        # ===============================
        # 🔁 LOOP FILES
        # ===============================

        for key in request.FILES:

            if not key.endswith("_file"):
                continue

            try:

                index = key.split("_")[1]

                document_id = request.data.get(
                    f"document_{index}_id"
                )

                uploaded_file = request.FILES[key]

                if not document_id:
                    continue

                # ===============================
                # 🔍 FIND EXISTING SUBMISSION
                # ===============================

                submission = (
                    VendorComplianceSubmission.objects
                    .filter(
                        vendor=vendor,
                        document_id=document_id,
                        audit_period=selected_period,
                        branch_id=branch_id
                    )
                    .order_by("-submitted_at")
                    .first()
                )

                if not submission:
                    continue

                # ===============================
                # 💾 STORE OLD FILE
                # ===============================

                if submission.main_file:
                    submission.previous_file = (
                        submission.main_file
                    )

                # ===============================
                # 📄 UPDATE FILE
                # ===============================

                submission.main_file = uploaded_file

                # ===============================
                # 🔁 REUPLOAD FLAGS
                # ===============================

                submission.is_reuploaded = True

                submission.reuploaded_at = timezone.now()

                submission.reupload_remark = (
                    general_remark
                )

                # optional overwrite latest remark
                submission.general_remark = (
                    general_remark
                )

                submission.save()

                uploaded_count += 1
                reuploaded_documents.append(
                    submission.document.name
                )

            except Exception as inner_error:

                print(
                    "INNER REUPLOAD ERROR:",
                    str(inner_error)
                )

        # ===============================
        # 🔔 SEND NOTIFICATION TO AUDITOR
        # ===============================

        auditor_users = User.objects.filter(
            role="AUDITOR"
        )

        for auditor in auditor_users:

            SystemNotification.objects.create(
                user=auditor,

                title=(
                    "Vendor Reuploaded "
                    "Compliance Documents"
                ),

                message=(
                    f"{vendor.short_name} has "
                    f"reuploaded compliance "
                    f"documents."
                ),

                type="AUDITOR",

                branch_id=branch_id,

                audit_period=selected_period,

                data={

                    "pe_id": submission.principal_employer.id,

                    "vendor_id": vendor.id,

                    "branch_id": submission.branch.id,

                    "state": submission.state,

                    "vendor": vendor.short_name,

                    "branch": str(submission.branch),

                    "audit_period": selected_period,

                    "reuploaded": True,

                    "reuploaded_documents": reuploaded_documents,

                    "document_id": submission.document.id,

                    "submission_id": submission.id,

                    "vendor_remark": submission.general_remark or "",
                }
            )

        # ===============================
        # ✅ SUCCESS RESPONSE
        # ===============================

        return Response({

            "message": (
                "Documents reuploaded "
                "successfully"
            ),

            "uploaded_count": uploaded_count

        }, status=200)

    except Exception as e:

        print(
            "REUPLOAD API ERROR:",
            str(e)
        )

        return Response({

            "error": str(e)

        }, status=500)

class FrozenAuditPeriodsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        vendor_id = request.GET.get("vendor_id")
        branch_id = request.GET.get("branch_id")

        if not branch_id:
            return Response([])

        qs = VendorComplianceSubmission.objects.filter(
            branch_id=branch_id,
            is_cc_issued=True
        )

        # ✅ Auditor side
        if vendor_id:
            qs = qs.filter(vendor_id=vendor_id)

        # ✅ Vendor side
        elif request.user.role == "VENDOR":
            qs = qs.filter(
                vendor=request.user.vendor_profile
            )

        periods = list(
            qs.values_list(
                "audit_period",
                flat=True
            ).distinct()
        )

        return Response(periods)