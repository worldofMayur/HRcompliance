# ================= EXISTING IMPORTS =================
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from django.db import transaction
from django.conf import settings
from master_apps.checklist.models import AuditChecklist
from django.utils.crypto import get_random_string
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.template.loader import render_to_string
from django.utils.timezone import now
from django.core.mail import EmailMultiAlternatives
from django.shortcuts import get_object_or_404
from master_apps.checklist.models import AuditChecklist
from master_apps.vendor.models import VendorCCEmail
from master_apps.vendor.models import SystemNotification
from master_apps.vendor.utils import (
    apply_mapping_for_period,
    audit_period_to_date,
)

from master_apps.documents.models import DocumentMaster


from .models import Auditor, AuditorDocument
from .serializers import AuditorSerializer
from datetime import datetime, date
import calendar

# ================= NEW IMPORTS =================
from master_apps.vendor.mapping_models import VendorBranchMapping
from master_apps.vendor.models import Vendor
from master_apps.principle_employee.models import PrincipalEmployer
from master_apps.vendor.compliance_models import VendorComplianceSubmission

User = get_user_model()

import zipfile
import os
from django.http import HttpResponse
from io import BytesIO
from .models import AuditEntry
import logging

logger = logging.getLogger(__name__)


class AuditorCreateAPIView(APIView):
    def post(self, request):
        try:
            with transaction.atomic():

                email = request.data.get("email")
                mobile = request.data.get("mobile")

                if email:
                    email = email.strip().lower()
                if mobile:
                    mobile = mobile.strip()

                if email and User.objects.filter(email=email).exists():
                    return Response({"error": "Account with this email already exists"}, status=400)

                if mobile and User.objects.filter(mobile=mobile).exists():
                    return Response({"error": "Account with this mobile already exists"}, status=400)

                if email and Auditor.objects.filter(email=email).exists():
                    return Response({"error": "Auditor with this email already exists"}, status=400)

                if mobile and Auditor.objects.filter(mobile=mobile).exists():
                    return Response({"error": "Auditor with this mobile already exists"}, status=400)

                documents = request.FILES.getlist("documents")

                if not documents:
                    return Response({"error": "Please upload at least one document"}, status=400)

                serializer = AuditorSerializer(data=request.data)
                serializer.is_valid(raise_exception=True)
                auditor = serializer.save()

                temp_password = get_random_string(10)

                user = User.objects.create_user(
                    username=auditor.short_name,
                    email=auditor.email.strip().lower() if auditor.email else None,
                    mobile=auditor.mobile,
                    password=temp_password,
                    role="AUDITOR",
                    is_active=True,
                )

                auditor.user = user
                auditor.save(update_fields=["user"])

                user.reset_password_used = False
                user.save(update_fields=["reset_password_used"])

                for doc in documents:
                    AuditorDocument.objects.create(auditor=auditor, document=doc)

                token = PasswordResetTokenGenerator().make_token(user)
                uid = urlsafe_base64_encode(force_bytes(user.pk))

                reset_url = f"{settings.FRONTEND_URL}/TailAdmin/reset-password/{uid}/{token}"
                login_url = f"{settings.FRONTEND_URL}/TailAdmin/signin"

                html_content = render_to_string("emails/password_reset.html", {
                    "contact_person": auditor.name,
                    "role": "Auditor",
                    "company_name": auditor.company,
                    "username": auditor.short_name,
                    "email": auditor.email,
                    "mobile": auditor.mobile,
                    "ho_address": auditor.ho_address,
                    "start_date": auditor.start_date,
                    "end_date": auditor.end_date,
                    "reset_url": reset_url,
                    "login_url": login_url,
                    "year": now().year,
                })

                def send_email():
                    try:
                        email_obj = EmailMultiAlternatives(
                            subject="Activate Your HR Compliance Account",
                            body="Please activate your HR Compliance account.",
                            from_email=settings.DEFAULT_FROM_EMAIL,
                            to=[auditor.email],
                        )
                        email_obj.attach_alternative(html_content, "text/html")
                        email_obj.send()
                    except Exception as e:
                        print("EMAIL ERROR:", str(e))

                transaction.on_commit(send_email)

                return Response({"message": "Auditor created successfully"}, status=201)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

