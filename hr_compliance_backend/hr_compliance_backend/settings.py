"""
Django settings for hr_compliance_backend project.
"""

from pathlib import Path
import os
import pymysql
from dotenv import load_dotenv

pymysql.install_as_MySQLdb()
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = "django-insecure-dev-key"
DEBUG = True

ALLOWED_HOSTS = ["127.0.0.1", "localhost"]

# --------------------
# Applications
# --------------------
INSTALLED_APPS = [
    # Django core
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # Third-party
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",

    # Global
    "accounts",

    # =========================
    # MASTER APPS (SUPERADMIN)
    # =========================
    "master_apps.principle_employee",
    "master_apps.vendor",
    "master_apps.auditor",
    "master_apps.checklist",
    "master_apps.documents",

    # =========================
    # PORTAL / TRANSACTIONAL
    # =========================
    "portal_apps.principal_employer_docs",
    "portal_apps.vendor_documents",
    "portal_apps.documents_files",

    # =========================
    # STANDALONE PORTALS (NEW)
    # =========================
    "portal_apps.pe_portal",
    "portal_apps.vendor_portal",
    "portal_apps.auditor_portal",
]


# --------------------
# Middleware
# --------------------
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

# --------------------
# Templates
# --------------------
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

# --------------------
# Database
# --------------------
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

# --------------------
# Media (IMPORTANT)
# --------------------
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "portal_apps" / "documents_files"


# --------------------
# Static
# --------------------
STATIC_URL = "/static/"

# --------------------
# Auth
# --------------------
AUTH_USER_MODEL = "accounts.User"

# --------------------
# Email
# --------------------
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "smtp.sendgrid.net"
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = "apikey"
EMAIL_HOST_PASSWORD = os.getenv("SENDGRID_API_KEY")
DEFAULT_FROM_EMAIL = "HR Compliance <hrcompliance.system@gmail.com>"

# --------------------
# Misc
# --------------------
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

CORS_ALLOW_ALL_ORIGINS = True

FRONTEND_URL = "http://localhost:5173"


# --------------------
# Authentication Backends
# --------------------
AUTHENTICATION_BACKENDS = [
    "django.contrib.auth.backends.ModelBackend",
]


# --------------------
# Django REST Framework
# --------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.AllowAny",
    ),
}

