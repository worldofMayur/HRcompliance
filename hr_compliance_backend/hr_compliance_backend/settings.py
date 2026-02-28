"""
Django settings for hr_compliance_backend project.
"""

from pathlib import Path
import os
import pymysql
from dotenv import load_dotenv

pymysql.install_as_MySQLdb()
load_dotenv()

# ==========================================================
# BASE
# ==========================================================
BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = "django-insecure-dev-key"

DEBUG = True

ALLOWED_HOSTS = ["127.0.0.1", "localhost"]

# ==========================================================
# APPLICATIONS
# ==========================================================
INSTALLED_APPS = [
    # Django Core
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # Third Party
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",

    # Global
    "accounts",

    # ================= MASTER APPS =================
    "master_apps.principle_employee",
    "master_apps.vendor",
    "master_apps.auditor",
    "master_apps.checklist",
    "master_apps.documents",

    # ================= PORTAL APPS =================
    "portal_apps.principal_employer_docs",
    "portal_apps.vendor_documents",
    "portal_apps.documents_files",

    # ================= STANDALONE PORTALS =================
    "portal_apps.pe_portal",
    "portal_apps.vendor_portal",
    "portal_apps.auditor_portal",
]

# ==========================================================
# MIDDLEWARE
# ==========================================================
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "hr_compliance_backend.urls"

# ==========================================================
# TEMPLATES
# ==========================================================
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "hr_compliance_backend.wsgi.application"

# ==========================================================
# DATABASE (MySQL)
# ==========================================================
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.mysql",
        "NAME": "hr_compliance_data",
        "USER": "hr_admin",
        "PASSWORD": "StrongPassword@123",
        "HOST": "localhost",
        "PORT": "3306",
        "OPTIONS": {
            "init_command": "SET sql_mode='STRICT_TRANS_TABLES'",
        },
    }
}

# ==========================================================
# MEDIA FILES
# ==========================================================
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "portal_apps" / "documents_files"

# ==========================================================
# STATIC FILES
# ==========================================================
STATIC_URL = "/static/"

# ==========================================================
# AUTH USER MODEL
# ==========================================================
AUTH_USER_MODEL = "accounts.User"

AUTHENTICATION_BACKENDS = [
    "django.contrib.auth.backends.ModelBackend",
]

# ==========================================================
# EMAIL (SendGrid SMTP)
# ==========================================================
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"

EMAIL_HOST = "smtp.sendgrid.net"
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_USE_SSL = False

# IMPORTANT: must be literal "apikey"
EMAIL_HOST_USER = "apikey"

# Must be defined in .env file
EMAIL_HOST_PASSWORD = os.environ.get("SENDGRID_API_KEY")

# Verified sender email in SendGrid
DEFAULT_FROM_EMAIL = "HR Compliance <kekultesting@gmail.com>"

# ==========================================================
# DJANGO REST FRAMEWORK
# ==========================================================
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.AllowAny",
    ),
}

# ==========================================================
# CORS
# ==========================================================
CORS_ALLOW_ALL_ORIGINS = True

# ==========================================================
# TIMEZONE
# ==========================================================
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ==========================================================
# FRONTEND URL (for email reset links)
# ==========================================================
FRONTEND_URL = "http://localhost:5173"