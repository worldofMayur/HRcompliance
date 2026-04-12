import os
from django.core.exceptions import ValidationError

ALLOWED_EXTENSIONS = {
    ".pdf", ".doc", ".docx",
    ".xls", ".xlsx",
    ".ppt", ".pptx",
    ".png", ".jpg", ".jpeg",
}

ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "image/png",
    "image/jpeg",
}

MAX_FILE_SIZE_MB = 3


def validate_document_file(file):
    # =============================
    # EXTENSION VALIDATION
    # =============================
    ext = os.path.splitext(file.name)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValidationError(
            f"Unsupported file type '{ext}'. Allowed types: PDF, Word, Excel, PPT, JPG, PNG."
        )

    # =============================
    # SIZE VALIDATION
    # =============================
    size_mb = file.size / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise ValidationError(
            f"File size must be less than {MAX_FILE_SIZE_MB} MB. Uploaded: {size_mb:.2f} MB."
        )

    # =============================
    # CONTENT TYPE VALIDATION (SAFE)
    # =============================
    content_type = getattr(file, "content_type", None)

    if content_type and content_type not in ALLOWED_CONTENT_TYPES:
        raise ValidationError(
            f"Invalid file type '{content_type}'."
        )