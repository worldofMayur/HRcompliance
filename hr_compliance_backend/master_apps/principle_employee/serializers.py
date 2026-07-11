from rest_framework import serializers
from .models import (
    PrincipalEmployer,
    PrincipalEmployerDocument,
    PrincipalEmployerBranch,
)
from .validators import validate_document_file


class PrincipalEmployerDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrincipalEmployerDocument
        fields = "__all__"

    def validate_document(self, file):
        validate_document_file(file)
        return file


class PrincipalEmployerSerializer(serializers.ModelSerializer):
    documents = PrincipalEmployerDocumentSerializer(
        many=True,
        read_only=True
    )

    status = serializers.CharField(read_only=True)

    class Meta:
        model = PrincipalEmployer
        fields = "__all__"
        read_only_fields = ["status"]

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
    # VALIDATION
    # =========================
    def validate(self, data):

        # Use existing values during update
        start = data.get(
            "start_date",
            getattr(self.instance, "start_date", None)
        )

        end = data.get(
            "end_date",
            getattr(self.instance, "end_date", None)
        )

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
        required = [
            "principal_employer",
            "state",
            "short_name",
            "address"
        ]

        missing = [
            field for field in required
            if not data.get(field)
        ]

        if missing:
            raise serializers.ValidationError(
                {
                    field: "This field is required"
                    for field in missing
                }
            )

        return data