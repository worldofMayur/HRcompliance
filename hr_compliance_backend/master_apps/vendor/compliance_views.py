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
    VendorComplianceSupportingFile,
    VendorComplianceFileVersion,
    ExceptionalApprovalDocument
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
from .constants import WorkflowStatus
from master_apps.auditor.models import AuditSession
from master_apps.vendor.models import SystemNotification
from master_apps.vendor.mapping_models import VendorBranchMapping


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
        if selected_period:
            selected_period = (
                selected_period
                .replace("–", "-")
                .strip()
            )
        workflow_status = request.data.get(
            "workflow_status",
            WorkflowStatus.SUBMITTED
        )
        general_remark = request.data.get("general_remark")
        male_employees = request.data.get("male_employees")
        female_employees = request.data.get("female_employees")

        gross_wages = request.data.get("gross_wages")
        net_wages = request.data.get("net_wages")

        pf_remittance_date = request.data.get("pf_remittance_date")
        esic_remittance_date = request.data.get("esic_remittance_date")
        rc_remittance_date = request.data.get("rc_remittance_date")
        lwf_remittance_date = request.data.get("lwf_remittance_date")

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

        document_count = int(
            request.data.get("document_count", 0)
        )

        latest_submission = None

        remark_saved = False

        for index in range(document_count):

            file = request.FILES.get(f"document_{index}_file")
            document_id = request.data.get(
                f"document_{index}_id"
            )

            is_additional = (
                request.data.get(
                    f"document_{index}_is_additional"
                ) == "true"
            )

            if document_id and not is_additional:

                try:

                    document_id = int(
                        str(document_id).strip()
                    )

                except Exception:

                    continue

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

                # 🚫 PREVENT DUPLICATE SUBMISSION
                existing_submission = (
                    VendorComplianceSubmission.objects.filter(
                        vendor=vendor,
                        principal_employer_id=pe_id,
                        branch_id=branch_id,
                        document_id=document_id,
                        audit_period__iexact=selected_period
                    )
                    .exclude(
                        workflow_status=WorkflowStatus.REUPLOAD_REQUESTED
                    )
                    .first()
                )

                if existing_submission:

                    if existing_submission.is_frozen:

                        return Response({

                            "error": (
                                "This audit period is already finalized "
                                "and frozen."
                            )

                        }, status=400)

                    return Response({

                        "error": (
                            f"{existing_submission.document.name} "
                            f"already submitted for this period."
                        )

                    }, status=400)

                latest_submission = VendorComplianceSubmission.objects.create(
                    vendor=vendor,
                    principal_employer_id=pe_id,
                    branch_id=branch_id,
                    document_id=document_id,
                    state=mapping.branch.state,
                    audit_period=selected_period,

                    male_employees=male_employees,
                    female_employees=female_employees,

                    gross_wages=gross_wages,
                    net_wages=net_wages,

                    pf_remittance_date=pf_remittance_date,
                    esic_remittance_date=esic_remittance_date,
                    rc_remittance_date=rc_remittance_date,
                    lwf_remittance_date=lwf_remittance_date,

                    main_file=file,
                    workflow_status=workflow_status,
                    original_filename=file.name,
                    general_remark=general_remark if not remark_saved else None,
                    cc_emails=cc_emails if not remark_saved else None,
                )

                VendorComplianceFileVersion.objects.create(

                    submission=latest_submission,

                    file=latest_submission.main_file,

                    version=latest_submission.version,

                    is_reupload=False
                )

                remark_saved = True  # ✅ mark as saved

                # ===============================
                # 📁 AUTO CREATE CC ISSUE FOLDER
                # ===============================

                from pathlib import Path
                from django.conf import settings

                from master_apps.vendor.path_manager import (
                    build_submission_base_path
                )

                base_path = build_submission_base_path(
                    vendor=latest_submission.vendor,
                    pe=latest_submission.principal_employer,
                    branch=latest_submission.branch,
                    audit_period=latest_submission.audit_period,
                )

            # ===============================
            # 📎 ADDITIONAL FILES
            # ===============================
            elif is_additional:

                parent_document_id = request.data.get(
                    f"document_{index}_parent_id"
                )

                if not parent_document_id:
                    continue

                existing_submission = (
                    VendorComplianceSubmission.objects.filter(
                        vendor=vendor,
                        principal_employer_id=pe_id,
                        branch_id=branch_id,
                        audit_period__iexact=selected_period,
                        document_id=parent_document_id
                    )
                    .order_by("-submitted_at")
                    .first()
                )

                if (
                    existing_submission
                    and
                    existing_submission.is_frozen
                ):
                    return Response(
                        {
                            "error": (
                                "Cannot upload additional documents "
                                "for finalized audit."
                            )
                        },
                        status=400
                    )

                if existing_submission:

                    VendorComplianceSupportingFile.objects.create(
                        submission=existing_submission,
                        file=file
                    )

                    print(
                        "✅ SUPPORTING FILE SAVED:",
                        file.name
                    )

        # ===============================
        # 🔔 NOTIFY AUDITOR
        # ===============================

        mapping = VendorBranchMapping.objects.filter(
            vendor=vendor,
            principal_employer_id=pe_id,
            branch_id=branch_id
        ).select_related("auditor").first()

        if (
            mapping and
            mapping.auditor and
            getattr(mapping.auditor, "user", None)
        ):

            print("NOTIFICATION DATA:", {
                "pe_id": int(pe_id),
                "vendor_id": vendor.id,
                "branch_id": int(branch_id),
                "state": mapping.branch.state,
                "branch": mapping.branch.short_name,
                "audit_period": selected_period,
            })

            SystemNotification.objects.create(
                user=mapping.auditor.user,
                title="Compliance Submitted",
                message=f"{vendor.short_name} submitted compliance documents",
                type="AUDITOR",
                branch_id=int(branch_id),
                audit_period=selected_period,
                data={
                    "pe_id": int(pe_id),
                    "vendor_id": vendor.id,
                    "branch_id": int(branch_id),

                    "vendor": vendor.short_name,
                    "vendor_name": vendor.name,

                    "pe_name": mapping.principal_employer.name,
                    "state": mapping.branch.state,
                    "branch": mapping.branch.short_name,

                    "audit_period": selected_period,

                    "document_count": document_count,

                    "submitted_at": now().strftime(
                        "%d-%b-%Y %I:%M %p"
                    ),
                }
            )
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

        if branch_id:

            branch_id = int(
                str(branch_id).strip()
            )

        selected_period = request.data.get(
            "selected_period"
        )
        if selected_period:
            selected_period = (
                selected_period
                .replace("–", "-")
                .strip()
            )

        general_remark = request.data.get(
            "general_remark",
            ""
        )

        uploaded_count = 0

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

                if document_id:

                    try:

                        document_id = int(
                            str(document_id).strip()
                        )

                    except Exception:

                        continue

                uploaded_file = request.FILES[key]

                is_additional = (
                    request.data.get(
                        f"document_{index}_is_additional"
                    ) == "true"
                )

                if is_additional:

                    parent_document_id = request.data.get(
                        f"document_{index}_parent_id"
                    )

                    if not parent_document_id:
                        continue

                    submission = (
                        VendorComplianceSubmission.objects.filter(
                            vendor=vendor,
                            branch_id=branch_id,
                            document_id=parent_document_id,
                            audit_period__iexact=selected_period,
                        )
                        .order_by("-id")
                        .first()
                    )

                    if submission:

                        VendorComplianceSupportingFile.objects.create(
                            submission=submission,
                            file=uploaded_file
                        )

                        print(
                            "✅ REUPLOAD ADDITIONAL FILE:",
                            uploaded_file.name
                        )

                        uploaded_count += 1

                    continue

                if not document_id:
                    continue

                

                # ===============================
                # 🔍 FIND EXISTING SUBMISSION
                # ===============================

                print("REUPLOAD QUERY VALUES")

                print({
                    "vendor": vendor.id,
                    "branch": branch_id,
                    "document": document_id,
                    "period": selected_period,
                })

                submission = (
                    VendorComplianceSubmission.objects
                    .filter(
                        vendor=vendor,
                        branch_id=branch_id,
                        document_id=document_id,
                        audit_period__iexact=selected_period,
                    )
                    .order_by("-id")
                    .first()
                )
                print("AVAILABLE SUBMISSIONS")
                print("NORMALIZED PERIOD:", selected_period)

                all_submissions = VendorComplianceSubmission.objects.all()

                print("===== ALL DB SUBMISSIONS =====")

                for s in all_submissions:

                    print({
                        "id": s.id,
                        "vendor": s.vendor_id,
                        "branch": s.branch_id,
                        "document": s.document_id,
                        "period": s.audit_period,
                        "workflow": s.workflow_status,
                    })

                print("===== END =====")

                for s in all_submissions:

                    print({
                        "id": s.id,
                        "doc": s.document_id,
                        "period": s.audit_period,
                        "workflow": s.workflow_status,
                    })

                if not submission:

                    print(
                        "REUPLOAD SUBMISSION NOT FOUND"
                    )

                    print(
                        "PERIOD:",
                        selected_period
                    )

                    print(
                        "DOCUMENT:",
                        document_id
                    )

                    continue

                # ===============================
                # ❄️ BLOCK FROZEN AUDITS
                # ===============================

                if (

                    submission.is_frozen

                    or

                    submission.is_cc_issued
                ):

                    return Response({

                        "error": (
                            "This audit has already been finalized "
                            "and CC issued. "
                            "Reupload not allowed."
                        )

                    }, status=400)

                # ===============================
                # 💾 STORE OLD FILE
                # ===============================

                # ===============================
                # 📚 STORE VERSION HISTORY
                # ===============================

                if submission.main_file:

                    VendorComplianceFileVersion.objects.create(

                        submission=submission,

                        file=submission.main_file,

                        version=submission.version,

                        is_reupload=True
                    )


                # ===============================
                # 📄 UPDATE FILE
                # ===============================

                submission.is_reuploaded = True

                submission.version += 1

                reupload_version = VendorComplianceFileVersion.objects.create(
                    submission=submission,
                    file=uploaded_file,
                    version=submission.version,
                    is_reupload=True
                )

                # IMPORTANT:
                # DO NOT REPLACE ORIGINAL MAIN FILE

                print(
                    "\n🔁 REUPLOAD VERSION SAVED:",
                    reupload_version.file.name
                )

                # ===============================
                # 🔁 REUPLOAD FLAGS
                # ===============================

                submission.is_reuploaded = True
                submission.workflow_status = (
                    WorkflowStatus.REUPLOADED
                )

                submission.has_exceptional_approval = False

                ExceptionalApprovalDocument.objects.filter(
                    submission=submission
                ).delete()

                submission.is_cc_issued = False

                submission.cc_issued_at = None

                submission.clearance_email_sent = False

                submission.clearance_email_sent_at = None

                submission.clearance_certificate = None

                submission.audit_report_pdf = None

                # =========================
                # RESET AUDIT SESSION
                # =========================

                AuditSession.objects.filter(
                    branch_id=branch_id,
                    audit_period=selected_period
                ).update(
                    status="DRAFT"
                )

                submission.reuploaded_at = timezone.now()

                submission.general_remark = (
                    general_remark
                )

                # optional overwrite latest remark
                submission.general_remark = (
                    general_remark
                )

                submission.save()

                print(
                    "\n🔁 REUPLOAD COMPLETE:",
                    submission.main_file.name
                )

                uploaded_count += 1

            except Exception as inner_error:

                print(
                    "INNER REUPLOAD ERROR:",
                    str(inner_error)
                )

        if uploaded_count == 0:
            return Response({

                "error": (
                    "No matching compliance "
                    "submission found for reupload."
                )

            }, status=404)

        # ===============================
        # 🔔 SEND NOTIFICATION TO AUDITOR
        # ===============================

        mapping = None

        mapping_qs = VendorBranchMapping.objects.filter(
            vendor=vendor,
            branch_id=branch_id
        ).select_related("auditor")

        for m in mapping_qs:

            apply_pending_updates(m)

            new_status = m.update_status()

            if m.status != new_status:

                m.status = new_status
                m.save()

            if (
                m.status == "Active"
                and (
                    not m.end_date
                    or m.end_date >= now().date()
                )
            ):
                mapping = m
                break

        auditor_users = []

        if mapping and mapping.auditor and mapping.auditor.user:

            auditor_users = [
                mapping.auditor.user
            ]

        for auditor in auditor_users:

            SystemNotification.objects.create(
                user=auditor,

                title=(
                    "Compliance Reupload Submitted"
                ),

                message=(
                    f"{vendor.short_name} has submitted "
                    f"reuploaded compliance documents "
                    f"for {selected_period} review."
                ),

                type="AUDITOR",

                branch_id=submission.branch_id,

                audit_period=selected_period,

                data={

                    "pe_id": submission.principal_employer.id,

                    "vendor_id": vendor.id,

                    "branch_id": submission.branch.id,

                    "state": submission.state,

                    "vendor": vendor.short_name,

                    "branch": submission.branch.short_name,

                    "audit_period": selected_period,

                    "reuploaded": True,

                    "document_id": submission.document.id,

                    "submission_id": submission.id,

                    "vendor_remark": submission.general_remark or "",

                    "status": "REUPLOAD_PENDING"
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
            workflow_status=WorkflowStatus.FROZEN
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