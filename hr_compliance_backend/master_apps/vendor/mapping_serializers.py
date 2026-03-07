from rest_framework import serializers
from .mapping_models import VendorBranchMapping


class VendorBranchMappingSerializer(serializers.ModelSerializer):

    class Meta:
        model = VendorBranchMapping
        fields = [
            "id",
            "principal_employer",
            "vendor",
            "branch",
            "auditor",
            "document",
            "start_date",
            "end_date",
            "rule",
            "frequency",
            "audit_period",
            "created_at",
        ]
        read_only_fields = ["created_at"]

    def validate(self, data):

        start_date = data.get("start_date")
        end_date = data.get("end_date")

        if start_date and end_date:
            if end_date < start_date:
                raise serializers.ValidationError({
                    "end_date": "End date must be after start date"
                })

        return data

    def validate_unique(self, data):
        """
        Prevent duplicate mappings
        """
        principal_employer = data.get("principal_employer")
        vendor = data.get("vendor")
        branch = data.get("branch")
        start_date = data.get("start_date")

        if VendorBranchMapping.objects.filter(
            principal_employer=principal_employer,
            vendor=vendor,
            branch=branch,
            start_date=start_date
        ).exists():
            raise serializers.ValidationError(
                "This vendor is already mapped to this branch for the selected start date."
            )

        return data