# ================= ZIP DOWNLOAD =================
class DownloadAuditDocumentsZipAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, branch_id):

        import re

        vendor_id = request.GET.get("vendor_id")
        audit_period = request.GET.get("audit_period")
        selected_date = audit_period_to_date(
            audit_period
        )

        submissions = VendorComplianceSubmission.objects.filter(
            branch_id=branch_id,
            vendor_id=vendor_id,
            audit_period=audit_period
        ).select_related("branch", "vendor")

        # ✅ NEW: HANDLE EMPTY CASE
        if not submissions.exists():
            return Response({"error": "No documents found"}, status=404)

        buffer = BytesIO()

        def clean(text):
            return re.sub(r'[^A-Za-z0-9_-]', '_', text or "")

        first_sub = submissions.first()

        vendor_name = first_sub.vendor.short_name if first_sub and first_sub.vendor else "vendor"
        branch_name = first_sub.branch.short_name if first_sub and first_sub.branch else "branch"

        safe_vendor = clean(vendor_name)
        safe_branch = clean(branch_name)
        safe_period = clean(audit_period or "period")

        zip_filename = f"{safe_vendor}_{safe_branch}_{safe_period}.zip"

        with zipfile.ZipFile(buffer, "w") as zip_file:

            for sub in submissions:
                try:
                    if sub.main_file:
                        file_path = sub.main_file.path

                        if os.path.exists(file_path):
                            file_name = os.path.basename(file_path)

                            zip_file.write(
                                file_path,
                                arcname=f"main_documents/{sub.id}_{file_name}"
                            )

                    for supp in sub.supporting_files.all():
                        try:
                            supp_path = supp.file.path

                            if os.path.exists(supp_path):
                                supp_name = os.path.basename(supp_path)

                                zip_file.write(
                                    supp_path,
                                    arcname=f"additional_documents/{sub.id}_{supp_name}"
                                )

                        except Exception as e:
                            print("SUPPORTING FILE ERROR:", str(e))

                except Exception as e:
                    print("ZIP ERROR:", str(e))

        buffer.seek(0)

        response = HttpResponse(buffer, content_type="application/zip")
        response["Content-Disposition"] = f'attachment; filename="{zip_filename}"'

        return response


# ================= SAVE AUDIT (UPDATED ONLY) =================

