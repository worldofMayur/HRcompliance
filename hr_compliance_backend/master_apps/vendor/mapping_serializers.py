from rest_framework import serializers
from .mapping_models import VendorBranchMapping
from master_apps.documents.models import DocumentMaster


class VendorBranchMappingSerializer(serializers.ModelSerializer):

    documents = serializers.PrimaryKeyRelatedField(
        queryset=DocumentMaster.objects.all(),
        many=True,
        required=False
    )

    status = serializers.CharField(read_only=True)

    vendor_name = serializers.CharField(source="vendor.name", read_only=True)
    branch_name = serializers.CharField(source="branch.short_name", read_only=True)
    auditor_name = serializers.CharField(source="auditor.name", read_only=True)

    class Meta:
        model = VendorBranchMapping
        fields = [
            "id",
            "principal_employer",
            "vendor",
            "vendor_name",
            "branch",
            "branch_name",
            "auditor",
            "auditor_name",
            "documents",
            "start_date",
            "end_date",
            "rule",
            "frequency",
            "status",
            "created_at",
        ]
        read_only_fields = ["created_at", "status"]

    # =========================
    # ✅ MAIN VALIDATION
    # =========================
    def validate(self, data):

        start_date = data.get("start_date")
        end_date = data.get("end_date")

        # ✅ DATE CHECK
        if start_date and end_date:
            if end_date < start_date:
                raise serializers.ValidationError({
                    "end_date": "End date must be after start date"
                })

        # ✅ DUPLICATE CHECK (FIXED)
        principal_employer = data.get("principal_employer")
        vendor = data.get("vendor")
        branch = data.get("branch")

        qs = VendorBranchMapping.objects.filter(
            principal_employer=principal_employer,
            vendor=vendor,
            branch=branch,
            start_date=start_date
        )

        # exclude self during update
        if self.instance:
            qs = qs.exclude(id=self.instance.id)

        if qs.exists():
            raise serializers.ValidationError(
                "This vendor is already mapped to this branch for the selected start date."
            )

        return data