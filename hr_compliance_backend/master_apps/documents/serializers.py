# documents/serializers.py
from rest_framework import serializers
from .models import DocumentMaster

class DocumentMasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentMaster
        fields = "__all__"
