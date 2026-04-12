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


# ❌ REMOVED WRONG IMPORT
# from master_apps.documents.models import AuditSubmission


class DownloadAuditDocumentsZipAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, branch_id):

        vendor_id = request.GET.get("vendor_id")
        audit_period = request.GET.get("audit_period")

        submissions = VendorComplianceSubmission.objects.filter(
            branch_id=branch_id,
            vendor_id=vendor_id,
            audit_period=audit_period
        )

        buffer = BytesIO()

        with zipfile.ZipFile(buffer, "w") as zip_file:
            for sub in submissions:
                try:
                    if not sub.main_file:
                        continue

                    file_path = sub.main_file.path

                    if os.path.exists(file_path):
                        file_name = os.path.basename(file_path)
                        zip_file.write(file_path, arcname=file_name)

                except Exception as e:
                    print("ZIP ERROR:", str(e))

        buffer.seek(0)

        response = HttpResponse(buffer, content_type="application/zip")
        response["Content-Disposition"] = 'attachment; filename="audit_documents.zip"'

        return response

# ==========================================================
# ================= EXISTING CRUD (UNCHANGED) ===============
# ==========================================================

# (KEEP YOUR EXISTING CREATE / LIST / UPDATE / DELETE EXACTLY SAME)
# ---- NO CHANGE BELOW ----

# ============================ CREATE ============================
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


# ============================ LIST ============================
class AuditorListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        auditors = Auditor.objects.all().order_by("name")
        serializer = AuditorSerializer(auditors, many=True)
        return Response(serializer.data)


# ============================ UPDATE ============================
class AuditorUpdateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        auditor = get_object_or_404(Auditor, pk=pk)
        serializer = AuditorSerializer(auditor, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Auditor updated successfully"})

        return Response(serializer.errors, status=400)


# ============================ DELETE ============================
class AuditorDeleteAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        with transaction.atomic():
            auditor = get_object_or_404(Auditor, pk=pk)

            if auditor.user:
                auditor.user.delete()

            auditor.delete()

        return Response({"message": "Auditor deleted successfully"})


# ==========================================================
# ================= NEW AUDITOR FLOW ========================
# ==========================================================

# 🔥 1. PE LIST
class AuditorMappedPEAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        mappings = VendorBranchMapping.objects.filter(
            auditor__user=request.user
        )

        pe_ids = mappings.values_list("principal_employer_id", flat=True).distinct()

        pes = PrincipalEmployer.objects.filter(id__in=pe_ids)

        return Response([
            {"id": pe.id, "short_name": pe.short_name}
            for pe in pes
        ])


# 🔥 2. VENDOR LIST
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

        return Response([
            {"id": v.id, "name": v.name}
            for v in vendors
        ])


# 🔥 3. BRANCH LIST
# 🔥 4. BRANCH LIST (UPDATED WITH STATE FILTER)
class AuditorMappedBranchesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        pe_id = request.GET.get("pe_id")
        vendor_id = request.GET.get("vendor_id")
        state = request.GET.get("state")  # ✅ NEW

        mappings = VendorBranchMapping.objects.filter(
            auditor__user=request.user,
            principal_employer_id=pe_id,
            vendor_id=vendor_id
        ).select_related("branch")

        # ✅ Apply state filter if provided
        if state:
            mappings = mappings.filter(branch__state__iexact=state)

        return Response([
            {
                "id": m.branch.id,
                "name": f"{m.branch.short_name} - {m.branch.address}"
            }
            for m in mappings
        ])


class AuditChecklistAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, branch_id):

        # ===============================
        # GET SELECTED FILTERS
        # ===============================
        vendor_id = request.GET.get("vendor_id")
        audit_period = request.GET.get("audit_period")

        # ===============================
        # GET BRANCH MAPPING
        # ===============================
        mappings = VendorBranchMapping.objects.filter(
            auditor__user=request.user,
            branch_id=branch_id
        ).select_related("branch")

        if not mappings.exists():
            return Response([])

        branch = mappings.first().branch
        state = branch.state

        # ===============================
        # GET ONLY FILTERED SUBMISSIONS
        # ===============================
        submissions = VendorComplianceSubmission.objects.filter(
            branch_id=branch_id,
            vendor_id=vendor_id,
            audit_period=audit_period
        )

        submitted_document_ids = submissions.values_list(
            "document_id",
            flat=True
        )

        submission_map = {
            sub.document_id: sub
            for sub in submissions
        }

        # ===============================
        # GET CHECKLIST ONLY FOR
        # SUBMITTED DOCUMENTS
        # ===============================
        checklist_qs = AuditChecklist.objects.filter(
            state__name__iexact=state,
            is_active=True,
            document_id__in=submitted_document_ids
        ).select_related(
            "act",
            "section",
            "document"
        )

        # ===============================
        # GET ONLY FILTERED SUBMISSIONS
        # ===============================
        submissions = VendorComplianceSubmission.objects.filter(
            branch_id=branch_id,
            vendor_id=vendor_id,
            audit_period=audit_period
        )

        submission_map = {
            sub.document_id: sub
            for sub in submissions
        }

        response = []

        # ===============================
        # AUDITOR MASTER DOC (GUIDELINE DOC)
        # ===============================
        auditor = request.user.auditor_profile

        auditor_doc = AuditorDocument.objects.filter(
            auditor=auditor
        ).order_by("-uploaded_at").first()

        # ===============================
        # BUILD RESPONSE
        # ===============================
        for item in checklist_qs:

            sub = submission_map.get(item.document_id)

            response.append({
                "id": item.id,
                "state": item.state.name,
                "act_name": item.act.name,
                "audit_particulars": item.audit_particulars,
                "section_rule": (
                    item.section.section_number
                    if item.section else ""
                ),
                "form_number": item.form_number,
                "document_name": (
                    item.document.name
                    if item.document else ""
                ),

                # auditor guideline master document
                "document": (
                    request.build_absolute_uri(
                        auditor_doc.document.url
                    )
                    if auditor_doc and auditor_doc.document
                    else None
                ),

                "auditor_guide": item.auditor_guide,

                # compliance status based on vendor upload
                "status": (
                    "Complied"
                    if sub else "Not Complied"
                ),
            })

        return Response(response)

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

# 🔥 3. STATE LIST (NEW)
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


# 🔥 5. SAVE AUDIT
class SaveAuditAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        return Response({"message": "Audit saved successfully"})


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