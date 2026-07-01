from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import (
    IsAuthenticated,
    AllowAny,
)

from django.contrib.auth.tokens import (
    PasswordResetTokenGenerator,
)
from django.utils.http import (
    urlsafe_base64_decode,
)
from django.utils.encoding import force_str

from rest_framework_simplejwt.tokens import (
    RefreshToken,
)

from django.contrib.auth import get_user_model

User = get_user_model()


# =========================================================
# LOGIN
# =========================================================
class LoginView(APIView):

    # ✅ LOGIN SHOULD BE PUBLIC
    permission_classes = [AllowAny]

    def post(self, request):

        print("\n===== LOGIN DEBUG =====")

        try:
            email = request.data.get("email")
            password = request.data.get("password")

            print("EMAIL:", email)

            if not email or not password:
                return Response(
                    {
                        "error":
                        "Email and password required"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # CLEAN INPUT
            email = email.strip().lower()
            password = password.strip()

            print("NORMALIZED EMAIL:", email)

            try:
                user = User.objects.get(email=email)

                print(
                    "✅ USER FOUND:",
                    user.email
                )

            except User.DoesNotExist:

                print("❌ USER NOT FOUND")

                return Response(
                    {"error": "Invalid email"},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            # PASSWORD CHECK
            print(
                "RAW PASSWORD:",
                repr(password)
            )

            password_valid = (
                user.check_password(password)
            )

            print(
                "PASSWORD CHECK:",
                password_valid
            )

            if not password_valid:

                print(
                    "❌ PASSWORD INVALID"
                )

                return Response(
                    {"error": "Invalid password"},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            # ACTIVE CHECK
            if not user.is_active:

                print("❌ USER INACTIVE")

                return Response(
                    {
                        "error":
                        "Account inactive"
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            # ROLE CHECK
            ALLOWED_ROLES = {
                "SUPERADMIN",
                "PE",
                "VENDOR",
                "AUDITOR",
            }

            if user.role not in ALLOWED_ROLES:

                print("❌ INVALID ROLE")

                return Response(
                    {
                        "error":
                        "Unauthorized role"
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            # JWT TOKENS
            refresh = RefreshToken.for_user(user)

            print("✅ LOGIN SUCCESS")

            return Response({
                "access":
                    str(refresh.access_token),

                "refresh":
                    str(refresh),

                "is_authenticated":
                    True,

                "username":
                    user.username,

                "email":
                    user.email,

                "role":
                    user.role,

                "principal_employer_id": (
                    user.principal_employer.id
                    if getattr(
                        user,
                        "principal_employer",
                        None
                    )
                    else None
                ),

                "principal_employer_name": (
                    user.principal_employer.name
                    if getattr(
                        user,
                        "principal_employer",
                        None
                    )
                    else None
                ),
            })

        except Exception as e:

            print(
                "❌ LOGIN ERROR:",
                str(e)
            )

            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


# =========================================================
# LOGOUT
# =========================================================
class LogoutAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        try:
            refresh_token = request.data.get(
                "refresh"
            )

            if refresh_token:
                token = RefreshToken(
                    refresh_token
                )

                token.blacklist()

            return Response(
                {
                    "message":
                    "Logout successful"
                },
                status=status.HTTP_200_OK
            )

        except Exception as e:

            print(
                "LOGOUT ERROR:",
                str(e)
            )

            return Response(
                {"error": "Logout failed"},
                status=status.HTTP_400_BAD_REQUEST,
            )


# =========================================================
# RESET PASSWORD
# =========================================================
class ResetPasswordAPIView(APIView):

    # ✅ PUBLIC API
    permission_classes = [AllowAny]

    def post(self, request):

        uid = request.data.get("uid")
        token = request.data.get("token")
        password = request.data.get("password")

        if not uid or not token or not password:

            return Response(
                {"error": "Invalid request"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user_id = force_str(
                urlsafe_base64_decode(uid)
            )

            user = User.objects.get(
                pk=user_id
            )

        except Exception:

            return Response(
                {
                    "error":
                    "Invalid or expired link"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if getattr(
            user,
            "reset_password_used",
            False
        ):

            return Response(
                {
                    "error":
                    "Reset link already used"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        token_generator = (
            PasswordResetTokenGenerator()
        )

        if not token_generator.check_token(
            user,
            token
        ):

            return Response(
                {
                    "error":
                    "Invalid or expired token"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(password)

        user.reset_password_used = True

        user.save(update_fields=[
            "password",
            "reset_password_used"
        ])

        return Response(
            {
                "message":
                "Password reset successful"
            },
            status=status.HTTP_200_OK
        )


# =========================================================
# VALIDATE RESET TOKEN
# =========================================================
class ValidateResetTokenAPIView(APIView):

    # ✅ PUBLIC API
    permission_classes = [AllowAny]

    def post(self, request):

        uid = request.data.get("uid")
        token = request.data.get("token")

        try:
            user_id = force_str(
                urlsafe_base64_decode(uid)
            )

            user = User.objects.get(
                pk=user_id
            )

        except Exception:

            return Response({"valid": False})

        if getattr(
            user,
            "reset_password_used",
            False
        ):

            return Response({"valid": False})

        token_generator = (
            PasswordResetTokenGenerator()
        )

        return Response({
            "valid":
                token_generator.check_token(
                    user,
                    token
                )
        })