class SaveAuditAPIView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):

        from django.conf import settings
        from django.core.mail import EmailMultiAlternatives
        from master_apps.vendor.models import VendorCCEmail  # ✅ NEW IMPORT

        branch_id = request.data.get("branch_id")
        audit_period = request.data.get("audit_period")
        entries = request.data.get("entries", [])
        freeze_report = request.data.get("freeze_report", False)

        logger.info("🔄 Audit API called")

        # =========================
        # BASIC VALIDATION
        # =========================
        if not branch_id or not entries:
            return Response({"error": "Missing required data"}, status=400)

        selected_date = audit_period_to_date(
            audit_period
        )

        auditor = getattr(
            request.user,
            "auditor_profile",
            None
        )

        all_mappings = VendorBranchMapping.objects.filter(
            branch_id=branch_id
        ).select_related(
            "vendor",
            "principal_employer",
            "branch"
        )

        mapping = None

        for m in all_mappings:

            virtual_mapping = apply_mapping_for_period(
                m,
                target_date=selected_date
            )

            # ✅ EFFECTIVE AUDITOR CHECK
            if (
                getattr(
                    virtual_mapping,
                    "_virtual_auditor_id",
                    None
                ) == auditor.id
            ):
                mapping = virtual_mapping
                break

        if not mapping:
            return Response(
                {"error": "Unauthorized mapping"},
                status=403
            )

        vendor = mapping.vendor
        pe = mapping.principal_employer
        branch = mapping.branch

        # =========================
        # STRICT VALIDATION (NO SAVE IF FAIL)
        # =========================
        allowed_status = [
            "Complied",
            "Exceptional Approval - Delayed Complied",
            "Not Applicable For Audit Period"
        ]

        all_valid = True

        for entry in entries:
            if entry.get("status") not in allowed_status:
                all_valid = False
                break

        logger.info("✅ Validation checked")
        # =========================
        # SAVE DATA
        # =========================
        for entry in entries:
            AuditEntry.objects.update_or_create(
                checklist_id=entry.get("checklist_id"),
                branch_id=branch_id,
                audit_period=audit_period,
                defaults={
                    "auditor": request.user.auditor_profile,
                    "status": entry.get("status"),
                    "observation": entry.get("observation"),
                    "recommendation": entry.get("recommendation"),
                    "submitted_by": request.user
                }
            )

        logger.info("✅ Audit entries saved")

        # =========================
        # FETCH CC EMAIL FROM DB (FINAL FIX)
        # =========================
        cc_qs = VendorCCEmail.objects.filter(
            vendor_id=vendor.id
        )

        cc_emails = []

        # ✅ Vendor CC emails
        for obj in cc_qs:
            if obj.email:
                cc_emails.append(obj.email.strip())

        # ✅ PE Email
        if pe.email:
            cc_emails.append(pe.email.strip())

        # ✅ Remove duplicates
        cc_emails = list(set(cc_emails))

        print("📧 CC FROM DB:", cc_emails)

        # =========================
        # EMAIL CONTENT
        # =========================
        subject = f"Compliance Clearance Certificate – {audit_period} – {branch.state} – {pe.short_name}"

        html_content = f"""
        <html>
        <body style="background:#f4f6f8; padding:20px; font-family:Arial;">

        <table width="700" align="center" style="background:#fff; border-radius:8px;">
        
        <tr>
            <td style="background:#1e3a8a; color:#fff; padding:20px;">
                <h2>Compliance Clearance Certificate</h2>
                <p>Audit Period: {audit_period}</p>
            </td>
        </tr>

        <tr>
            <td style="padding:25px;">
                <p>Dear <b>{vendor.name}</b>,</p>

                <p>
                We are pleased to inform you that the compliance audit has been successfully completed.
                </p>

                <p>
                Accordingly, the <b>Compliance Clearance Certificate (CC)</b> has been issued.
                </p>

                <table width="100%" style="border-collapse:collapse; margin-top:15px;">
                    <tr style="background:#f1f5f9;">
                        <th style="padding:10px; border:1px solid #ddd;">Particular</th>
                        <th style="padding:10px; border:1px solid #ddd;">Details</th>
                    </tr>
                    <tr>
                        <td style="padding:10px; border:1px solid #ddd;">Principal Employer</td>
                        <td style="padding:10px; border:1px solid #ddd;">{pe.name}</td>
                    </tr>
                    <tr>
                        <td style="padding:10px; border:1px solid #ddd;">State</td>
                        <td style="padding:10px; border:1px solid #ddd;">{branch.state}</td>
                    </tr>
                    <tr>
                        <td style="padding:10px; border:1px solid #ddd;">Branch</td>
                        <td style="padding:10px; border:1px solid #ddd;">{branch.short_name}</td>
                    </tr>
                    <tr>
                        <td style="padding:10px; border:1px solid #ddd;">Audit Period</td>
                        <td style="padding:10px; border:1px solid #ddd;">{audit_period}</td>
                    </tr>
                </table>

                <p style="margin-top:20px;">
                We appreciate your cooperation.
                </p>

                <p>Regards,<br><b>Vendor Compliance Audit Team</b></p>
            </td>
        </tr>

        </table>

        </body>
        </html>
        """

        # =========================
        # SEND EMAIL
        # =========================
        # =========================
        # FINAL FLOW
        # =========================

        if all_valid:
            if freeze_report:
                VendorComplianceSubmission.objects.filter(
                    branch_id=branch_id,
                    vendor_id=vendor.id,
                    audit_period=audit_period
                ).update(
                    is_cc_issued=True,
                    cc_issued_at=now()
                )
            try:
                logger.info(f"📨 Sending → {vendor.email} | CC: {cc_emails}")

                email = EmailMultiAlternatives(
                    subject=subject,
                    body="Compliance Certificate Issued",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    to=[vendor.email],
                    cc=cc_emails
                )

                email.attach_alternative(html_content, "text/html")
                email.send(fail_silently=False)

                SystemNotification.objects.create(
                    user=vendor.user,
                    title="Compliance Clearance Certificate Issued",
                    type="VENDOR",
                    branch_id=branch_id,
                    audit_period=audit_period,
                    data={
                        "vendor": vendor.name,
                        "vendor_id": vendor.id,
                        "branch": branch.short_name,
                        "state": branch.state,
                        "audit_period": audit_period,
                        "status": "CC_ISSUED"
                    }
                )

            except Exception as e:
                logger.error(f"❌ Email failed: {str(e)}")

            return Response({
                "message": "Audit saved & email sent successfully"
            })

