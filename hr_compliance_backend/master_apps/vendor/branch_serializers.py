from rest_framework import serializers
from .branch_models import BranchState, VendorBranch


class BranchStateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BranchState
        fields = "__all__"


class VendorBranchSerializer(serializers.ModelSerializer):

    display_address = serializers.SerializerMethodField()

    class Meta:
        model = VendorBranch
        fields = [
            "id",
            "display_address"
        ]

    def get_display_address(self, obj):
        return f"{obj.address} ({obj.city.name})"