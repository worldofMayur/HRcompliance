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

from .models import Auditor, AuditorDocument
from .serializers import AuditorSerializer

User = get_user_model()


# ============================
# CREATE AUDITOR
# ============================
class AuditorCreateAPIView(APIView):
    def post(self, request):
        try:
            with transaction.atomic():

                email = request.data.get("email")
                mobile = request.data.get("mobile")

                # ==========================
                # GLOBAL CROSS MODULE CHECK
                # ==========================
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

                # ==========================
                # AUDITOR MODULE CHECK
                # ==========================
                if Auditor.objects.filter(email=email).exists():
                    return Response(
                        {"error": "Auditor with this email already exists"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                if Auditor.objects.filter(mobile=mobile).exists():
                    return Response(
                        {"error": "Auditor with this mobile already exists"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # ==========================
                # DOCUMENT VALIDATION
                # ==========================
                documents = request.FILES.getlist("documents")

                if not documents:
                    return Response(
                        {"error": "Please upload at least one document"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # ==========================
                # CREATE AUDITOR
                # ==========================
                serializer = AuditorSerializer(data=request.data)
                serializer.is_valid(raise_exception=True)
                auditor = serializer.save()

                # ==========================
                # CREATE USER (LINKED)
                # ==========================
                temp_password = get_random_string(10)

                user = User.objects.create_user(
                    username=auditor.short_name,
                    email=auditor.email,
                    mobile=auditor.mobile,
                    password=temp_password,
                    role="AUDITOR",
                    is_active=True,
                )

                auditor.user = user
                auditor.save(update_fields=["user"])

                user.reset_password_used = False
                user.save(update_fields=["reset_password_used"])

                # ==========================
                # SAVE DOCUMENTS
                # ==========================
                for doc in documents:
                    AuditorDocument.objects.create(
                        auditor=auditor,
                        document=doc
                    )

                # ==========================
                # GENERATE PASSWORD RESET LINK
                # ==========================
                token = PasswordResetTokenGenerator().make_token(user)
                uid = urlsafe_base64_encode(force_bytes(user.pk))

                reset_url = f"{settings.FRONTEND_URL}/TailAdmin/reset-password/{uid}/{token}"
                login_url = f"{settings.FRONTEND_URL}/TailAdmin/signin"

                html_content = render_to_string(
                    "emails/password_reset.html",
                    {
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
                    },
                )

                # ==========================
                # EMAIL FUNCTION
                # ==========================
                def send_email():
                    try:
                        email_obj = EmailMultiAlternatives(
                            subject="Activate Your HR Compliance Account",
                            body="Please activate your HR Compliance account.",
                            from_email=settings.DEFAULT_FROM_EMAIL,
                            to=[auditor.email],
                        )

                        email_obj.attach_alternative(html_content, "text/html")

                        email_obj.send(fail_silently=False)

                        print("Auditor activation email sent to:", auditor.email)

                    except Exception as email_error:
                        print("AUDITOR EMAIL ERROR:", str(email_error))

                # Send email AFTER DB commit
                transaction.on_commit(send_email)

                return Response(
                    {"message": "Auditor created successfully & email triggered"},
                    status=status.HTTP_201_CREATED,
                )

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


# ============================
# LIST AUDITORS
# ============================
class AuditorListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        auditors = Auditor.objects.all().order_by("name")
        serializer = AuditorSerializer(auditors, many=True)
        return Response(serializer.data)


# ============================
# UPDATE AUDITOR
# ============================
class AuditorUpdateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):

        auditor = get_object_or_404(Auditor, pk=pk)

        email = request.data.get("email")
        mobile = request.data.get("mobile")

        # ==========================
        # DUPLICATE CHECK (UPDATE)
        # ==========================
        if email and Auditor.objects.exclude(pk=pk).filter(email=email).exists():
            return Response(
                {"error": "Another auditor already uses this email"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if mobile and Auditor.objects.exclude(pk=pk).filter(mobile=mobile).exists():
            return Response(
                {"error": "Another auditor already uses this mobile"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = AuditorSerializer(auditor, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Auditor updated successfully"})

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ============================
# DELETE AUDITOR
# ============================
class AuditorDeleteAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):

        with transaction.atomic():

            auditor = get_object_or_404(Auditor, pk=pk)

            if auditor.user:
                auditor.user.delete()

            auditor.delete()

        return Response({"message": "Auditor deleted successfully"})