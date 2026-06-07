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
from django.template.loader import render_to_string
from xhtml2pdf import pisa

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


from reportlab.platypus import (
    SimpleDocTemplate,
    Spacer,
    Paragraph,
    Table,
    TableStyle,
    PageBreak
)

from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.styles import ParagraphStyle

from io import BytesIO

def generate_cc_pdf_from_html(html_content):

    pdf_buffer = BytesIO()

    pisa_status = pisa.CreatePDF(

        src=html_content,

        dest=pdf_buffer
    )

    if pisa_status.err:

        raise Exception(
            "Failed to generate CC PDF"
        )

    return pdf_buffer.getvalue()


def generate_enterprise_audit_pdf(data):

    buffer = BytesIO()

    doc = SimpleDocTemplate(

        buffer,

        pagesize=landscape(A4),

        rightMargin=20,
        leftMargin=20,
        topMargin=20,
        bottomMargin=20
    )

    styles = getSampleStyleSheet()

    elements = []

    # =========================================
    # STYLES
    # =========================================

    title_style = ParagraphStyle(
        "Title",
        parent=styles["Heading1"],
        fontSize=24,
        leading=30,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#1e3a8a"),
        spaceAfter=20,
    )

    section_style = ParagraphStyle(
        "Section",
        parent=styles["Heading2"],
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#2563eb"),
        spaceAfter=12,
    )

    normal_style = styles["BodyText"]

    # =========================================
    # HEADER
    # =========================================

    elements.append(
        Paragraph(
            "Final Compliance Audit Report",
            title_style
        )
    )

    elements.append(
        Spacer(1, 12)
    )

    # =========================================
    # SUMMARY TABLE
    # =========================================

    summary_data = [

        [
            "Principal Employer",
            "Vendor",
            "State",
            "Branch",
            "Audit Period"
        ],

        [
            data.get("pe_name", "-"),
            data.get("vendor_name", "-"),
            data.get("state", "-"),
            data.get("branch_name", "-"),
            data.get("audit_period", "-"),
        ]
    ]

    summary_table = Table(
        summary_data,
        colWidths=[150, 150, 120, 220, 120]
    )

    summary_table.setStyle(TableStyle([

        (
            "BACKGROUND",
            (0, 0),
            (-1, 0),
            colors.HexColor("#2563eb")
        ),

        (
            "TEXTCOLOR",
            (0, 0),
            (-1, 0),
            colors.white
        ),

        (
            "FONTNAME",
            (0, 0),
            (-1, 0),
            "Helvetica-Bold"
        ),

        (
            "FONTSIZE",
            (0, 0),
            (-1, -1),
            10
        ),

        (
            "BOTTOMPADDING",
            (0, 0),
            (-1, 0),
            10
        ),

        (
            "BACKGROUND",
            (0, 1),
            (-1, -1),
            colors.whitesmoke
        ),

        (
            "GRID",
            (0, 0),
            (-1, -1),
            1,
            colors.lightgrey
        ),

        (
            "BOX",
            (0, 0),
            (-1, -1),
            1,
            colors.lightgrey
        ),
    ]))

    elements.append(summary_table)

    elements.append(
        Spacer(1, 25)
    )

    # =========================================
    # COMPLIANCE SECTION
    # =========================================

    elements.append(
        Paragraph(
            "Compliance Entries",
            section_style
        )
    )

    table_data = [[

        "State",
        "Act",
        "Audit Particular",
        "Section",
        "Form",
        "Document",
        "Status",
        "Observation",
        "Recommendation"
    ]]

    for entry in data.get("entries", []):

        table_data.append([

            entry.get("state", "-"),

            entry.get("act_name", "-"),

            entry.get("audit_particular", "-"),

            entry.get("section", "-"),

            entry.get("form_number", "-"),

            entry.get("document_name", "-"),

            entry.get("status", "-"),

            entry.get("observation", "-"),

            entry.get("recommendation", "-"),
        ])

    table = Table(

        table_data,

        repeatRows=1,

        colWidths=[
            70,
            90,
            140,
            60,
            50,
            90,
            100,
            120,
            120
        ]
    )

    table.setStyle(TableStyle([

        (
            "BACKGROUND",
            (0, 0),
            (-1, 0),
            colors.HexColor("#0f172a")
        ),

        (
            "TEXTCOLOR",
            (0, 0),
            (-1, 0),
            colors.white
        ),

        (
            "FONTNAME",
            (0, 0),
            (-1, 0),
            "Helvetica-Bold"
        ),

        (
            "FONTSIZE",
            (0, 0),
            (-1, -1),
            8
        ),

        (
            "BOTTOMPADDING",
            (0, 0),
            (-1, 0),
            10
        ),

        (
            "GRID",
            (0, 0),
            (-1, -1),
            0.5,
            colors.lightgrey
        ),

        (
            "BACKGROUND",
            (0, 1),
            (-1, -1),
            colors.white
        ),

        (
            "ROWBACKGROUNDS",
            (0, 1),
            (-1, -1),
            [
                colors.white,
                colors.HexColor("#f8fafc")
            ]
        ),

        (
            "VALIGN",
            (0, 0),
            (-1, -1),
            "TOP"
        ),

    ]))

    elements.append(table)

    elements.append(
        Spacer(1, 20)
    )

    # =========================================
    # FOOTER
    # =========================================

    footer = Paragraph(

        f"""
        <para align=center>
        <font size=9 color="#6b7280">
        This is a system generated audit report.<br/>
        Generated on:
        {data.get("generated_at")}
        </font>
        </para>
        """,

        normal_style
    )

    elements.append(footer)

    # =========================================
    # BUILD PDF
    # =========================================

    doc.build(elements)

    pdf = buffer.getvalue()

    buffer.close()

    return pdf


class DownloadCCPDFAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, audit_id):

        import os

        from django.http import FileResponse

        # ==========================================
        # FETCH AUDIT ENTRY
        # ==========================================

        entry = get_object_or_404(
            AuditEntry,
            id=audit_id
        )

        # ==========================================
        # FETCH STORED CC PDF
        # ==========================================

        matching = VendorComplianceSubmission.objects.filter(
            branch_id=entry.branch_id,
            audit_period=entry.audit_period,
        )

        print("\n========== CC DEBUG ==========")
        print("AUDIT ID:", audit_id)
        print("BRANCH ID:", entry.branch_id)
        print("AUDIT PERIOD:", entry.audit_period)
        print("MATCHING SUBMISSIONS:", matching.count())

        for s in matching:
            print(
                "SUBMISSION:",
                s.id,
                "| VENDOR:",
                s.vendor.short_name,
                "| CC:",
                s.clearance_certificate.name
                if s.clearance_certificate
                else "NO_CC"
            )

        submission = (
            matching
            .filter(clearance_certificate__isnull=False)
            .exclude(clearance_certificate="")
            .first()
        )

        # ==========================================
        # VALIDATION
        # ==========================================

        if not submission:

            return Response(
                {
                    "error": (
                        "Compliance Clearance "
                        "Certificate not found"
                    )
                },
                status=404
            )

        if not submission.clearance_certificate:

            return Response(
                {
                    "error": (
                        "CC PDF file missing"
                    )
                },
                status=404
            )
        

        print("\n===== CC FILE DEBUG =====")
        print("CC NAME:", submission.clearance_certificate.name)
        print("CC PATH:", submission.clearance_certificate.path)
        print("MEDIA ROOT:", settings.MEDIA_ROOT)
        print(
            "EXISTS:",
            os.path.exists(
                submission.clearance_certificate.path
            )
        )

        print(
            "FILE EXISTS:",
            os.path.exists(
                submission.clearance_certificate.path
            )
        )

        if not os.path.exists(
            submission.clearance_certificate.path
        ):

            return Response(
                {
                    "error": (
                        "Stored CC PDF does not exist"
                    )
                },
                status=404
            )

        # ==========================================
        # DEBUG LOG
        # ==========================================

        print(
            "\n📄 USING STORED CC PDF:",
            submission.clearance_certificate.name
        )

        # ==========================================
        # SAFE FILE NAME
        # ==========================================

        vendor_name = (
            submission.vendor.short_name
            if submission.vendor
            else "Vendor"
        )

        audit_period = (
            submission.audit_period
            or "Audit"
        )

        safe_vendor = (
            vendor_name
            .replace(" ", "_")
            .replace("/", "_")
        )

        safe_period = (
            audit_period
            .replace(" ", "_")
            .replace("/", "_")
        )

        filename = (
            f"{safe_vendor}_{safe_period}_CC.pdf"
        )

        # ==========================================
        # RETURN SAME PDF
        # ==========================================
        print(
            "FILE PATH:",
            submission.clearance_certificate.path
        )

        print(
            "FILE EXISTS:",
            os.path.exists(
                submission.clearance_certificate.path
            )
        )

        return FileResponse(

            submission.clearance_certificate.open("rb"),

            content_type="application/pdf",

            filename=filename,

            as_attachment=False
        )

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

                reset_url = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}"
                login_url = f"{settings.FRONTEND_URL}/signin"

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

class DownloadAuditDocumentsZipAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, branch_id):

        import os
        import re
        import zipfile

        from io import BytesIO
        from django.http import HttpResponse

        vendor_id = request.GET.get("vendor_id")
        audit_period = request.GET.get("audit_period")

        submissions = (
            VendorComplianceSubmission.objects.filter(
                branch_id=branch_id,
                audit_period=audit_period
            )
            .select_related(
                "vendor",
                "branch",
                "document"
            )
            .prefetch_related(
                "supporting_files",
                "file_versions",
                "exceptional_documents"
            )
        )

        if vendor_id:
            submissions = submissions.filter(
                vendor_id=vendor_id
            )

        if not submissions.exists():

            return Response(
                {"error": "No documents found"},
                status=404
            )

        buffer = BytesIO()

        def clean(text):

            return re.sub(
                r"[^A-Za-z0-9_-]",
                "_",
                str(text or "unknown")
            )

        first = submissions.first()

        zip_filename = (
            f"{clean(first.vendor.short_name)}_"
            f"{clean(first.branch.short_name)}_"
            f"{clean(audit_period)}.zip"
        )

        # Prevent duplicate files
        added_cc_files = set()
        added_files = set()

        vendor_slug = clean(first.vendor.short_name)

        pe_slug = clean(first.branch.principal_employer.short_name)

        branch_slug = clean(first.branch.short_name)

        period_slug = clean(audit_period)

        with zipfile.ZipFile(
            buffer,
            "w",
            zipfile.ZIP_DEFLATED
        ) as zip_file:

            for sub in submissions:

                try:

                    # =====================================
                    # ORIGINAL MAIN DOCUMENT
                    # =====================================

                    if (
                        sub.main_file
                        and os.path.exists(sub.main_file.path)
                    ):

                        if sub.main_file.name not in added_files:

                            print(
                                "📦 ZIP MAIN:",
                                sub.main_file.name
                            )

                            zip_file.write(
                                sub.main_file.path,
                                arcname=sub.main_file.name
                            )

                            added_files.add(
                                sub.main_file.name
                            )

                    # =====================================
                    # REUPLOADED DOCUMENTS
                    # =====================================

                    for version in sub.file_versions.filter(
                        is_reupload=True
                    ):

                        if (
                            version.file
                            and os.path.exists(version.file.path)
                        ):

                            if version.file.name not in added_files:

                                print(
                                    "📦 ZIP REUPLOAD:",
                                    version.file.name
                                )

                                zip_file.write(
                                    version.file.path,
                                    arcname=version.file.name
                                )

                                added_files.add(
                                    version.file.name
                                )

                    # =====================================
                    # SUPPORTING FILES
                    # =====================================

                    for supp in sub.supporting_files.all():

                        if (
                            supp.file
                            and os.path.exists(supp.file.path)
                        ):

                            if supp.file.name not in added_files:

                                print(
                                    "📦 ZIP ADDITIONAL FILE:",
                                    supp.file.name
                                )

                                base_folder = os.path.join(
                                    vendor_slug,
                                    pe_slug,
                                    branch_slug,
                                    period_slug
                                )

                                path_parts = supp.file.name.split("/")

                                base_path = "/".join(path_parts[:-2])

                                zip_file.write(
                                    supp.file.path,
                                    arcname=os.path.join(
                                        base_path,
                                        "additional_files",
                                        os.path.basename(
                                            supp.file.name
                                        )
                                    )
                                )

                                added_files.add(
                                    supp.file.name
                                )

                    # =====================================
                    # EXCEPTIONAL APPROVAL FILES
                    # =====================================

                    for exc in sub.exceptional_documents.all():

                        if (
                            exc.file
                            and os.path.exists(exc.file.path)
                        ):

                            if exc.file.name not in added_files:

                                print(
                                    "📦 ZIP EXCEPTIONAL:",
                                    exc.file.name
                                )

                                zip_file.write(
                                    exc.file.path,
                                    arcname=exc.file.name
                                )

                                added_files.add(
                                    exc.file.name
                                )

                    # =====================================
                    # COMPLIANCE CLEARANCE CERTIFICATE
                    # =====================================

                    if (
                        getattr(
                            sub,
                            "clearance_certificate",
                            None
                        )
                        and os.path.exists(
                            sub.clearance_certificate.path
                        )
                    ):

                        # ONLY KEEP FILE NAME
                        cc_basename = os.path.basename(
                            sub.clearance_certificate.name
                        )

                        # PREVENT DUPLICATE CC PDFs
                        if cc_basename not in added_cc_files:

                            print(
                                "📦 ZIP FINAL CC:",
                                sub.clearance_certificate.name
                            )

                            zip_file.write(

                                sub.clearance_certificate.path,

                                arcname=os.path.join(
                                    "compliance_clearance_certificate",
                                    cc_basename
                                )
                            )

                            added_cc_files.add(
                                cc_basename
                            )

                except Exception as e:

                    print(
                        f"❌ ZIP ERROR "
                        f"(Submission {sub.id}): {e}"
                    )

        buffer.seek(0)

        response = HttpResponse(
            buffer,
            content_type="application/zip"
        )

        response[
            "Content-Disposition"
        ] = (
            f'attachment; filename="{zip_filename}"'
        )

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
            ]:

                checklist_id = entry.get(
                    "checklist_id"
                )

                support_file = request.FILES.get(
                    f"exceptional_file_{checklist_id}"
                )

                if support_file:

                    checklist = AuditChecklist.objects.filter(
                        id=checklist_id
                    ).select_related("document").first()

                    related_submission = None

                    if checklist and checklist.document:

                        related_submission = (
                            VendorComplianceSubmission.objects.filter(
                                branch_id=branch_id,
                                vendor_id=vendor.id,
                                audit_period=audit_period,
                                document=checklist.document
                            ).first()
                        )

                    if related_submission:

                        ExceptionalApprovalDocument.objects.filter(
                            submission=related_submission
                        ).delete()

                        exceptional_doc = ExceptionalApprovalDocument.objects.create(
                            submission=related_submission,
                            file=support_file,
                            remark=entry.get("observation", "")
                        )

                        print(
                            "\n✅ EXCEPTIONAL MODEL CREATED:",
                            exceptional_doc.file.name
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

        if not saved_entry:
            return Response({
                "error": "No audit entries found"
            }, status=400)

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
        # GENERATE PDF BYTES
        # =========================
        # =========================
        # SEND EMAIL
        # =========================
        # =========================
        # FINAL FLOW
        # =========================

        # ======================================
        # VALID + FREEZE FLOW
        # ======================================

        if all_valid and freeze_report:

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

                        # =========================
            # EMAIL CONTENT
            # =========================

            subject = (
                f"Compliance Clearance Certificate | "
                f"{audit_period} | "
                f"{branch.state} | "
                f"{pe.short_name} | "
                f"{vendor.short_name}"
            )



            # =========================
            # FINAL AUDIT REPORT
            # =========================

            # =========================
            # BUILD FULL PDF ENTRIES
            # =========================

            pdf_entries = []

            for item in entries:

                checklist = (
                    AuditChecklist.objects.filter(
                        id=item.get("checklist_id")
                    )
                    .select_related(
                        "act",
                        "section",
                        "document",
                        "state"
                    )
                    .first()
                )

                if not checklist:
                    continue

                guidelines_list = []

                if checklist.auditor_guide:

                    guidelines_list = [

                        line.strip()

                        for line in (
                            checklist.auditor_guide.split("\n")
                        )

                        if line.strip()
                    ]

                pdf_entries.append({

                    "state": (
                        checklist.state.name
                        if checklist.state
                        else "-"
                    ),

                    "act_name": (
                        checklist.act.name
                        if checklist.act
                        else "-"
                    ),

                    "audit_particular": (
                        checklist.audit_particulars
                        or "-"
                    ),

                    "section": (
                        checklist.section.section_number
                        if checklist.section
                        else "-"
                    ),

                    "form_number": (
                        checklist.form_number
                        or "-"
                    ),

                    "document_name": (
                        checklist.document.name
                        if checklist.document
                        else "-"
                    ),

                    "guidelines": guidelines_list,

                    "status": (
                        item.get("status")
                        or "-"
                    ),

                    "observation": (
                        item.get("observation")
                        or "-"
                    ),

                    "recommendation": (
                        item.get("recommendation")
                        or "-"
                    ),
                })


            email_html = render_to_string(
                "auditor/compliance_clearance_email.html",
                {
                    "pe_name": pe.name,
                    "vendor_name": vendor.name,
                    "state": branch.state,
                    "branch_name": branch.short_name,
                    "audit_period": audit_period,
                    "entries": entries,
                    "generated_at": now().strftime(
                        "%d %B %Y %I:%M:%S %p"
                    ),
                    "exceptional_entries": [
                        e for e in pdf_entries
                        if "Exceptional Approval"
                        in str(e.get("status", ""))
                    ],
                }
            )

            pdf_html = render_to_string(
                "auditor/final_cc_certificate.html",
                {
                    "pe_name": pe.name,
                    "vendor_name": vendor.name,
                    "state": branch.state,
                    "branch_name": branch.short_name,
                    "audit_period": audit_period,
                    "generated_at": now().strftime(
                        "%d %B %Y %I:%M:%S %p"
                    ),
                    "exceptional_entries": [
                        e for e in pdf_entries
                        if "Exceptional Approval"
                        in str(e.get("status", ""))
                    ],
                }
            )

            pdf_bytes = generate_cc_pdf_from_html(
                pdf_html
            )

            # =========================
            # GENERATE FINAL AUDIT REPORT
            # =========================

            audit_report_html = render_to_string(

                "auditor/final_audit_report.html",

                {

                    "pe_name": pe.name,

                    "vendor_name": vendor.name,

                    "state": str(branch.state),

                    "branch_name": branch.short_name,

                    "audit_period": audit_period,

                    "entries": pdf_entries,

                    "generated_at": now().strftime(
                        "%d %B %Y %I:%M %p"
                    ),

                    "has_exceptional_approval": any(

                        "Exceptional Approval"
                        in str(e.get("status", ""))

                        for e in pdf_entries
                    ),
                }
            )

            audit_report_pdf_bytes = generate_enterprise_audit_pdf({

                "pe_name": pe.name,

                "vendor_name": vendor.name,

                "state": str(branch.state),

                "branch_name": branch.short_name,

                "audit_period": audit_period,

                "entries": pdf_entries,

                "generated_at": now().strftime(
                    "%d %B %Y %I:%M %p"
                )
            })

            print(
                "\n✅ FINAL AUDIT REPORT GENERATED"
            )

            all_submissions = (
                VendorComplianceSubmission.objects.filter(
                    branch_id=branch_id,
                    vendor_id=vendor.id,
                    audit_period=audit_period
                )
            )

            first_submission = all_submissions.first()

            if first_submission:

                # =========================
                # REMOVE OLD CC
                # =========================

                if first_submission.clearance_certificate:

                    try:

                        old_cc_path = (
                            first_submission
                            .clearance_certificate
                            .path
                        )

                        if os.path.exists(old_cc_path):

                            os.remove(old_cc_path)

                    except Exception as e:

                        print(
                            "\n❌ OLD CC DELETE ERROR:",
                            str(e)
                        )

                # =========================
                # REMOVE OLD REPORT
                # =========================

                if first_submission.audit_report_pdf:

                    try:

                        old_report_path = (
                            first_submission
                            .audit_report_pdf
                            .path
                        )

                        if os.path.exists(old_report_path):

                            os.remove(old_report_path)

                    except Exception as e:

                        print(
                            "\n❌ OLD REPORT DELETE ERROR:",
                            str(e)
                        )

                cc_filename = (

                    f"{vendor.short_name}_"
                    f"{audit_period}_CC.pdf"

                ).replace(" ", "_")

                audit_report_filename = (

                    f"{vendor.short_name}_"
                    f"{audit_period}_Audit_Report.pdf"

                ).replace(" ", "_")

                # =========================
                # SAVE CC
                # =========================

                first_submission.clearance_certificate.save(

                    cc_filename,

                    ContentFile(pdf_bytes),

                    save=False
                )

                # =========================
                # SAVE REPORT
                # =========================

                first_submission.audit_report_pdf.save(

                    audit_report_filename,

                    ContentFile(audit_report_pdf_bytes),

                    save=False
                )

                first_submission.save()

                import os

                print("CC SAVED:", first_submission.clearance_certificate.name)
                print("CC PATH:", first_submission.clearance_certificate.path)
                print(
                    "CC EXISTS AFTER SAVE:",
                    os.path.exists(first_submission.clearance_certificate.path)
                )

                                # =========================
                # COPY SAME PDF PATHS
                # =========================

                other_submissions = (
                    VendorComplianceSubmission.objects.filter(
                        branch_id=branch_id,
                        vendor_id=vendor.id,
                        audit_period=audit_period
                    ).exclude(
                        id=first_submission.id
                    )
                )

                for submission in other_submissions:

                    submission.clearance_certificate = (
                        first_submission.clearance_certificate.name
                    )

                    submission.audit_report_pdf = (
                        first_submission.audit_report_pdf.name
                    )

                    submission.save(
                        update_fields=[
                            "clearance_certificate",
                            "audit_report_pdf"
                        ]
                    )

                print(
                    "\n✅ FINAL CC SAVED:",
                    first_submission.clearance_certificate.name
                )

                print(
                    "\n✅ FINAL REPORT SAVED:",
                    first_submission.audit_report_pdf.name
                )

            # =========================
            # SEND EMAIL
            # =========================

            try:

                logger.info(
                    f"📨 Sending → "
                    f"{vendor.email} | "
                    f"CC: {cc_emails}"
                )

                email = EmailMultiAlternatives(

                    subject=subject,

                    body=(
                        "Compliance Clearance Certificate "
                        "has been issued successfully."
                    ),

                    from_email=settings.DEFAULT_FROM_EMAIL,

                    to=[vendor.email],

                    cc=cc_emails
                )

                email.attach_alternative(
                    email_html,
                    "text/html"
                )

                email.attach(
                    cc_filename,
                    pdf_bytes,
                    "application/pdf"
                )

                email.send(
                    fail_silently=False
                )

                SystemNotification.objects.create(

                    user=vendor.user,

                    title="Compliance Clearance Certificate Issued",

                    message=(
                        f"Compliance Clearance Certificate issued "
                        f"for audit period {audit_period}"
                    ),

                    type="VENDOR",

                    branch_id=branch_id,

                    audit_period=audit_period,

                    data={

                        "vendor": vendor.name,
                        "vendor_id": vendor.id,
                        "branch": branch.short_name,
                        "branch_id": branch.id,
                        "state": branch.state,
                        "audit_period": audit_period,
                        "status": "CC_ISSUED",

                        "pdf_download_url": (
                            f"https://apii.complianceclearance.com"
                            f"/api/auditor/download-cc-pdf/{saved_entry.id}/"
                        ),
                    },
                )


                # =========================================
                # PE NOTIFICATION
                # =========================================

                if pe.user:

                    SystemNotification.objects.create(

                        user=pe.user,

                        title="Compliance Clearance Certificate Issued",

                        message=(
                            f"Compliance Clearance Certificate issued "
                            f"for audit period {audit_period}"
                        ),

                        type="VENDOR",

                        branch_id=branch_id,

                        audit_period=audit_period,

                        data={

                            "vendor": vendor.name,
                            "vendor_id": vendor.id,
                            "branch": branch.short_name,
                            "branch_id": branch.id,
                            "state": branch.state,
                            "audit_period": audit_period,
                            "status": "CC_ISSUED",

                            "pdf_download_url": (
                                f"https://apii.complianceclearance.com"
                                f"/api/auditor/download-cc-pdf/{saved_entry.id}/"
                            ),
                        },
                    )

            except Exception as e:

                logger.error(
                    f"❌ Email failed: {str(e)}"
                )

                return Response(
                    {
                        "error": (
                            "Audit saved "
                            "but email failed"
                        )
                    },
                    status=500
                )

        # ======================================
        # INVALID / REUPLOAD FLOW
        # ======================================

        elif not all_valid:

            logger.info("❌ Invalid audit → creating notification")

            formatted_entries = []

            for entry in entries:

                checklist = AuditChecklist.objects.filter(
                    id=entry.get("checklist_id")
                ).select_related("document").first()

                formatted_entries.append({

                    "checklist_id": entry.get("checklist_id"),

                    "audit_particular": (
                        checklist.audit_particulars
                        if checklist else ""
                    ),

                    "document_id": (
                        checklist.document_id
                        if checklist and checklist.document
                        else None
                    ),

                    "document_name": (
                        checklist.document.name
                        if checklist and checklist.document
                        else "N/A"
                    ),

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

                    "pe_id": pe.id,

                    "pe_short_name": pe.short_name,

                    "branch_id": branch_id,

                    "branch_short_name": branch.short_name,

                    "state": branch.state,

                    "audit_period": audit_period,

                    "entries": formatted_entries,

                    "action": "reupload"
                }
            )

            return Response({
                "message": (
                    "Audit saved. Vendor notified "
                    "to re-upload documents."
                )
            })
            
        return Response({
            "message": "Audit saved successfully"
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

        # ======================================
        # NO DOCUMENTS UPLOADED
        # ======================================

        if not submissions.exists():

            return Response({

                "has_documents": False,

                "checklist": []

            })

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
                "document_status": (
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

        return Response({

            "has_documents": True,

            "checklist": response

        })


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

        if request.user.role == "AUDITOR":

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

        else:

            entries = AuditEntry.objects.all().select_related(
                "checklist"
            ).order_by("-id")

            print("ROLE:", request.user.role)
            print("TOTAL ENTRIES:", entries.count())

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
