from rest_framework import serializers
from .models import Vendor, VendorDocument


class VendorDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = VendorDocument
        fields = "__all__"


class VendorSerializer(serializers.ModelSerializer):
    documents = VendorDocumentSerializer(many=True, read_only=True)

    class Meta:
        model = Vendor
        fields = "__all__"

    def validate_mobile(self, value):
        if not value.isdigit() or len(value) != 10:
            raise serializers.ValidationError(
                "Mobile must be exactly 10 digits"
            )
        return value