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
from django.shortcuts import get_object_or_404

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
        queryset = PrincipalEmployer.objects.all().order_by("-created_at")
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

                # 🔥 GLOBAL DUPLICATE CHECK (ACCOUNTS)
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

                # 🔥 MODULE DUPLICATE CHECK (PE)
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

                # CREATE PE
                serializer = PrincipalEmployerSerializer(data=request.data)
                serializer.is_valid(raise_exception=True)
                principal_employer = serializer.save()

                # CREATE USER
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

                # 🔥 LINK USER TO PE
                principal_employer.user = user
                principal_employer.save(update_fields=["user"])

                # HANDLE DOCUMENTS (MANDATORY)
                documents = request.FILES.getlist("document")
                if not documents:
                    return Response(
                        {"error": "Please upload at least one document"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                for file in documents:
                    doc_serializer = PrincipalEmployerDocumentSerializer(
                        data={
                            "principal_employer": principal_employer.id,
                            "document": file,
                        }
                    )
                    doc_serializer.is_valid(raise_exception=True)
                    doc_serializer.save()

                # SEND RESET EMAIL
                token = PasswordResetTokenGenerator().make_token(user)
                uid = urlsafe_base64_encode(force_bytes(user.pk))

                reset_url = f"{settings.FRONTEND_URL}/TailAdmin/reset-password/{uid}/{token}"
                login_url = f"{settings.FRONTEND_URL}/TailAdmin/signin"

                html_content = render_to_string(
                    "emails/password_reset.html",
                    {
                        "contact_person": principal_employer.contact_person,
                        "company_name": principal_employer.name,
                        "ho_address": principal_employer.ho_address,
                        "username": principal_employer.short_name,
                        "reset_url": reset_url,
                        "login_url": login_url,
                        "year": now().year,
                    },
                )

                email_msg = EmailMultiAlternatives(
                    subject="Activate Your HR Compliance Account",
                    body="HTML email required",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    to=[principal_employer.email],
                )
                email_msg.attach_alternative(html_content, "text/html")
                email_msg.send(fail_silently=True)

                return Response(
                    {"message": "Principal Employer created successfully"},
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
    def put(self, request, pk):
        pe = get_object_or_404(PrincipalEmployer, pk=pk)

        email = request.data.get("email")
        mobile = request.data.get("mobile")

        # 🔥 DUPLICATE CHECK DURING UPDATE
        if email and PrincipalEmployer.objects.exclude(pk=pk).filter(email=email).exists():
            return Response(
                {"error": "Another Principal Employer already uses this email"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if mobile and PrincipalEmployer.objects.exclude(pk=pk).filter(mobile=mobile).exists():
            return Response(
                {"error": "Another Principal Employer already uses this mobile"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = request.data.copy()
        data.pop("documents", None)
        data.pop("created_at", None)
        data.pop("id", None)

        serializer = PrincipalEmployerSerializer(pe, data=data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ==========================================================
# DELETE PRINCIPAL EMPLOYER
# ==========================================================
class PrincipalEmployerDeleteAPIView(APIView):
    def delete(self, request, pk):
        try:
            with transaction.atomic():

                pe = get_object_or_404(PrincipalEmployer, pk=pk)

                # Delete linked user
                if pe.user:
                    pe.user.delete()

                # Delete media folder
                pe_folder = os.path.join(
                    settings.MEDIA_ROOT,
                    "principle_employee",
                    pe.short_name.replace(" ", "_"),
                )

                if os.path.exists(pe_folder):
                    shutil.rmtree(pe_folder)

                pe.delete()

                return Response(
                    {"message": "Principal Employer deleted successfully"},
                    status=status.HTTP_200_OK,
                )

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


# ==========================================================
# CREATE BRANCH
# ==========================================================
class PrincipalEmployerBranchCreateAPIView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        try:
            with transaction.atomic():
                serializer = PrincipalEmployerBranchSerializer(data=request.data)
                serializer.is_valid(raise_exception=True)
                branch = serializer.save()

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


# ==========================================================
# UPDATE BRANCH
# ==========================================================
class PrincipalEmployerBranchUpdateAPIView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def put(self, request, pk):
        branch = get_object_or_404(PrincipalEmployerBranch, pk=pk)

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