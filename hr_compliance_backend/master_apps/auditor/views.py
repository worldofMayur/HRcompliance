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

                serializer = AuditorSerializer(data=request.data)
                serializer.is_valid(raise_exception=True)
                auditor = serializer.save()

                temp_password = get_random_string(10)
                user = User.objects.create_user(
                    username=auditor.short_name,
                    email=auditor.email,
                    password=temp_password,
                    role="auditor",
                    is_active=True,
                )

                documents = request.FILES.getlist("documents")
                if not documents:
                    return Response(
                        {"error": "Please upload at least one document"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                for doc in documents:
                    AuditorDocument.objects.create(
                        auditor=auditor,
                        document=doc
                    )

                token = PasswordResetTokenGenerator().make_token(user)
                uid = urlsafe_base64_encode(force_bytes(user.pk))
                reset_url = f"{settings.FRONTEND_URL}/TailAdmin/reset-password/{uid}/{token}"

                html_content = render_to_string(
                    "emails/password_reset.html",
                    {
                        "company_name": auditor.company,
                        "username": auditor.short_name,
                        "reset_url": reset_url,
                        "year": now().year,
                    },
                )

                email = EmailMultiAlternatives(
                    subject="Activate Your HR Compliance Account",
                    body="HTML email required",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    to=[auditor.email],
                )
                email.attach_alternative(html_content, "text/html")
                email.send()

                return Response(
                    {"message": "Auditor created & email sent"},
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
        auditor = Auditor.objects.get(pk=pk)
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
        auditor = Auditor.objects.get(pk=pk)
        auditor.delete()
        return Response({"message": "Auditor deleted successfully"})