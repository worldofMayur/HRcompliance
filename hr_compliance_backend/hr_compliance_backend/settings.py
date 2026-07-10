"""
Django settings for hr_compliance_backend project.
"""

from pathlib import Path
import os
import pymysql
from dotenv import load_dotenv
from datetime import timedelta


pymysql.install_as_MySQLdb()
load_dotenv()

# ==========================================================
# BASE
# ==========================================================
BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = "django-insecure-dev-key"

DEBUG = os.getenv("DEBUG", "False").lower() == "true"

ALLOWED_HOSTS = ["*"]  # For now, but better to set specific domains later

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
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",

    # Global
    "accounts",

    # ================= MASTER APPS =================
    "master_apps.principle_employee",
    "master_apps.vendor",
    "master_apps.auditor",
    "master_apps.checklist",
    "master_apps.documents",
]

# ==========================================================
# MIDDLEWARE
# ==========================================================
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
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
        "DIRS": [
            os.path.join(BASE_DIR, "templates")
        ],
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
# ==========================================================
# DATABASE (Coolify MySQL)
# ==========================================================
# DATABASE (Coolify MySQL)
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.mysql",
        "NAME": os.getenv("DB_NAME"),
        "USER": os.getenv("DB_USER"),
        "PASSWORD": os.getenv("DB_PASSWORD"),
        "HOST": os.getenv("DB_HOST"),
        "PORT": os.getenv("DB_PORT", "3306"),
        "OPTIONS": {
            "init_command": "SET sql_mode='STRICT_TRANS_TABLES'",
            # Add this for better stability in containers:
            "connect_timeout": 10,
        },
    }
}
# ==========================================================
# MEDIA FILES
# ==========================================================
MEDIA_URL = "/media/"
MEDIA_ROOT = os.path.join(
    BASE_DIR,
    "media"
)
FILE_UPLOAD_PERMISSIONS = 0o644
# ==========================================================
STATIC_URL = "/static/"
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")

STATICFILES_STORAGE = (
    "whitenoise.storage.CompressedManifestStaticFilesStorage"
)
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
# ================= EMAIL SETTINGS (BREVO) =================
# EMAIL SETTINGS
# ==========================================================
# EMAIL (RESEND)
# ==========================================================
# ==========================================================
# EMAIL CONFIGURATION (GMAIL SMTP)
# ==========================================================

EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"

EMAIL_HOST = "smtp.gmail.com"
EMAIL_PORT = 587
EMAIL_USE_TLS = True

EMAIL_HOST_USER = "noreply.hrcompliance@gmail.com"
EMAIL_HOST_PASSWORD = "xkjzfrhnyorhccaw"

DEFAULT_FROM_EMAIL = EMAIL_HOST_USER

EMAIL_TIMEOUT = 30
# ==========================================================
# DJANGO REST FRAMEWORK
# ==========================================================
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),

    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),

    "DEFAULT_RENDERER_CLASSES": (
        "rest_framework.renderers.JSONRenderer",
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
TIME_ZONE = "Asia/Kolkata"
USE_I18N = True
USE_TZ = True

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ==========================================================
# FRONTEND URL (for email reset links)
# ==========================================================
FRONTEND_URL = "https://vendor.complianceclearance.com"

SIMPLE_JWT = {
    # ACCESS TOKEN
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),

    # REFRESH TOKEN
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),

    # ROTATION
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,

    # SECURITY
    "UPDATE_LAST_LOGIN": True,

    # CLOCK SKEW TOLERANCE
    "LEEWAY": 300,

    # AUTH HEADER
    "AUTH_HEADER_TYPES": ("Bearer",),

    # TOKEN SETTINGS
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,

    # USER ID
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
}