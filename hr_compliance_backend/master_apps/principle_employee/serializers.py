from rest_framework import serializers
from .models import (
    PrincipalEmployer,
    PrincipalEmployerDocument,
    PrincipalEmployerBranch,
)


class PrincipalEmployerDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrincipalEmployerDocument
        fields = "__all__"

    def validate_document(self, file):
        allowed_extensions = [
            "pdf", "doc", "docx", "xls", "xlsx",
            "ppt", "pptx", "png", "jpg", "jpeg"
        ]

        ext = file.name.split(".")[-1].lower()

        if ext not in allowed_extensions:
            raise serializers.ValidationError(
                "Unsupported file type. Allowed: PDF, Word, Excel, PowerPoint, PNG, JPG"
            )

        if file.size > 3 * 1024 * 1024:
            raise serializers.ValidationError(
                "File size must be less than 3 MB"
            )

        return file


class PrincipalEmployerSerializer(serializers.ModelSerializer):
    documents = PrincipalEmployerDocumentSerializer(
        many=True, read_only=True
    )

    # ✅ ADD THIS (CRITICAL)
    status = serializers.CharField(read_only=True)

    class Meta:
        model = PrincipalEmployer
        fields = "__all__"
        read_only_fields = ["status"]  # ✅ PROTECT STATUS

    # =========================
    # MOBILE VALIDATION
    # =========================
    def validate_mobile(self, value):
        if not value.isdigit() or len(value) != 10:
            raise serializers.ValidationError(
                "Mobile must be exactly 10 digits"
            )
        return value

    # =========================
    # CROSS FIELD VALIDATION
    # =========================
    def validate(self, data):
        required_fields = [
            "name",
            "short_name",
            "ho_address",
            "contact_person",
            "mobile",
            "email",
            "start_date",
            "nature_of_business",
            "establishment_type",
            "rules_applicable",
        ]

        missing = [
            field for field in required_fields
            if not data.get(field)
        ]

        if missing:
            raise serializers.ValidationError({
                field: "This field is required"
                for field in missing
            })

        start = data.get("start_date")
        end = data.get("end_date")

        if start and end and end < start:
            raise serializers.ValidationError({
                "end_date": "End date must be after start date"
            })

        return data


# =========================
# BRANCH SERIALIZER
# =========================
class PrincipalEmployerBranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrincipalEmployerBranch
        fields = "__all__"

    def validate(self, data):
        required = ["principal_employer", "state", "short_name", "address"]

        missing = [field for field in required if not data.get(field)]

        if missing:
            raise serializers.ValidationError(
                {field: "This field is required" for field in missing}
            )

        return data