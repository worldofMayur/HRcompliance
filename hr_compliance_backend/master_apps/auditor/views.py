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

from master_apps.documents.models import (
    DocumentMaster,
    ComplianceAuditArchive
)

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
from io import BytesIO
from .models import AuditEntry, AuditSession
from django.core.files.base import ContentFile

from master_apps.vendor.constants import (
    WorkflowStatus
)

from master_apps.vendor.compliance_models import (
    ExceptionalApprovalDocument
)

import logging

logger = logging.getLogger(__name__)

from io import BytesIO

from django.http import HttpResponse, FileResponse
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from reportlab.platypus import (
    SimpleDocTemplate,
    Spacer,
    Paragraph,
    Table,
    TableStyle,
)

from reportlab.lib import colors

from reportlab.lib.styles import getSampleStyleSheet

from reportlab.lib.pagesizes import A4

from reportlab.platypus.flowables import HRFlowable

from reportlab.lib.enums import TA_LEFT

from reportlab.lib.styles import ParagraphStyle

from master_apps.auditor.models import AuditEntry


class DownloadCCPDFAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, audit_id):

        entry = get_object_or_404(
            AuditEntry.objects.select_related(
                "checklist"
            ),
            id=audit_id
        )

        buffer = BytesIO()

        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=35,
            leftMargin=35,
            topMargin=30,
            bottomMargin=30,
        )

        styles = getSampleStyleSheet()

        elements = []

        # ==========================================
        # DATA
        # ==========================================

        vendor_name = getattr(
            entry,
            "vendor_name",
            "Vendor"
        )

        pe_name = getattr(
            entry,
            "pe_name",
            "PE"
        )

        state_name = (
            entry.checklist.state.name
            if entry.checklist
            and entry.checklist.state
            else "-"
        )

        mapping = (
            VendorBranchMapping.objects.filter(
                branch_id=entry.branch_id
            )
            .select_related("branch")
            .first()
        )

        branch_name = (
            mapping.branch.short_name
            if mapping and mapping.branch
            else "-"
        )

        audit_period = entry.audit_period or "-"

        generated_on = now().strftime(
            "%d %b %Y %I:%M %p"
        )

        all_entries = AuditEntry.objects.filter(
            branch_id=entry.branch_id,
            audit_period=entry.audit_period
        )

        total_entries = all_entries.count()

        complied_entries = all_entries.filter(
            status__in=[
                "Complied",
                "Not Applicable For Audit Period",
                "Exceptional Approval - Delayed Complied",
            ]
        ).count()


        # ==========================================
        # CUSTOM STYLES
        # ==========================================

        title_style = ParagraphStyle(
            "title_style",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=20,
            textColor=colors.white,
            leading=28,
        )

        normal_style = ParagraphStyle(
            "normal_style",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=11,
            leading=20,
            textColor=colors.HexColor("#111827"),
        )

        bold_style = ParagraphStyle(
            "bold_style",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=11,
            leading=20,
            textColor=colors.HexColor("#111827"),
        )

        # ==========================================
        # HEADER BOX
        # ==========================================

        header_table = Table(
            [[
                Paragraph(
                    "Compliance Clearance Certificate",
                    title_style
                ),
            ]],
            colWidths=[520]
        )

        header_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#243B8A")),
            ("LEFTPADDING", (0, 0), (-1, -1), 20),
            ("RIGHTPADDING", (0, 0), (-1, -1), 20),
            ("TOPPADDING", (0, 0), (-1, -1), 22),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 22),
        ]))

        elements.append(header_table)

        # ==========================================
        # AUDIT PERIOD STRIP
        # ==========================================

        audit_strip = Table(
            [[
                Paragraph(
                    f"<b>Audit Period:</b> {audit_period}",
                    ParagraphStyle(
                        "strip_style",
                        parent=styles["Normal"],
                        textColor=colors.white,
                        fontSize=11,
                        leading=18,
                    )
                )
            ]],
            colWidths=[520]
        )

        audit_strip.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#2F4AA0")),
            ("LEFTPADDING", (0, 0), (-1, -1), 20),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
            ("TOPPADDING", (0, 0), (-1, -1), 10),
        ]))

        elements.append(audit_strip)

        elements.append(Spacer(1, 18))

        status_table = Table(
            [[

                Paragraph(
                    "<b>FINAL STATUS:</b> COMPLIED",
                    ParagraphStyle(
                        "status_style",
                        parent=styles["Normal"],
                        textColor=colors.HexColor("#166534"),
                        fontSize=10,
                    )
                ),

                Paragraph(
                    f"<b>Generated On:</b> {generated_on}",
                    ParagraphStyle(
                        "generated_style",
                        parent=styles["Normal"],
                        textColor=colors.HexColor("#374151"),
                        fontSize=10,
                        alignment=2,
                    )
                )

            ]],
            colWidths=[260, 260]
        )

        status_table.setStyle(TableStyle([

            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#ECFDF5")),

            ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#BBF7D0")),

            ("LEFTPADDING", (0, 0), (-1, -1), 14),

            ("RIGHTPADDING", (0, 0), (-1, -1), 14),

            ("TOPPADDING", (0, 0), (-1, -1), 10),

            ("BOTTOMPADDING", (0, 0), (-1, -1), 10),

        ]))

        elements.append(status_table)

        elements.append(Spacer(1, 26))
        # ==========================================
        # GREETING
        # ==========================================

        elements.append(
            Paragraph(
                f"Dear <b>{vendor_name}</b>,",
                normal_style
            )
        )

        elements.append(Spacer(1, 10))

        elements.append(
            Paragraph(
                "We are pleased to inform you that the compliance audit has been successfully completed.",
                normal_style
            )
        )

        elements.append(Spacer(1, 6))

        elements.append(
            Paragraph(
                "Accordingly, the <b>Compliance Clearance Certificate (CC)</b> has been issued.",
                normal_style
            )
        )

        elements.append(Spacer(1, 25))

        highlights_title = Paragraph(
            "<b>Compliance Highlights</b>",
            bold_style
        )

        elements.append(highlights_title)

        elements.append(Spacer(1, 10))

        highlights = [

            "• Compliance audit successfully completed",

            "• Vendor documents verified by auditor",

            "• Compliance Clearance Certificate approved",

            "• Audit finalized and frozen in system",
        ]

        for item in highlights:

            elements.append(
                Paragraph(
                    item,
                    normal_style
                )
            )

            elements.append(Spacer(1, 5))

        elements.append(Spacer(1, 20))

        # ==========================================
        # DETAILS TABLE
        # ==========================================

        details_data = [

            [
                Paragraph("<b>Particular</b>", bold_style),
                Paragraph("<b>Details</b>", bold_style),
            ],

            [
                "Principal Employer",
                pe_name,
            ],

            [
                "State",
                state_name,
            ],

            [
                "Branch",
                branch_name,
            ],

            [
                "Audit Period",
                audit_period,
            ],

            [
                "Generated On",
                generated_on,
            ],
        ]

        details_table = Table(
            details_data,
            colWidths=[260, 260]
        )

        details_table.setStyle(TableStyle([

            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F3F4F6")),

            ("TEXTCOLOR", (0, 0), (-1, 0), colors.black),

            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),

            ("FONTSIZE", (0, 0), (-1, -1), 10.5),

            ("BOTTOMPADDING", (0, 0), (-1, 0), 12),

            ("TOPPADDING", (0, 0), (-1, 0), 12),

            ("GRID", (0, 0), (-1, -1), 0.8, colors.HexColor("#D1D5DB")),

            ("BACKGROUND", (0, 1), (-1, -1), colors.white),

            ("LEFTPADDING", (0, 0), (-1, -1), 14),

            ("RIGHTPADDING", (0, 0), (-1, -1), 14),

            ("TOPPADDING", (0, 1), (-1, -1), 12),

            ("BOTTOMPADDING", (0, 1), (-1, -1), 12),

            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),

        ]))

        elements.append(details_table)

        has_exceptional = all_entries.filter(
            status__icontains="Exceptional Approval"
        ).exists()

        if has_exceptional:

            elements.append(Spacer(1, 18))

            exceptional_note = Table(
                [[
                    Paragraph(
                        (
                            "<b>Exceptional Approval Note:</b> "
                            "This certificate contains "
                            "auditor approved exceptional "
                            "compliance observations."
                        ),
                        ParagraphStyle(
                            "exception_style",
                            parent=styles["Normal"],
                            textColor=colors.HexColor("#92400E"),
                            fontSize=10,
                            leading=18,
                        )
                    )
                ]],
                colWidths=[520]
            )

            exceptional_note.setStyle(TableStyle([

                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FEF3C7")),

                ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#F59E0B")),

                ("LEFTPADDING", (0, 0), (-1, -1), 14),

                ("RIGHTPADDING", (0, 0), (-1, -1), 14),

                ("TOPPADDING", (0, 0), (-1, -1), 12),

                ("BOTTOMPADDING", (0, 0), (-1, -1), 12),

            ]))

            elements.append(exceptional_note)

        elements.append(Spacer(1, 28))

        elements.append(
            Paragraph(
                "We appreciate your cooperation.",
                normal_style
            )
        )

        elements.append(Spacer(1, 18))

        elements.append(
            Paragraph(
                "Regards,<br/><b>Vendor Compliance Audit Team</b>",
                normal_style
            )
        )

        elements.append(Spacer(1, 30))

        elements.append(
            HRFlowable(
                width="100%",
                color=colors.HexColor("#D1D5DB")
            )
        )

        elements.append(Spacer(1, 12))

        elements.append(
            Paragraph(
                (
                    "This digitally generated certificate is "
                    "issued through HR Compliance Portal.<br/><br/>"

                    f"<b>Generated On:</b> {generated_on}<br/>"

                    "<b>Generated By:</b> Vendor Compliance Audit Team<br/><br/>"

                    "This is a system generated document "
                    "and does not require physical signature."
                ),
                ParagraphStyle(
                    "footer_style",
                    parent=styles["Normal"],
                    fontSize=9,
                    textColor=colors.HexColor("#6B7280"),
                    alignment=TA_LEFT,
                )
            )
        )

        # ==========================================
        # BUILD PDF
        # ==========================================

        doc.build(elements)

        pdf = buffer.getvalue()

        buffer.close()

        response = HttpResponse(
            content_type="application/pdf"
        )

        safe_vendor = vendor_name.replace(" ", "_")
        safe_period = audit_period.replace(" ", "_")

        response[
            "Content-Disposition"
        ] = (
            f'inline; filename="'
            f'{safe_vendor}_{safe_period}_CC.pdf"'
        )

        response.write(pdf)

        return response


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

        filters = {
            "branch_id": branch_id,
        }

        if audit_period:
            filters["audit_period"] = audit_period

        if vendor_id:
            filters["vendor_id"] = vendor_id

        submissions = VendorComplianceSubmission.objects.filter(
            **filters
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

                            # ======================================
                            # REUPLOADED DOC SUPPORT
                            # ======================================

                            reuploaded_document_names = request.GET.getlist(
                                "reuploaded_documents"
                            )

                            folder_name = "main_documents"

                            if (
                                sub.document and
                                sub.document.name in reuploaded_document_names
                            ):
                                folder_name = "reuploaded_documents"

                            zip_file.write(
                                file_path,
                                arcname=f"{folder_name}/{sub.id}_{file_name}"
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

                    for exceptional in sub.exceptional_documents.all():

                        try:

                            exceptional_path = exceptional.file.path

                            if os.path.exists(exceptional_path):

                                exceptional_name = os.path.basename(
                                    exceptional_path
                                )

                                zip_file.write(

                                    exceptional_path,

                                    arcname=(
                                        "exceptional_approval_documents/"
                                        f"{sub.id}_{exceptional_name}"
                                    )
                                )

                        except Exception as e:

                            print(
                                "EXCEPTION FILE ERROR:",
                                str(e)
                            )

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
        if audit_period:
            audit_period = (
                audit_period
                .replace("–", "-")
                .strip()
            )
        import json

        entries = request.data.get("entries", "[]")

        if isinstance(entries, str):

            try:

                entries = json.loads(entries)

            except Exception:

                return Response({

                    "error": "Invalid entries payload"

                }, status=400)
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

        already_frozen = (
            VendorComplianceSubmission.objects.filter(
                branch_id=branch_id,
                vendor_id=vendor.id,
                audit_period=audit_period,
                is_frozen=True
            ).exists()
        )

        if already_frozen:

            return Response({

                "error": (
                    "This audit period is frozen "
                    "and cannot be modified."
                )

            }, status=400)


        # ======================================
        # FREEZE ELIGIBLE STATUSES
        # ======================================

        FREEZE_ALLOWED_STATUSES = [

            "Complied",

            "Not Applicable For Audit Period",

            "Exceptional Approval - Delayed Complied",
        ]


        # ======================================
        # CHECK FREEZE ELIGIBILITY
        # ======================================

        all_valid = all(

            entry.get("status")
            in FREEZE_ALLOWED_STATUSES

            for entry in entries
        )

        for entry in entries:

            status_value = entry.get("status")

            if status_value in [
                "Exceptional Approval - Delayed Complied",
                "Exceptional Approval- Not Complied"
            ]:

                checklist_id = entry.get(
                    "checklist_id"
                )

                support_file = request.FILES.get(
                    f"exceptional_file_{checklist_id}"
                )

                if not support_file:

                    return Response({

                        "error": (
                            "Supporting document mandatory "
                            "for Exceptional Approval."
                        )

                    }, status=400)

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

                        # ======================================
            # 📎 SAVE EXCEPTIONAL APPROVAL FILE
            # ======================================

            status_value = entry.get("status")

            if status_value in [
                "Exceptional Approval - Delayed Complied",
                "Exceptional Approval- Not Complied"
            ]:

                checklist_id = entry.get(
                    "checklist_id"
                )

                support_file = request.FILES.get(
                    f"exceptional_file_{checklist_id}"
                )

                if support_file:

                    related_submission = (
                        VendorComplianceSubmission.objects.filter(
                            branch_id=branch_id,
                            vendor_id=vendor.id,
                            audit_period=audit_period,
                            document_id=entry.get("document_id")
                        ).first()
                    )

                    if related_submission:

                        ExceptionalApprovalDocument.objects.filter(
                            submission=related_submission
                        ).delete()

                        ExceptionalApprovalDocument.objects.create(
                            submission=related_submission,
                            file=support_file,
                            remark=entry.get("observation", "")
                        )

                        related_submission.has_exceptional_approval = True

                        related_submission.workflow_status = (
                            WorkflowStatus.EXCEPTIONAL_APPROVAL
                        )

                        related_submission.save()

        logger.info("✅ Audit entries saved")

        AuditSession.objects.update_or_create(

            auditor=request.user.auditor_profile,

            branch_id=branch_id,

            audit_period=audit_period,

            defaults={

                "status": (
                    "FROZEN"
                    if freeze_report and all_valid
                    else "SUBMITTED"
                )
            }
        )

        saved_entry = AuditEntry.objects.filter(
            branch_id=branch_id,
            audit_period=audit_period
        ).first()

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

                {
                    '''
                    <div style="
                        margin-top:20px;
                        padding:14px;
                        background:#FEF3C7;
                        border:1px solid #F59E0B;
                        border-radius:6px;
                        color:#92400E;
                    ">
                        <b>Note:</b>
                        This audit contains Exceptional Approval observations.
                    </div>
                    '''
                    if any(

                        entry.get("status") in [

                            "Exceptional Approval - Delayed Complied",

                            "Exceptional Approval- Not Complied"
                        ]

                        for entry in entries
                    )
                    else ""
                }

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
        # GENERATE PDF BYTES
        # =========================

        pdf_bytes = html_content.encode("utf-8")
        # =========================
        # SEND EMAIL
        # =========================
        # =========================
        # FINAL FLOW
        # =========================

        if all_valid:

            if freeze_report and all_valid:

                VendorComplianceSubmission.objects.filter(

                    branch_id=branch_id,

                    vendor_id=vendor.id,

                    audit_period=audit_period

                ).update(

                    is_cc_issued=True,

                    cc_issued_at=now(),

                    workflow_status=WorkflowStatus.FROZEN,

                    is_frozen=True,

                    frozen_at=now(),

                    clearance_email_sent=True,

                    clearance_email_sent_at=now()
                )

                # ======================================
                # 📦 SAVE CC PDF ARCHIVE
                # ======================================

                try:

                    archive_filename = (
                        f"{vendor.short_name}_"
                        f"{audit_period}_CC.pdf"
                    ).replace(" ", "_")

                    all_submissions = VendorComplianceSubmission.objects.filter(

                        branch_id=branch_id,

                        vendor_id=vendor.id,

                        audit_period=audit_period
                    )

                    for submission in all_submissions:

                        try:

                            archive = ComplianceAuditArchive.objects.create(

                                vendor_submission=submission,

                                archive_type="CC_PDF",

                                uploaded_by=request.user,

                                remarks="Auto archived CC PDF"
                            )

                            print(
                                "SAVING CC ARCHIVE TO:",
                                archive.file.name
                            )

                            archive.file.save(

                                archive_filename,

                                ContentFile(
                                    pdf_bytes
                                ),

                                save=True
                            )

                        except Exception as e:

                            logger.error(
                                f"CC ARCHIVE SAVE ERROR: {str(e)}"
                            )

                except Exception as archive_error:

                    logger.error(
                        f"ARCHIVE ERROR: {str(archive_error)}"
                    )

                # ======================================
                # AUTO MARK RELATED AUDITOR NOTIFICATIONS
                # ======================================

                SystemNotification.objects.filter(

                    branch_id=branch_id,

                    audit_period=audit_period,

                    type="AUDITOR",

                    is_read=False,

                ).update(
                    is_read=True
                )

            try:

                logger.info(
                    f"📨 Sending → {vendor.email} | CC: {cc_emails}"
                )

                email = EmailMultiAlternatives(
                    subject=subject,
                    body="Compliance Certificate Issued",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    to=[vendor.email],
                    cc=cc_emails
                )

                email.attach_alternative(
                    html_content,
                    "text/html"
                )

                email.send(fail_silently=False)

                try:
                    all_submissions = VendorComplianceSubmission.objects.filter(

                        branch_id=branch_id,

                        vendor_id=vendor.id,

                        audit_period=audit_period
                    )

                    for submission in all_submissions:

                        try:

                            archive = ComplianceAuditArchive.objects.create(

                                vendor_submission=submission,

                                archive_type="CLEARANCE_EMAIL",

                                uploaded_by=request.user,

                                remarks="Clearance email archived"
                            )

                            print(
                                "SAVING EMAIL ARCHIVE TO:",
                                archive.file.name
                            )

                            archive.file.save(

                                (
                                    f"{vendor.short_name}_"
                                    f"{audit_period}_"
                                    f"clearance_email.html"
                                ).replace(" ", "_"),

                                ContentFile(
                                    pdf_bytes
                                ),

                                save=True
                            )

                        except Exception as e:

                            logger.error(
                                f"EMAIL ARCHIVE ERROR: {str(e)}"
                            )

                except Exception as archive_error:

                    logger.error(
                        f"EMAIL ARCHIVE ERROR: {str(archive_error)}"
                    )

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

                        "status": "CC_ISSUED",

                        "pdf_download_url": (
                            request.build_absolute_uri(
                                f"/api/auditor/download-cc-pdf/{saved_entry.id}/"
                            )
                        ),
                    },
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

        # ======================================
        # REUPLOAD FILTER SUPPORT
        # ======================================

        reuploaded_document_names = request.GET.getlist(
            "reuploaded_documents"
        )

        if reuploaded_document_names:

            reuploaded_document_names = [
                x.strip().lower()
                for x in reuploaded_document_names
            ]

        for item in checklist_qs:
            sub = submission_map.get(item.document_id)

            document_name = (
                item.document.name.strip().lower()
                if item.document and item.document.name
                else ""
            )

            if (
                reuploaded_document_names
                and document_name not in reuploaded_document_names
            ):
                continue

            existing_entry = AuditEntry.objects.filter(
                checklist_id=item.id,
                branch_id=branch_id,
                audit_period=audit_period
            ).first()

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

                "is_reuploaded": (
                    sub.is_reuploaded
                    if sub
                    else False
                ),

                "reupload_remark": (
                    sub.reupload_remark
                    if sub
                    else ""
                ),

                "workflow_status": (
                    sub.workflow_status
                    if sub
                    else None
                ),
                "status": (
                    existing_entry.status
                    if existing_entry else ""
                ),

                "observation": (
                    existing_entry.observation
                    if existing_entry else ""
                ),

                "recommendation": (
                    existing_entry.recommendation
                    if existing_entry else ""
                ),
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

                # ======================================
                # 📅 LAST DAY OF CURRENT MONTH
                # ======================================

                last_day = calendar.monthrange(
                    current.year,
                    current.month
                )[1]

                period_end = date(
                    current.year,
                    current.month,
                    last_day
                )

                # ======================================
                # 🔄 APPLY MAPPING HISTORY
                # ======================================

                virtual_mapping = apply_mapping_for_period(
                    mapping,
                    target_date=period_end
                )

                # ======================================
                # 👤 VALID AUDITOR CHECK
                # ======================================

                if (
                    getattr(
                        virtual_mapping,
                        "_virtual_auditor_id",
                        None
                    ) == auditor.id
                ):

                    label = current.strftime("%b %Y")

                    # ======================================
                    # ❄️ SKIP FROZEN / COMPLETED PERIODS
                    # ======================================

                    already_completed = (
                        VendorComplianceSubmission.objects.filter(
                            branch_id=branch_id,
                            vendor_id=vendor_id,
                            audit_period=label,
                            is_frozen=True
                        ).exists()
                    )

                    if not already_completed:

                        data.append({
                            "value": label,
                            "label": label
                        })

                # ======================================
                # ➡️ NEXT MONTH
                # ======================================

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

        # ======================================
        # 🧹 REMOVE DUPLICATES
        # ======================================

        unique = {
            item["value"]: item
            for item in data
        }

        # ======================================
        # 📊 SORT PERIODS
        # ======================================

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

        # =====================================
        # ROLE BASED NOTIFICATION TYPE
        # =====================================

        notification_type = (
            "AUDITOR"
            if request.user.role == "AUDITOR"
            else "VENDOR"
        )

        data = SystemNotification.objects.filter(
            user=request.user,
            type=notification_type
        ).order_by("-created_at")

        return Response([
            {
                "id": n.id,
                "title": n.title,
                "message": n.message,
                "data": n.data,
                "created_at": n.created_at,
                "is_read": n.is_read,
                "type": n.type,
                "audit_period": n.audit_period,
                "branch_id": n.branch_id,
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


class FreezeAuditReportsAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        from master_apps.vendor.mapping_models import VendorBranchMapping

        auditor = getattr(
            request.user,
            "auditor_profile",
            None
        )

        frozen_sessions = AuditSession.objects.filter(
            auditor=auditor,
            status="FROZEN"
        )

        entries = AuditEntry.objects.filter(
            auditor=auditor,

            branch_id__in=frozen_sessions.values_list(
                "branch_id",
                flat=True
            ),

            audit_period__in=frozen_sessions.values_list(
                "audit_period",
                flat=True
            )
        ).select_related(
            "checklist"
        ).order_by("-id")

        grouped = {}

        for entry in entries:

            checklist = entry.checklist

            if not checklist:
                continue

            audit_period = entry.audit_period

            # ======================================
            # FIND RELATED MAPPING
            # ======================================

            mapping = (
                VendorBranchMapping.objects.filter(
                    branch_id=entry.branch_id
                )
                .select_related(
                    "vendor",
                    "principal_employer",
                    "branch"
                )
                .first()
            )

            vendor_name = (
                mapping.vendor.name
                if mapping and mapping.vendor
                else "-"
            )

            pe_name = (
                mapping.principal_employer.short_name
                if mapping and mapping.principal_employer
                else "-"
            )

            branch_name = (
                mapping.branch.short_name
                if mapping and mapping.branch
                else "-"
            )

            state_name = (
                checklist.state.name
                if checklist.state
                else "-"
            )

            key = (
                f"{vendor_name}_"
                f"{branch_name}_"
                f"{audit_period}"
            )

            if key not in grouped:

                grouped[key] = {

                    "id": entry.id,

                    "vendor_name": vendor_name,

                    "pe_name": pe_name,

                    "state": state_name,

                    "branch_name": branch_name,

                    "audit_period": audit_period,

                    "entries": [],
                }

            grouped[key]["entries"].append({

                "id": entry.id,
                "audit_entry_id": entry.id,

                "audit_particular": (
                    checklist.audit_particulars
                ),

                "status": entry.status,

                "observation": entry.observation,

                "recommendation": entry.recommendation,
            })

        return Response(
            list(grouped.values())
        )


# ======================================
# 📦 COMPLIANCE ARCHIVE LIST
# ======================================

class ComplianceArchiveListAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        vendor_id = request.GET.get("vendor_id")
        audit_period = request.GET.get("audit_period")

        archives = ComplianceAuditArchive.objects.select_related(
            "vendor_submission"
        )

        if vendor_id:

            archives = archives.filter(
                vendor_submission__vendor_id=vendor_id
            )

        if audit_period:

            archives = archives.filter(
                vendor_submission__audit_period=audit_period
            )

        data = []

        for archive in archives.order_by("-created_at"):

            submission = archive.vendor_submission

            data.append({

                "id": archive.id,

                "archive_type": archive.archive_type,

                "vendor": (
                    submission.vendor.name
                    if submission.vendor
                    else "-"
                ),

                "audit_period": (
                    submission.audit_period
                ),

                "document": (
                    submission.document.name
                    if submission.document
                    else "-"
                ),

                "created_at": archive.created_at,

                "download_url": (
                    f"/auditor/compliance-archives/"
                    f"download/{archive.id}/"
                )
            })

        return Response(data)


# ======================================
# 📥 DOWNLOAD ARCHIVE FILE
# ======================================

class ComplianceArchiveDownloadAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, archive_id):

        archive = get_object_or_404(
            ComplianceAuditArchive,
            id=archive_id
        )

        if not archive.file:

            return Response({

                "error": "Archive file missing"

            }, status=404)

        return FileResponse(

            archive.file.open("rb"),

            as_attachment=True,

            filename=os.path.basename(
                archive.file.name
            )
        )


# ======================================
# 📎 EXCEPTIONAL APPROVAL FILES
# ======================================

class ExceptionalApprovalFilesAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, submission_id):

        submission = get_object_or_404(
            VendorComplianceSubmission,
            id=submission_id
        )

        files = submission.exceptional_documents.all()

        data = []

        for item in files:

            data.append({

                "id": item.id,

                "file": (
                    request.build_absolute_uri(
                        item.file.url
                    )
                    if item.file
                    else None
                ),

                "remark": item.remark,

                "uploaded_at": item.uploaded_at
            })

        return Response(data)



class AuditSessionStatusAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        branch_id = request.GET.get("branch_id")
        audit_period = request.GET.get("audit_period")

        auditor = getattr(
            request.user,
            "auditor_profile",
            None
        )

        if not auditor:
            return Response({
                "status": None
            })

        session = AuditSession.objects.filter(
            auditor=auditor,
            branch_id=branch_id,
            audit_period=audit_period
        ).first()

        if not session:

            return Response({
                "status": None
            })

        return Response({

            "status": session.status,

            "last_saved_at": session.last_saved_at,

            "created_at": session.created_at
        })
