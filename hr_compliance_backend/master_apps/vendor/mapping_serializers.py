from rest_framework import serializers
from .mapping_models import VendorBranchMapping


class VendorBranchMappingSerializer(serializers.ModelSerializer):

    class Meta:
        model = VendorBranchMapping
        fields = "__all__"

    def validate(self, data):
        if data["end_date"] < data["start_date"]:
            raise serializers.ValidationError(
                {"end_date": "End date must be after start date"}
            )
        return data