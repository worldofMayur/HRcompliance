# ================= EXISTING IMPORTS =================
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from django.db import transaction
from django.conf import settings
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


from .models import Auditor, AuditorDocument
from .serializers import AuditorSerializer


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

        invalid_entries = []

        for i, entry in enumerate(entries):
            status_val = entry.get("status")
            observation = entry.get("observation")
            recommendation = entry.get("recommendation")

            if status_val not in allowed_status:
                invalid_entries.append({
                    "row": i + 1,
                    "error": f"Invalid status: {status_val}"
                })
                continue

            if not observation or not recommendation:
                invalid_entries.append({
                    "row": i + 1,
                    "error": "Observation & Recommendation are required"
                })

        if invalid_entries:
            return Response({
                "error": "Validation failed",
                "details": invalid_entries
            }, status=400)

        logger.info("✅ Validation passed")

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

            sent = email.send(fail_silently=False)

            print("📧 EMAIL STATUS:", "SENT" if sent else "FAILED")

        except Exception as e:
            logger.error(f"❌ Email failed: {str(e)}")

        return Response({
            "message": "Audit saved & email sent successfully"
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

        submitted_document_ids = submissions.values_list("document_id", flat=True)

        submission_map = {
            sub.document_id: sub
            for sub in submissions
        }

        checklist_qs = AuditChecklist.objects.filter(
            state__name__iexact=state,
            is_active=True,
            document_id__in=submitted_document_ids
        ).select_related("act", "section", "document")

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
                "state": item.state.name,
                "act_name": item.act.name,
                "audit_particulars": item.audit_particulars,
                "section_rule": item.section.section_number if item.section else "",
                "form_number": item.form_number,
                "document_name": item.document.name if item.document else "",
                "document": request.build_absolute_uri(auditor_doc.document.url)
                if auditor_doc and auditor_doc.document else None,
                "auditor_guide": item.auditor_guide,
                "status": "Complied" if sub else "Not Complied",
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
