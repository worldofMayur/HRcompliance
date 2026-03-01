import os
import shutil

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

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
from .models import PrincipalEmployerBranch
from .serializers import PrincipalEmployerBranchSerializer
from rest_framework.parsers import MultiPartParser, FormParser
from django.db import transaction

from .models import PrincipalEmployer, PrincipalEmployerDocument
from .serializers import (
    PrincipalEmployerSerializer,
    PrincipalEmployerDocumentSerializer,
)

User = get_user_model()


# =========================
# LIST
# =========================
class PrincipalEmployerListAPIView(APIView):
    def get(self, request):
        queryset = PrincipalEmployer.objects.all().order_by("-created_at")
        serializer = PrincipalEmployerSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


# =========================
# CREATE
# =========================
class PrincipalEmployerCreateAPIView(APIView):
    def post(self, request):
        try:
            with transaction.atomic():

                email = request.data.get("email")

                if User.objects.filter(email=email).exists():
                    return Response(
                        {"error": "An account with this email already exists"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                serializer = PrincipalEmployerSerializer(data=request.data)
                serializer.is_valid(raise_exception=True)
                principal_employer = serializer.save()

                # CREATE USER
                temp_password = get_random_string(10)
                user = User.objects.create_user(
                    username=principal_employer.short_name,
                    email=principal_employer.email,
                    password=temp_password,
                    role="PE",
                    is_active=True,
                )

                user.reset_password_used = False
                user.save(update_fields=["reset_password_used"])

                # HANDLE DOCUMENTS
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


# =========================
# UPDATE
# =========================
class PrincipalEmployerUpdateAPIView(APIView):
    def put(self, request, pk):
        pe = get_object_or_404(PrincipalEmployer, pk=pk)

        data = request.data.copy()
        data.pop("documents", None)
        data.pop("created_at", None)
        data.pop("id", None)

        serializer = PrincipalEmployerSerializer(
            pe, data=data, partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# =========================
# DELETE
# =========================
class PrincipalEmployerDeleteAPIView(APIView):
    def delete(self, request, pk):
        try:
            with transaction.atomic():

                pe = get_object_or_404(PrincipalEmployer, pk=pk)

                User.objects.filter(email=pe.email).delete()

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


# =========================
# BRANCH CREATE
# =========================


class PrincipalEmployerBranchCreateAPIView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        try:
            with transaction.atomic():
                serializer = PrincipalEmployerBranchSerializer(
                    data=request.data
                )
                serializer.is_valid(raise_exception=True)

                branch = serializer.save()

                # IMPORTANT → return full saved branch
                return Response(
                    PrincipalEmployerBranchSerializer(branch).data,
                    status=status.HTTP_201_CREATED,
                )

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

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

        data = request.data.copy()

        # Force original principal employer
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
