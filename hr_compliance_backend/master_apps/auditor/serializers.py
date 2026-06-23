from rest_framework import serializers
from .models import Auditor, AuditorDocument


class AuditorDocumentSerializer(serializers.ModelSerializer):

    class Meta:
        model = AuditorDocument
        fields = ["id", "document", "uploaded_at"]

    def validate_document(self, file):

        allowed_extensions = [
            "pdf",
            "doc",
            "docx",
            "xls",
            "xlsx",
            "ppt",
            "pptx",
            "jpg",
            "jpeg",
            "png",
            "zip",   # ✅ Added ZIP support
        ]

        extension = file.name.split(".")[-1].lower()

        if extension not in allowed_extensions:
            raise serializers.ValidationError(
                "Allowed formats: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, JPEG, PNG, ZIP"
            )

        max_size = 10 * 1024 * 1024

        if file.size > max_size:
            raise serializers.ValidationError(
                "Maximum file size allowed is 10 MB"
            )

        return file


class AuditorSerializer(serializers.ModelSerializer):

    documents = AuditorDocumentSerializer(
        many=True,
        read_only=True
    )

    class Meta:
        model = Auditor
        fields = "__all__"

    # =========================
    # MOBILE VALIDATION
    # =========================
    def validate_mobile(self, value):

        if not value.isdigit():
            raise serializers.ValidationError(
                "Mobile must contain digits only"
            )

        if len(value) != 10:
            raise serializers.ValidationError(
                "Mobile must be exactly 10 digits"
            )

        return value