# Inside SaveAuditAPIView.post() — replace the notification block

        else:
            logger.info("❌ Invalid audit → creating notification")

            formatted_entries = []

            for entry in entries:
                checklist = AuditChecklist.objects.filter(
                    id=entry.get("checklist_id")
                ).select_related("document").first()

                formatted_entries.append({
                    "checklist_id": entry.get("checklist_id"),
                    "audit_particular": checklist.audit_particulars if checklist else "",
                    "document_id": checklist.document_id if checklist and checklist.document else None,
                    "document_name": checklist.document.name if checklist and checklist.document else "N/A",
                    "status": entry.get("status"),
                    "observation": entry.get("observation"),
                    "recommendation": entry.get("recommendation"),
                })

            SystemNotification.objects.create(
                user=vendor.user,
                title="Audit Requires Action - Re-upload Required",
                type="VENDOR",
                branch_id=branch_id,
                audit_period=audit_period,
                data={
                    "vendor": vendor.name,
                    "vendor_id": vendor.id,
                    "pe_id": pe.id,                    # ← Important
                    "pe_short_name": pe.short_name,
                    "branch_id": branch_id,            # ← Important
                    "branch_short_name": branch.short_name,
                    "state": branch.state,
                    "audit_period": audit_period,
                    "entries": formatted_entries,
                    "action": "reupload"
                }
            )

            return Response({
                "message": "Audit saved. Vendor notified to re-upload documents."
            })

# ================= LIST =================
class AuditorListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        auditors = Auditor.objects.all().order_by("name")
        serializer = AuditorSerializer(auditors, many=True)
        return Response(serializer.data)


