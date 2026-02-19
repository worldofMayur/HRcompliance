import os
from django.core.exceptions import ValidationError

ALLOWED_EXTENSIONS = {
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".ppt",
    ".pptx",
    ".png",
    ".jpg",
    ".jpeg",
}

MAX_FILE_SIZE_MB = 3


def validate_document_file(file):
    # ✅ Extension validation
    ext = os.path.splitext(file.name)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValidationError(
            f"Unsupported file type '{ext}'. "
            f"Allowed types: PDF, Word, Excel, PPT, JPG, PNG only."
        )

    # ✅ Size validation
    size_mb = file.size / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise ValidationError(
            f"File size must be less than {MAX_FILE_SIZE_MB} MB. "
            f"Uploaded file is {size_mb:.2f} MB."
        )
