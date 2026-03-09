from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str

from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class SuperAdminLoginView(APIView):
    """
    Login using email + password
    Allows SUPERADMIN, PE, VENDOR, AUDITOR
    Frontend controls access via role
    """

    def post(self, request):
        email = request.data.get("username")
        password = request.data.get("password")

        if not email or not password:
            return Response(
                {"error": "Email and password required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user_obj = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"error": "Invalid credentials"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        user = authenticate(
            username=user_obj.username,
            password=password
        )

        if not user:
            return Response(
                {"error": "Invalid credentials"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        refresh = RefreshToken.for_user(user)

        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "username": user.username,
            "email": user.email,
            "role": user.role,

            # ✅ ADDED FOR PE DOCUMENT FILTERING
            "principal_employer_id": user.principal_employer.id if getattr(user, "principal_employer", None) else None
        })




class ResetPasswordAPIView(APIView):
    """
    Sets new password using one-time reset token
    """

    def post(self, request):
        uid = request.data.get("uid")
        token = request.data.get("token")
        password = request.data.get("password")

        if not uid or not token or not password:
            return Response(
                {"error": "Invalid request"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
        except Exception:
            return Response(
                {"error": "Invalid or expired link"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 🔒 Prevent reuse
        if user.reset_password_used:
            return Response(
                {"error": "Reset link already used"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        token_generator = PasswordResetTokenGenerator()
        if not token_generator.check_token(user, token):
            return Response(
                {"error": "Invalid or expired token"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ✅ Update password
        user.set_password(password)
        user.reset_password_used = True
        user.save(update_fields=["password", "reset_password_used"])

        return Response(
            {"message": "Password reset successful"},
            status=status.HTTP_200_OK,
        )


class ValidateResetTokenAPIView(APIView):
    """
    Used by frontend to validate reset link BEFORE showing form
    """

    def post(self, request):
        uid = request.data.get("uid")
        token = request.data.get("token")

        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
        except Exception:
            return Response({"valid": False})

        if user.reset_password_used:
            return Response({"valid": False})

        token_generator = PasswordResetTokenGenerator()
        return Response({
            "valid": token_generator.check_token(user, token)
        })