# ================= UPDATE =================
class AuditorUpdateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        auditor = get_object_or_404(Auditor, pk=pk)
        serializer = AuditorSerializer(auditor, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Auditor updated successfully"})

        return Response(serializer.errors, status=400)


# ================= DELETE =================
class AuditorDeleteAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        with transaction.atomic():
            auditor = get_object_or_404(Auditor, pk=pk)

            if auditor.user:
                auditor.user.delete()

            auditor.delete()

        return Response({"message": "Auditor deleted successfully"})


# ================= AUDITOR FLOW =================
class AuditorMappedPEAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        today = now().date()

        mappings = VendorBranchMapping.objects.all()

        valid_pe_ids = set()

        auditor = getattr(
            request.user,
            "auditor_profile",
            None
        )

        if not auditor:
            return Response([])

        for mapping in mappings:

            virtual_mapping = apply_mapping_for_period(
                mapping,
                target_date=today
            )

            # ✅ EFFECTIVE AUDITOR CHECK
            if (
                virtual_mapping._virtual_auditor_id
                != auditor.id
            ):
                continue

            # ✅ STATUS CHECK
            if (
                getattr(
                    virtual_mapping,
                    "_virtual_status",
                    "Active"
                )
                != "Active"
            ):
                continue

            valid_pe_ids.add(
                mapping.principal_employer_id
            )

        pes = PrincipalEmployer.objects.filter(
            id__in=valid_pe_ids
        )

        unique_pes = {}

        for pe in pes:
            unique_pes[pe.id] = {
                "id": pe.id,
                "short_name": pe.short_name
            }

        return Response(list(unique_pes.values()))

class AuditorMappedStatesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        pe_id = request.GET.get("pe_id")
        vendor_id = request.GET.get("vendor_id")

        auditor = getattr(
            request.user,
            "auditor_profile",
            None
        )

        if not auditor:
            return Response([])

        today = now().date()

        mappings = VendorBranchMapping.objects.filter(
            principal_employer_id=pe_id,
            vendor_id=vendor_id
        ).select_related("branch")

        states = set()

        for mapping in mappings:

            virtual = apply_mapping_for_period(
                mapping,
                today
            )

            if virtual.branch and virtual.branch.state:
                states.add(virtual.branch.state)

        return Response([
            {
                "id": state,
                "name": state
            }
            for state in states
        ])


class AuditorMappedVendorAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        pe_id = request.GET.get("pe_id")

        auditor = getattr(
            request.user,
            "auditor_profile",
            None
        )

        if not auditor:
            return Response([])

        today = now().date()

        mappings = VendorBranchMapping.objects.filter(
            principal_employer_id=pe_id
        ).select_related("vendor")

        vendor_ids = set()

        for mapping in mappings:

            virtual = apply_mapping_for_period(
                mapping,
                today
            )

            vendor_ids.add(mapping.vendor_id)

        vendors = Vendor.objects.filter(
            id__in=vendor_ids
        )

        return Response([
            {
                "id": v.id,
                "name": v.name
            }
            for v in vendors
        ])

class AuditorMappedBranchesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        pe_id = request.GET.get("pe_id")
        vendor_id = request.GET.get("vendor_id")
        state = request.GET.get("state")

        auditor = getattr(
            request.user,
            "auditor_profile",
            None
        )

        if not auditor:
            return Response([])

        today = now().date()

        mappings = VendorBranchMapping.objects.filter(
            principal_employer_id=pe_id,
            vendor_id=vendor_id
        ).select_related("branch")

        if state:
            mappings = mappings.filter(
                branch__state__iexact=state
            )

        unique_branches = {}

        for mapping in mappings:

            # ✅ CURRENT OWNER
            current_virtual = apply_mapping_for_period(
                mapping,
                target_date=today
            )

            current_auditor_id = getattr(
                current_virtual,
                "_virtual_auditor_id",
                None
            )

            # =========================
            # OLD AUDITOR
            # =========================
            if current_auditor_id != auditor.id:

                # Show only if auditor owned BEFORE
                had_old_access = False

                current = mapping.start_date

                while current and current < today:

                    virtual_old = apply_mapping_for_period(
                        mapping,
                        target_date=current
                    )

                    if (
                        getattr(
                            virtual_old,
                            "_virtual_auditor_id",
                            None
                        ) == auditor.id
                    ):
                        had_old_access = True
                        break

                    # NEXT MONTH
                    if current.month == 12:
                        current = date(
                            current.year + 1,
                            1,
                            1
                        )
                    else:
                        current = date(
                            current.year,
                            current.month + 1,
                            1
                        )

                if not had_old_access:
                    continue

            # =========================
            # VALID BRANCH
            # =========================
            if not mapping.branch:
                continue

            unique_branches[mapping.branch.id] = {
                "id": mapping.branch.id,
                "name": (
                    f"{mapping.branch.short_name} - "
                    f"{mapping.branch.address}"
                )
            }

        return Response(
            list(unique_branches.values())
        )


# ================= CHECKLIST =================
class AuditChecklistAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, branch_id):

        vendor_id = request.GET.get("vendor_id")
        audit_period = request.GET.get("audit_period")

        target_date = audit_period_to_date(
            audit_period
        )

        auditor = getattr(
            request.user,
            "auditor_profile",
            None
        )

        if not auditor:
            return Response([])

        all_mappings = VendorBranchMapping.objects.filter(
            branch_id=branch_id
        ).select_related("branch")

        valid_mapping = None

        for mapping in all_mappings:

            virtual_mapping = apply_mapping_for_period(
                mapping,
                target_date=target_date
            )

            # ✅ HISTORICAL AUDITOR CHECK
            if (
                getattr(
                    virtual_mapping,
                    "_virtual_auditor_id",
                    None
                ) == auditor.id
            ):
                valid_mapping = virtual_mapping
                break

        if not valid_mapping:
            return Response([])

        branch = valid_mapping.branch
        state = branch.state

        submissions = VendorComplianceSubmission.objects.filter(
            branch_id=branch_id,
            vendor_id=vendor_id,
            audit_period=audit_period
        )

        # ✅ ALL vendor submissions map
        submission_map = {
            sub.document_id: sub
            for sub in submissions
            if sub.document_id
        }

        # ✅ PERIOD-BASED DOCUMENT FILTERING

        # ✅ PERIOD-BASED DOCUMENT FILTERING
        doc_ids = getattr(
            valid_mapping,
            "_documents_cache",
            []
        )

        # ✅ ONLY VALID DOCS FOR PERIOD
        checklist_qs = AuditChecklist.objects.filter(
            state__name__iexact=state,
            is_active=True,
            document_id__in=doc_ids
        ).select_related(
            "act",
            "section",
            "document"
        )

        # ✅ SAFE ACCESS
        auditor = getattr(request.user, "auditor_profile", None)

        auditor_doc = None
        if auditor:
            auditor_doc = AuditorDocument.objects.filter(
                auditor=auditor
            ).order_by("-uploaded_at").first()

        response = []

        for item in checklist_qs:
            sub = submission_map.get(item.document_id)

            response.append({
                "id": item.id,
                "state": item.state.name if item.state else "",
                "act_name": item.act.name if item.act else "",
                "audit_particulars": item.audit_particulars or "",
                "section_rule": item.section.section_number if item.section else "",
                "form_number": item.form_number or "",

                # ✅ SAFE DOCUMENT NAME
                "document_name": (
                    item.document.name
                    if item.document
                    else "Document Not Mapped"
                ),

                # ✅ VENDOR FILE
                "vendor_document": (
                    request.build_absolute_uri(sub.main_file.url)
                    if sub and sub.main_file
                    else None
                ),

                # ✅ AUDITOR REFERENCE FILE
                "document": (
                    request.build_absolute_uri(auditor_doc.document.url)
                    if auditor_doc and auditor_doc.document
                    else None
                ),

                "auditor_guide": item.auditor_guide,

                # ✅ PROFESSIONAL STATUS
                "status": (
                    "Uploaded"
                    if sub
                    else "Document Pending"
                ),

                # ✅ UI SUPPORT FLAGS
                "document_available": bool(sub),
                "has_checkpoints": True,
            })

        return Response(response)


