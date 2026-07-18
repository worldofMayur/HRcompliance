import os
import shutil

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser

from django.db import transaction
from django.conf import settings
from django.utils.crypto import get_random_string
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.utils.timezone import now
from django.template.loader import render_to_string
from django.core.mail import EmailMultiAlternatives
from rest_framework.permissions import IsAuthenticated

from django.shortcuts import get_object_or_404
import zipfile
from io import BytesIO
from django.http import HttpResponse

from .models import (
    PrincipalEmployer,
    PrincipalEmployerDocument,
    PrincipalEmployerBranch,
)
from .serializers import (
    PrincipalEmployerSerializer,
    PrincipalEmployerDocumentSerializer,
    PrincipalEmployerBranchSerializer,
)

User = get_user_model()


# ==========================================================
# LIST PRINCIPAL EMPLOYERS
# ==========================================================
class PrincipalEmployerListAPIView(APIView):
    def get(self, request):
        queryset = PrincipalEmployer.objects.filter(
            is_deleted=False
        ).order_by("-created_at")
        serializer = PrincipalEmployerSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


# ==========================================================
# CREATE PRINCIPAL EMPLOYER
# ==========================================================
class PrincipalEmployerCreateAPIView(APIView):

    def post(self, request):

        try:
            with transaction.atomic():

                email = request.data.get("email")
                mobile = request.data.get("mobile")

                # =============================
                # GLOBAL DUPLICATE CHECK (USER)
                # =============================

                if User.objects.filter(email=email).exists():
                    return Response(
                        {"error": "Account with this email already exists"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                if User.objects.filter(mobile=mobile).exists():
                    return Response(
                        {"error": "Account with this mobile already exists"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # =============================
                # MODULE DUPLICATE CHECK (PE)
                # =============================

                if PrincipalEmployer.objects.filter(email=email).exists():
                    return Response(
                        {"error": "Principal Employer with this email already exists"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                if PrincipalEmployer.objects.filter(mobile=mobile).exists():
                    return Response(
                        {"error": "Principal Employer with this mobile already exists"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # =============================
                # CREATE PRINCIPAL EMPLOYER
                # =============================

                serializer = PrincipalEmployerSerializer(data=request.data)
                serializer.is_valid(raise_exception=True)
                principal_employer = serializer.save()

                # =============================
                # CREATE USER ACCOUNT
                # =============================

                temp_password = get_random_string(10)

                user = User.objects.create_user(
                    username=principal_employer.short_name,
                    email=principal_employer.email,
                    mobile=principal_employer.mobile,
                    password=temp_password,
                    role="PE",
                    is_active=True,
                )

                user.reset_password_used = False
                user.save(update_fields=["reset_password_used"])

                # LINK USER TO PE
                principal_employer.user = user
                principal_employer.save(update_fields=["user"])

                # =============================
                # DOCUMENTS (MANDATORY)
                # =============================

                documents = request.FILES.getlist("document")

                MAX_FILE_SIZE = 3 * 1024 * 1024  # 3 MB

                for file in documents:

                    # File size validation
                    if file.size > MAX_FILE_SIZE:
                        return Response(
                            {"error": f"{file.name} exceeds 3 MB limit"},
                            status=status.HTTP_400_BAD_REQUEST,
                        )

                    doc_serializer = PrincipalEmployerDocumentSerializer(
                        data={
                            "principal_employer": principal_employer.id,
                            "document": file,
                        }
                    )

                    doc_serializer.is_valid(raise_exception=True)
                    doc_serializer.save()

                # =============================
                # GENERATE PASSWORD RESET LINK
                # =============================

                token = PasswordResetTokenGenerator().make_token(user)
                uid = urlsafe_base64_encode(force_bytes(user.pk))

                reset_url = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}"
                login_url = f"{settings.FRONTEND_URL}/signin"

                # =============================
                # PREPARE EMAIL CONTENT
                # =============================

                html_content = render_to_string(
                    "emails/password_reset.html",
                    {
                        "role": "Principal Employer",

                        "contact_person": principal_employer.contact_person,
                        "company_name": principal_employer.name,
                        "username": principal_employer.short_name,

                        "email": principal_employer.email,
                        "mobile": principal_employer.mobile,

                        "ho_address": principal_employer.ho_address,

                        "nature_of_business": principal_employer.nature_of_business,
                        "establishment_type": principal_employer.establishment_type,
                        "rules_applicable": principal_employer.rules_applicable,

                        "start_date": principal_employer.start_date,
                        "end_date": principal_employer.end_date,

                        "reset_url": reset_url,
                        "login_url": login_url,

                        "year": now().year,
                    },
                )

                # =============================
                # SEND EMAIL
                # =============================

                email_status = "Email sent successfully"

                try:
                    print("Sending activation email to:", principal_employer.email)

                    email_msg = EmailMultiAlternatives(
                        subject="Activate Your HR Compliance Account",
                        body="HTML email required",
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        to=[principal_employer.email],
                    )

                    email_msg.attach_alternative(html_content, "text/html")

                    email_msg.send(fail_silently=False)

                except Exception as email_error:

                    print("EMAIL ERROR:", str(email_error))
                    email_status = "Principal Employer created but email failed"

                # =============================
                # RESPONSE
                # =============================

                return Response(
                    {
                        "message": "Principal Employer created successfully",
                        "email_status": email_status,
                    },
                    status=status.HTTP_201_CREATED,
                )

        except Exception as e:

            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

# ==========================================================
# UPDATE PRINCIPAL EMPLOYER
# ==========================================================
class PrincipalEmployerUpdateAPIView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def put(self, request, pk):

        pe = get_object_or_404(
            PrincipalEmployer,
            pk=pk
        )

        old_email = pe.email

        email = request.data.get("email")
        mobile = request.data.get("mobile")

        if email and PrincipalEmployer.objects.exclude(pk=pk).filter(email=email).exists():
            return Response(
                {"error": "Email already in use"},
                status=400
            )

        if mobile and PrincipalEmployer.objects.exclude(pk=pk).filter(mobile=mobile).exists():
            return Response(
                {"error": "Mobile already in use"},
                status=400
            )

        serializer = PrincipalEmployerSerializer(
            pe,
            data=request.data,
            partial=True
        )

        serializer.is_valid(raise_exception=True)

        updated_pe = serializer.save()

        documents = request.FILES.getlist("document")

        updated_pe = serializer.save()

        # ===================================
        # EMAIL CHANGED?
        # ===================================
        if old_email != updated_pe.email and updated_pe.user:

            user = updated_pe.user

            user.email = updated_pe.email

            # Keep username synchronized only if your username stores email.
            # In your project username is short_name, so DON'T change username.

            user.reset_password_used = False
            user.save()

            # ===================================
            # SEND NEW PASSWORD RESET EMAIL
            # ===================================

            token = PasswordResetTokenGenerator().make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))

            reset_url = (
                f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}"
            )

            login_url = (
                f"{settings.FRONTEND_URL}/signin"
            )

            html_content = render_to_string(
                "emails/password_reset.html",
                {
                    "role": "Principal Employer",
                    "contact_person": updated_pe.contact_person,
                    "company_name": updated_pe.name,
                    "username": updated_pe.short_name,
                    "email": updated_pe.email,
                    "mobile": updated_pe.mobile,
                    "ho_address": updated_pe.ho_address,
                    "nature_of_business": updated_pe.nature_of_business,
                    "establishment_type": updated_pe.establishment_type,
                    "rules_applicable": updated_pe.rules_applicable,
                    "start_date": updated_pe.start_date,
                    "end_date": updated_pe.end_date,
                    "reset_url": reset_url,
                    "login_url": login_url,
                    "year": now().year,
                },
            )

            try:
                email_msg = EmailMultiAlternatives(
                    subject="Activate Your HR Compliance Account",
                    body="HTML email required",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    to=[updated_pe.email],
                )

                email_msg.attach_alternative(
                    html_content,
                    "text/html"
                )

                email_msg.send(fail_silently=False)

            except Exception as email_error:
                print(
                    "UPDATE EMAIL ERROR:",
                    str(email_error)
                )

        documents = request.FILES.getlist("document")

        if documents:
            for file in documents:
                PrincipalEmployerDocument.objects.create(
                    principal_employer=updated_pe,
                    document=file
                )

        updated_pe.refresh_from_db()

        return Response(
            PrincipalEmployerSerializer(updated_pe).data,
            status=200
        )


# ==========================================================
# DELETE PRINCIPAL EMPLOYER
# ==========================================================
from django.db.models.deletion import ProtectedError

from django.db.models.deletion import ProtectedError

class PrincipalEmployerDeleteAPIView(APIView):
    def delete(self, request, pk):
        try:
            with transaction.atomic():

                pe = get_object_or_404(
                    PrincipalEmployer,
                    pk=pk
                )

                user = pe.user

                try:
                    # Try hard delete
                    pe.delete()

                    # Delete linked user if safe
                    if user:
                        try:
                            user.delete()
                        except ProtectedError:
                            pass

                    # Delete media folder ONLY after successful delete
                    pe_folder = os.path.join(
                        settings.MEDIA_ROOT,
                        "principle_employee",
                        pe.short_name.replace(" ", "_"),
                    )

                    if os.path.exists(pe_folder):
                        shutil.rmtree(pe_folder)

                    return Response(
                        {
                            "message": "Principal Employer deleted successfully"
                        },
                        status=status.HTTP_200_OK,
                    )

                except ProtectedError:

                    # Soft delete
                    pe.is_deleted = True
                    pe.save(update_fields=["is_deleted"])

                    return Response(
                        {
                            "message": "Principal Employer is already in use and has been deactivated."
                        },
                        status=status.HTTP_200_OK,
                    )

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

            
class PrincipalEmployerBranchCreateAPIView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        try:
            with transaction.atomic():

                pe_id = request.data.get("principal_employer")
                state = request.data.get("state")
                short_name = request.data.get("short_name")

                # =============================
                # 🚫 BLOCK MANUAL "ALL BRANCHES"
                # =============================
                if short_name == "All Branches":
                    return Response(
                        {"error": "Cannot manually create 'All Branches'"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # =============================
                # CHECK EXISTING BRANCHES
                # =============================
                existing_branches = PrincipalEmployerBranch.objects.filter(
                    principal_employer_id=pe_id
                )

                # =============================
                # PREVENT DUPLICATE "ALL BRANCHES"
                # =============================
                # =============================
                # CHECK IF "ALL BRANCHES" EXISTS FOR THIS STATE
                # =============================
                all_branch_exists = PrincipalEmployerBranch.objects.filter(
                    principal_employer_id=pe_id,
                    state=state,
                    short_name="All Branches"
                ).exists()

                # =============================
                # AUTO CREATE "ALL BRANCHES" PER STATE
                # =============================
                if not all_branch_exists:
                    PrincipalEmployerBranch.objects.create(
                        principal_employer_id=pe_id,
                        state=state,
                        short_name="All Branches",
                        address=state,
                        status="active"
                    )

                # =============================
                # CREATE USER BRANCH
                # =============================
                print("========== BRANCH CREATE ==========")
                print("DATA :", request.data)
                print("FILES:", request.FILES)
                print("DOCUMENT:", request.FILES.get("document"))
                serializer = PrincipalEmployerBranchSerializer(data=request.data)
                serializer.is_valid(raise_exception=True)
                branch = serializer.save()
                print("Saved document:", branch.document)
                print("Saved path:", branch.document.path if branch.document else "NO DOCUMENT")

                return Response(
                    PrincipalEmployerBranchSerializer(branch).data,
                    status=status.HTTP_201_CREATED,
                )

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )


# ==========================================================
# LIST BRANCHES BY PE ID (ADMIN SIDE)
# ==========================================================
class PrincipalEmployerBranchListAPIView(APIView):
    def get(self, request, pe_id):
        branches = PrincipalEmployerBranch.objects.filter(
            principal_employer_id=pe_id
        ).order_by("-created_at")

        serializer = PrincipalEmployerBranchSerializer(branches, many=True)
        return Response(serializer.data)


class PrincipalEmployerBranchUpdateAPIView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def put(self, request, pk):
        branch = get_object_or_404(PrincipalEmployerBranch, pk=pk)

        # =============================
        # 🚫 BLOCK UPDATE FOR "ALL BRANCHES"
        # =============================
        if branch.short_name == "All Branches":
            return Response(
                {"error": "'All Branches' cannot be modified"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = request.data.copy()
        data["principal_employer"] = branch.principal_employer.id

        serializer = PrincipalEmployerBranchSerializer(
            branch,
            data=data,
            partial=True
        )

        serializer.is_valid(raise_exception=True)
        updated_branch = serializer.save()

        return Response(
            PrincipalEmployerBranchSerializer(updated_branch).data,
            status=status.HTTP_200_OK
        )



class PrincipalEmployerDocumentZipAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pe_id):

        pe = get_object_or_404(
            PrincipalEmployer,
            pk=pe_id
        )

        documents = PrincipalEmployerDocument.objects.filter(
            principal_employer=pe
        )

        if not documents.exists():
            return Response(
                {"error": "No documents found"},
                status=404
            )

        zip_buffer = BytesIO()

        with zipfile.ZipFile(
            zip_buffer,
            "w",
            zipfile.ZIP_DEFLATED
        ) as zip_file:

            for doc in documents:

                if doc.document and os.path.exists(
                    doc.document.path
                ):

                    zip_file.write(
                        doc.document.path,
                        arcname=os.path.basename(
                            doc.document.name
                        )
                    )

        zip_buffer.seek(0)

        response = HttpResponse(
            zip_buffer.read(),
            content_type="application/zip"
        )

        response[
            "Content-Disposition"
        ] = (
            f'attachment; '
            f'filename="{pe.short_name}_documents.zip"'
        )

        return response


class PrincipalEmployerBranchDocumentZipAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pe_id):

        pe = get_object_or_404(
            PrincipalEmployer,
            pk=pe_id
        )

        branches = PrincipalEmployerBranch.objects.filter(
            principal_employer=pe
        ).exclude(document="")

        if not branches.exists():
            return Response(
                {"error": "No branch documents found"},
                status=404
            )

        zip_buffer = BytesIO()

        with zipfile.ZipFile(
            zip_buffer,
            "w",
            zipfile.ZIP_DEFLATED
        ) as zip_file:

            for branch in branches:

                if (
                    branch.document
                    and os.path.exists(branch.document.path)
                ):

                    zip_file.write(
                        branch.document.path,
                        arcname=os.path.basename(
                            branch.document.name
                        )
                    )

        zip_buffer.seek(0)

        response = HttpResponse(
            zip_buffer.read(),
            content_type="application/zip"
        )

        response[
            "Content-Disposition"
        ] = (
            f'attachment; filename="{pe.short_name}_branch_documents.zip"'
        )

        return response