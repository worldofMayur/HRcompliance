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
from .models import Auditor, AuditorDocument
from .serializers import AuditorSerializer
from master_apps.vendor.utils import apply_mapping_for_period
from datetime import datetime
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

                # ... after creating html_content ...

                def send_email():
                    try:
                        email = EmailMultiAlternatives(
                            subject="Activate Your HR Compliance Account",
                            body="Please activate your account",
                            from_email=settings.DEFAULT_FROM_EMAIL,
                            to=[auditor.email],
                        )

                        email.attach_alternative(html_content, "text/html")
                        email.send(print("EMAIL SENT SUCCESSFULLY"))
                        logger.info(f"✅ Activation email sent to {auditor.email}")
                    except Exception as e:
                        logger.error(f"❌ EMAIL ERROR to {auditor.email}: {str(e)}", exc_info=True)

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

        logger.info("🔄 Audit API called")

        # =========================
        # BASIC VALIDATION
        # =========================
        if not branch_id or not entries:
            return Response({"error": "Missing required data"}, status=400)

        mapping = VendorBranchMapping.objects.filter(
            auditor__user=request.user,
            branch_id=branch_id
        ).select_related("vendor", "principal_employer", "branch").first()

        if not mapping:
            return Response({"error": "Unauthorized mapping"}, status=403)

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
        cc_qs = VendorCCEmail.objects.filter(vendor_id=vendor.id)

        cc_emails = []
        for obj in cc_qs:
            if obj.email:
                cc_emails.append(obj.email.strip())

        # remove duplicates + limit to 2
        cc_emails = list(set(cc_emails))[:2]

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
            try:
                logger.info(f"📨 Sending compliance email to {vendor.email}")

                resend.api_key = settings.RESEND_API_KEY

                r = resend.Emails.send({
                    "from": f"HR Compliance <{settings.DEFAULT_FROM_EMAIL}>",
                    "to": vendor.email,
                    "cc": cc_emails,
                    "subject": subject,
                    "html": html_content,
                })

                logger.info("✅ Compliance email sent successfully")

                return Response({
                    "message": "Audit saved & email sent successfully"
                })

            except Exception as e:
                logger.error(f"❌ Email sending failed: {str(e)}", exc_info=True)
                return Response({
                    "message": "Audit saved successfully (email sending failed)"
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
        mappings = VendorBranchMapping.objects.filter(
            auditor__user=request.user
        )

        pe_ids = mappings.values_list("principal_employer_id", flat=True).distinct()
        pes = PrincipalEmployer.objects.filter(id__in=pe_ids)

        return Response([{"id": pe.id, "short_name": pe.short_name} for pe in pes])

class AuditorMappedStatesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        pe_id = request.GET.get("pe_id")
        vendor_id = request.GET.get("vendor_id")

        if request.user.role != "AUDITOR":
            return Response([])

        mappings = VendorBranchMapping.objects.filter(
            auditor__user=request.user,
            principal_employer_id=pe_id,
            vendor_id=vendor_id
        ).select_related("branch")

        states = set()

        for m in mappings:
            if m.branch and m.branch.state:
                states.add(m.branch.state)

        return Response([
            {"id": state, "name": state}
            for state in states
        ])


class AuditorMappedVendorAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        pe_id = request.GET.get("pe_id")

        mappings = VendorBranchMapping.objects.filter(
            auditor__user=request.user,
            principal_employer_id=pe_id
        )

        vendor_ids = mappings.values_list("vendor_id", flat=True).distinct()
        vendors = Vendor.objects.filter(id__in=vendor_ids)

        return Response([{"id": v.id, "name": v.name} for v in vendors])


class AuditorMappedBranchesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        pe_id = request.GET.get("pe_id")
        vendor_id = request.GET.get("vendor_id")
        state = request.GET.get("state")

        mappings = VendorBranchMapping.objects.filter(
            auditor__user=request.user,
            principal_employer_id=pe_id,
            vendor_id=vendor_id
        ).select_related("branch")

        if state:
            mappings = mappings.filter(branch__state__iexact=state)

        return Response([
            {
                "id": m.branch.id,
                "name": f"{m.branch.short_name} - {m.branch.address}"
            }
            for m in mappings
        ])


# ================= CHECKLIST =================
class AuditChecklistAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, branch_id):

        vendor_id = request.GET.get("vendor_id")
        audit_period = request.GET.get("audit_period")

        mappings = VendorBranchMapping.objects.filter(
            auditor__user=request.user,
            branch_id=branch_id
        ).select_related("branch")

        if not mappings.exists():
            return Response([])

        branch = mappings.first().branch
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

        mapping = mappings.first()

        target_date = now().date()

        try:
            if audit_period and "–" in audit_period:

                # Example: Jan–Mar 2026
                end_part = audit_period.split("–")[1].strip()

                month_name, year = end_part.split()

                month_number = datetime.strptime(month_name, "%b").month

                last_day = calendar.monthrange(
                    int(year),
                    month_number
                )[1]

                target_date = datetime(
                    int(year),
                    month_number,
                    last_day
                ).date()

        except Exception as e:
            print("PERIOD PARSE ERROR:", str(e))

        # ✅ APPLY VIRTUAL MAPPING
        virtual_mapping = apply_mapping_for_period(
            mapping,
            target_date=target_date
        )

        doc_ids = getattr(
            virtual_mapping,
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

        mappings = VendorBranchMapping.objects.filter(
            auditor__user=request.user,
            principal_employer_id=pe_id,
            vendor_id=vendor_id,
            branch_id=branch_id
        )

        data = []

        for m in mappings:
            data.append({
                "frequency": m.frequency,
                "start_date": m.start_date,
                "end_date": m.end_date,
                "label": f"{m.frequency} ({m.start_date} - {m.end_date})"
            })

        return Response(data)

class AuditorMappingDetailsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        pe_id = request.GET.get("pe_id")
        vendor_id = request.GET.get("vendor_id")
        branch_id = request.GET.get("branch_id")

        mapping = VendorBranchMapping.objects.filter(
            auditor__user=request.user,
            principal_employer_id=pe_id,
            vendor_id=vendor_id,
            branch_id=branch_id
        ).first()

        if not mapping:
            return Response({})

        return Response({
            "frequency": mapping.frequency,
            "start_date": mapping.start_date,
            "end_date": mapping.end_date
        })


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