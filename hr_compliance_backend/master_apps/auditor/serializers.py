from rest_framework import serializers
from .models import Auditor, AuditorDocument


class AuditorDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditorDocument
        fields = ["id", "document", "uploaded_at"]


class AuditorSerializer(serializers.ModelSerializer):
    documents = AuditorDocumentSerializer(many=True, read_only=True)

    class Meta:
        model = Auditor
        fields = "__all__"
