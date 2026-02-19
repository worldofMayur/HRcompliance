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

from .models import Vendor, VendorDocument
from .serializers import VendorSerializer, VendorDocumentSerializer

User = get_user_model()


# ============================
# CREATE VENDOR
# ============================
class VendorCreateAPIView(APIView):
    def post(self, request):
        try:
            with transaction.atomic():

                email = request.data.get("email")

                # ✅ PREVENT DUPLICATE VENDOR EMAIL
                if Vendor.objects.filter(email=email).exists():
                    return Response(
                        {"error": "Vendor with this email already exists"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                serializer = VendorSerializer(data=request.data)
                serializer.is_valid(raise_exception=True)
                vendor = serializer.save()

                # ✅ CREATE USER
                temp_password = get_random_string(10)
                user = User.objects.create_user(
                    username=vendor.short_name,
                    email=vendor.email,
                    password=temp_password,
                    role="VENDOR",
                    is_active=True,
                )

                user.reset_password_used = False
                user.save(update_fields=["reset_password_used"])

                # ✅ DOCUMENTS (MANDATORY)
                documents = request.FILES.getlist("document")
                if not documents:
                    return Response(
                        {"error": "Please upload at least one document"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                for file in documents:
                    doc_serializer = VendorDocumentSerializer(
                        data={
                            "vendor": vendor.id,
                            "document": file,
                        }
                    )
                    doc_serializer.is_valid(raise_exception=True)
                    doc_serializer.save()

                # ✅ EMAIL
                token = PasswordResetTokenGenerator().make_token(user)
                uid = urlsafe_base64_encode(force_bytes(user.pk))

                reset_url = f"{settings.FRONTEND_URL}/TailAdmin/reset-password/{uid}/{token}"
                login_url = f"{settings.FRONTEND_URL}/TailAdmin/signin"

                html_content = render_to_string(
                    "emails/password_reset.html",
                    {
                        "contact_person": vendor.contact_person,
                        "company_name": vendor.name,
                        "ho_address": vendor.ho_address,
                        "username": vendor.short_name,
                        "reset_url": reset_url,
                        "login_url": login_url,
                        "year": now().year,
                    },
                )

                email = EmailMultiAlternatives(
                    subject="Activate Your HR Compliance Account",
                    body="HTML email required",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    to=[vendor.email],
                )
                email.attach_alternative(html_content, "text/html")
                email.send()

                return Response(
                    {"message": "Vendor created successfully"},
                    status=status.HTTP_201_CREATED,
                )

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


# ============================
# LIST VENDORS
# ============================
class VendorListAPIView(APIView):
    def get(self, request):
        vendors = Vendor.objects.all().order_by("-created_at")
        serializer = VendorSerializer(vendors, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


# ============================
# UPDATE VENDOR
# ============================
class VendorUpdateAPIView(APIView):
    def put(self, request, pk):
        vendor = get_object_or_404(Vendor, pk=pk)

        data = request.data.copy()
        data.pop("documents", None)
        data.pop("id", None)
        data.pop("created_at", None)

        serializer = VendorSerializer(
            vendor,
            data=data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Vendor updated successfully"},
                status=status.HTTP_200_OK,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ============================
# DELETE VENDOR
# ============================
class VendorDeleteAPIView(APIView):
    def delete(self, request, pk):
        vendor = get_object_or_404(Vendor, pk=pk)
        vendor.delete()  # cascades to documents
        return Response(
            {"message": "Vendor deleted successfully"},
            status=status.HTTP_200_OK,
        )
