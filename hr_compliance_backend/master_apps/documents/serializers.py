# documents/serializers.py
from rest_framework import serializers
from .models import DocumentMaster

class DocumentMasterSerializer(serializers.ModelSerializer):

    class Meta:
        model = DocumentMaster
        fields = "__all__"

    def create(self, validated_data):

        pe = validated_data.get("principal_employer")
        name = validated_data.get("name")

        if pe:
            validated_data["name"] = f"{pe.short_name}_{name}"

        return super().create(validated_data)