# ================= REMARKS =================
class AuditorComplianceRemarksAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        if request.user.role != "AUDITOR":
            return Response([], status=403)

        branch_id = request.GET.get("branch_id")
        vendor_id = request.GET.get("vendor_id")

        submissions = VendorComplianceSubmission.objects.filter(
            branch_id=branch_id,
            vendor_id=vendor_id
        ).select_related("document").order_by("-submitted_at")

        data = {}

        for sub in submissions:

            # ✅ USE audit_period (more accurate)
            date_key = sub.submitted_at.strftime("%Y-%m-%d")

            if date_key not in data:
                data[date_key] = {
                    "date": date_key,
                    "general_remark": None,
                    "documents": []
                }

            if sub.general_remark:
                data[date_key]["general_remark"] = sub.general_remark

            data[date_key]["documents"].append({
                "document_name": sub.document.name if sub.document else "",
                "remark": None,
                "file": sub.main_file.url if sub.main_file else None
            })

        # ✅ SORTED RESPONSE
        return Response(sorted(data.values(), key=lambda x: x["date"], reverse=True))


class AuditorCompliancePeriodAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        pe_id = request.GET.get("pe_id")
        vendor_id = request.GET.get("vendor_id")
        branch_id = request.GET.get("branch_id")

        today = now().date()

        auditor = getattr(
            request.user,
            "auditor_profile",
            None
        )

        if not auditor:
            return Response([])

        mappings = VendorBranchMapping.objects.filter(
            principal_employer_id=pe_id,
            vendor_id=vendor_id,
            branch_id=branch_id
        )

        data = []

        for mapping in mappings:

            start_date = mapping.start_date
            end_date = mapping.end_date

            if not start_date or not end_date:
                continue

            current = date(
                start_date.year,
                start_date.month,
                1
            )

            while current <= end_date:

                # ✅ GET LAST DAY OF MONTH
                last_day = calendar.monthrange(
                    current.year,
                    current.month
                )[1]

                period_end = date(
                    current.year,
                    current.month,
                    last_day
                )

                # ✅ APPLY HISTORY FOR THIS PERIOD
                virtual_mapping = apply_mapping_for_period(
                    mapping,
                    target_date=period_end
                )
                print(
                    "PERIOD:",
                    label,
                    "AUDITOR:",
                    getattr(
                        virtual_mapping,
                        "_virtual_auditor_id",
                        None
                    ),
                    "CURRENT:",
                    auditor.id
                )

            if (
                getattr(
                    virtual_mapping,
                    "_virtual_auditor_id",
                    None
                ) == auditor.id
            ):

                label = current.strftime("%b %Y")

                already_completed = VendorComplianceSubmission.objects.filter(
                    branch_id=branch_id,
                    vendor_id=vendor_id,
                    audit_period=label,
                    is_cc_issued=True
                ).exists()

                if already_completed:
                    continue

                data.append({
                    "value": label,
                    "label": label
                })

                # NEXT MONTH
                if current.month == 12:

                    current = date(
                        current.year + 1,
                        1,
                        1
                    )

                else:

                    current = date(
                        current.year,
                        current.month + 1,
                        1
                    )

        # REMOVE DUPLICATES
        unique = {
            item["value"]: item
            for item in data
        }

        # SORT
        sorted_data = sorted(
            unique.values(),
            key=lambda x: datetime.strptime(
                x["value"],
                "%b %Y"
            )
        )

        return Response(sorted_data)

class AuditorMappingDetailsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        pe_id = request.GET.get("pe_id")
        vendor_id = request.GET.get("vendor_id")
        branch_id = request.GET.get("branch_id")

        today = now().date()

        auditor = getattr(
            request.user,
            "auditor_profile",
            None
        )

        if not auditor:
            return Response({})

        mappings = VendorBranchMapping.objects.filter(
            principal_employer_id=pe_id,
            vendor_id=vendor_id,
            branch_id=branch_id
        )

        for mapping in mappings:

            virtual_mapping = apply_mapping_for_period(
                mapping,
                target_date=today
            )

            if (
                virtual_mapping._virtual_auditor_id
                != auditor.id
            ):
                continue

            return Response({
                "frequency": virtual_mapping._virtual_frequency,

                "start_date": virtual_mapping._virtual_start_date,

                "end_date": virtual_mapping._virtual_end_date
            })

        return Response({})


# ================= NOTIFICATIONS =================

class VendorNotificationAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from master_apps.vendor.models import SystemNotification

        data = SystemNotification.objects.filter(
            user=request.user,
            type="VENDOR"
        ).order_by("-created_at")

        return Response([
            {
                "id": n.id,
                "title": n.title,
                "data": n.data,
                "created_at": n.created_at,
                "is_read": n.is_read
            }
            for n in data
        ])


class MarkNotificationReadAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        from master_apps.vendor.models import SystemNotification

        notif = SystemNotification.objects.filter(
            id=pk,
            user=request.user
        ).first()

        if not notif:
            return Response({"error": "Not found"}, status=404)

        notif.is_read = True
        notif.save()

        return Response({"message": "Marked as read"})