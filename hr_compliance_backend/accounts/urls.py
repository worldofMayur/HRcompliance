from django.urls import path
from .views import (
    SuperAdminLoginView,
    ResetPasswordAPIView,
    ValidateResetTokenAPIView,
)

urlpatterns = [
    path("login/", SuperAdminLoginView.as_view()),
    path("reset-password/", ResetPasswordAPIView.as_view()),
    path("validate-reset-token/", ValidateResetTokenAPIView.as_view()),
]
