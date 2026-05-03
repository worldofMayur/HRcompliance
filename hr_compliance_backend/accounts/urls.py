from django.urls import path
from .views import LoginView, LogoutAPIView, ResetPasswordAPIView, ValidateResetTokenAPIView

urlpatterns = [
    path("login/", LoginView.as_view(), name="login"),
    
    path("logout/", LogoutAPIView.as_view(), name="logout"),
    path("reset-password/", ResetPasswordAPIView.as_view(), name="reset-password"),
    path("validate-reset-token/", ValidateResetTokenAPIView.as_view(), name="validate-reset-token"),
]