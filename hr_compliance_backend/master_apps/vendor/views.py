from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from django.db import transaction
from django.conf import settings
from django.utils.crypto import get_random_string
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.http import urlsafe_base64_encode
from django.shortcuts import get_object_or_404
from django.utils.encoding import force_bytes
from django.utils.timezone import now
from django.template.loader import render_to_string
from django.core.mail import EmailMultiAlternatives
from rest_framework.permissions import IsAuthenticated

from .models import Vendor, VendorDocument
from .serializers import VendorSerializer, VendorDocumentSerializer

User = get_user_model()


class VendorCreateAPIView(APIView):

    def post(self, request):

        try:
            with transaction.atomic():

                email = request.data.get("email")
                mobile = request.data.get("mobile")
                vendor_name = request.data.get("name")

                # =====================================
                # GLOBAL EMAIL DUPLICATE CHECK
                # =====================================
                if User.objects.filter(email=email).exists():
                    return Response(
                        {"error": "Email already registered in system"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # =====================================
                # VENDOR EMAIL DUPLICATE CHECK
                # =====================================
                if Vendor.objects.filter(email=email).exists():
                    return Response(
                        {"error": "Vendor with this email already exists"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # =====================================
                # MOBILE VALIDATION
                # =====================================

                # 1️⃣ Mobile already used by PE / Auditor / SuperAdmin
                if User.objects.filter(mobile=mobile).exclude(role="VENDOR").exists():
                    return Response(
                        {"error": "Mobile already registered with another account"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # 2️⃣ Same mobile but different vendor company
                existing_vendor = Vendor.objects.filter(mobile=mobile).first()

                if existing_vendor and existing_vendor.name != vendor_name:
                    return Response(
                        {"error": "Mobile already registered for another vendor company"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # =====================================
                # CREATE VENDOR
                # =====================================
                serializer = VendorSerializer(data=request.data)
                serializer.is_valid(raise_exception=True)
                vendor = serializer.save()

                # =====================================
                # CREATE USER ACCOUNT
                # =====================================
                temp_password = get_random_string(10)

                user = User.objects.create_user(
                    username=vendor.short_name,
                    email=vendor.email,
                    mobile=vendor.mobile,
                    password=temp_password,
                    role="VENDOR",
                    is_active=True,
                )

                # Link vendor to user
                vendor.user = user
                vendor.save(update_fields=["user"])

                user.reset_password_used = False
                user.save(update_fields=["reset_password_used"])

                # =====================================
                # DOCUMENTS (MANDATORY)
                # =====================================
                documents = request.FILES.getlist("document")

                if not documents:
                    return Response(
                        {"error": "Please upload at least one document"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                MAX_FILE_SIZE = 3 * 1024 * 1024  # 3MB

                for file in documents:

                    if file.size > MAX_FILE_SIZE:
                        return Response(
                            {"error": f"{file.name} exceeds 3MB limit"},
                            status=status.HTTP_400_BAD_REQUEST,
                        )

                    doc_serializer = VendorDocumentSerializer(
                        data={
                            "vendor": vendor.id,
                            "document": file,
                        }
                    )

                    doc_serializer.is_valid(raise_exception=True)
                    doc_serializer.save()

                # =====================================
                # PASSWORD RESET EMAIL
                # =====================================
                token = PasswordResetTokenGenerator().make_token(user)
                uid = urlsafe_base64_encode(force_bytes(user.pk))

                reset_url = f"{settings.FRONTEND_URL}/TailAdmin/reset-password/{uid}/{token}"
                login_url = f"{settings.FRONTEND_URL}/TailAdmin/signin"

                html_content = render_to_string(
                    "emails/password_reset.html",
                    {
                        "role": "Vendor",
                        "contact_person": vendor.contact_person,
                        "company_name": vendor.name,
                        "ho_address": vendor.ho_address,
                        "username": vendor.short_name,
                        "email": vendor.email,
                        "mobile": vendor.mobile,
                        "reset_url": reset_url,
                        "login_url": login_url,
                        "year": now().year,
                    },
                )

                email_status = "Email sent successfully"

                # =====================================
                # SEND EMAIL
                # =====================================

                try:

                    print("Sending vendor activation email to:", vendor.email)

                    email_obj = EmailMultiAlternatives(
                        subject="Activate Your HR Compliance Account",
                        body="Please activate your HR Compliance account.",
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        to=[vendor.email],
                    )

                    email_obj.attach_alternative(html_content, "text/html")

                    email_obj.send(fail_silently=False)

                    email_status = "Email sent successfully"

                except Exception as e:

                    print("VENDOR EMAIL ERROR:", str(e))
                    email_status = "Vendor created but email failed"

                # =====================================
                # RESPONSE
                # =====================================
                return Response(
                    {
                        "message": "Vendor created successfully",
                        "email_status": email_status,
                    },
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
    permission_classes = [IsAuthenticated]

    def get(self, request):

        if request.user.role not in ["SUPERADMIN", "PE"]:
            return Response({"error": "Unauthorized"}, status=403)

        vendors = Vendor.objects.all().order_by("-created_at")
        serializer = VendorSerializer(vendors, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


# ============================
# UPDATE VENDOR
# ============================
class VendorUpdateAPIView(APIView):
    def put(self, request, pk):
        vendor = get_object_or_404(Vendor, pk=pk)

        email = request.data.get("email")
        mobile = request.data.get("mobile")

        # ==========================
        # DUPLICATE CHECK (UPDATE)
        # ==========================
        if email and Vendor.objects.exclude(pk=pk).filter(email=email).exists():
            return Response(
                {"error": "Another vendor already uses this email"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if mobile and Vendor.objects.exclude(pk=pk).filter(mobile=mobile).exists():
            return Response(
                {"error": "Another vendor already uses this mobile"},
                status=status.HTTP_400_BAD_REQUEST,
            )

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

        try:
            with transaction.atomic():

                vendor = get_object_or_404(Vendor, pk=pk)

                # Store user reference before deleting vendor
                user = vendor.user

                # Delete vendor (documents cascade automatically)
                vendor.delete()

                # Delete linked user
                if user:
                    user.delete()

                return Response(
                    {"message": "Vendor deleted successfully"},
                    status=status.HTTP_200_OK,
                )

        except Exception as e:
            print("DELETE ERROR:", str(e))
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )