# documents/serializers.py

from rest_framework import serializers
from .models import DocumentMaster


class DocumentMasterSerializer(serializers.ModelSerializer):
    
    # ✅ ADD THIS FIELD (IMPORTANT)
    principal_employer_name = serializers.CharField(
        source="principal_employer.name",
        read_only=True
    )

    class Meta:
        model = DocumentMaster
        fields = [
            "id",
            "name",
            "frequency",
            "principal_employer",
            "principal_employer_name",   # ✅ REQUIRED FOR UI
            "is_active",
        ]

    def create(self, validated_data):
        pe = validated_data.get("principal_employer")
        name = validated_data.get("name")

        # ✅ Keep your existing logic
        if pe:
            validated_data["name"] = f"{pe.short_name}_{name}"

        return super().create(validated_data)