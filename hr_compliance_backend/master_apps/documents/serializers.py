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
            "document_category",
            "principal_employer_name",
            "is_active",
        ]

    def create(self, validated_data):
        pe = validated_data.get("principal_employer")
        name = validated_data.get("name")
        category = validated_data.get("document_category")

        if category:
            validated_data["name"] = f"{category}_{name}"

        elif pe:
            validated_data["name"] = f"{pe.short_name}_{name}"

        return super().create(validated_data)