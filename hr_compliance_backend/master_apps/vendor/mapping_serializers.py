from rest_framework import serializers
from .mapping_models import VendorBranchMapping, VendorMappingHistory
from master_apps.documents.models import DocumentMaster
from django.utils.timezone import now


class DocumentMasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentMaster
        fields = ["id", "name"]


class VendorBranchMappingSerializer(serializers.ModelSerializer):

    # =========================
    # ✅ READ
    # =========================
    documents = DocumentMasterSerializer(many=True, read_only=True)

    # =========================
    # ✅ WRITE (EXISTING)
    # =========================
    document_ids = serializers.PrimaryKeyRelatedField(
        queryset=DocumentMaster.objects.all(),
        many=True,
        write_only=True,
        required=False
    )

    # 🔥 NEW (SAFE ADD) — support direct documents array
    documents_input = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )

    # 🔥 EXISTING
    audit_rule = serializers.CharField(write_only=True, required=False)
    audit_frequency = serializers.CharField(write_only=True, required=False)

    effective_date = serializers.DateField(required=False)

    # =========================
    # ✅ COMPUTED
    # =========================
    status = serializers.SerializerMethodField()

    vendor_name = serializers.CharField(source="vendor.name", read_only=True)
    branch_name = serializers.CharField(source="branch.short_name", read_only=True)
    auditor_name = serializers.CharField(source="auditor.name", read_only=True)
    vendor_short_name = serializers.CharField(source="vendor.short_name", read_only=True)
    vendor_email = serializers.CharField(source="vendor.email", read_only=True)
    vendor_mobile = serializers.CharField(source="vendor.mobile", read_only=True)
    nature_of_services = serializers.CharField(source="vendor.nature_of_services", read_only=True)

    state = serializers.SerializerMethodField()

    def get_state(self, obj):
        return obj.branch.state if obj.branch else None

    def get_status(self, obj):
        today = now().date()
        if obj.end_date and obj.end_date < today:
            return "Inactive"
        return "Active"

    # =========================
    # ✅ META (UNCHANGED)
    # =========================
    class Meta:
        model = VendorBranchMapping
        fields = [
            "id",
            "principal_employer",

            "vendor",
            "vendor_name",
            "vendor_short_name",
            "vendor_email",
            "vendor_mobile",
            "nature_of_services",

            "branch",
            "branch_name",
            "state",

            "auditor",
            "auditor_name",

            "documents",
            "document_ids",
            "documents_input",   # 🔥 ADDED

            "audit_rule",
            "audit_frequency",
            "effective_date",

            "start_date",
            "end_date",
            "rule",
            "frequency",
            "status",
            "created_at",
        ]
        read_only_fields = ["created_at", "status", "rule", "frequency"]

    # =========================
    # ✅ CREATE (ENHANCED ONLY)
    # =========================
    def create(self, validated_data):
        document_ids = validated_data.pop("document_ids", [])
        documents_input = validated_data.pop("documents_input", [])

        audit_rule = validated_data.pop("audit_rule", None)
        audit_frequency = validated_data.pop("audit_frequency", None)

        if audit_rule:
            validated_data["rule"] = audit_rule

        if audit_frequency:
            validated_data["frequency"] = audit_frequency

        mapping = super().create(validated_data)

        # 🔥 SAFE DOCUMENT SET
        if document_ids:
            mapping.documents.set(document_ids)
        elif documents_input:
            mapping.documents.set(
                DocumentMaster.objects.filter(id__in=documents_input)
            )

        return mapping

    # =========================
    # ✅ UPDATE (ENHANCED ONLY)
    # =========================
    def update(self, instance, validated_data):
        request = self.context.get("request")

        old_data = {
            "rule": instance.rule,
            "frequency": instance.frequency,
            "start_date": str(instance.start_date),
            "end_date": str(instance.end_date),
            "documents": list(instance.documents.values_list("id", flat=True)),  # 🔥 ADDED
        }

        document_ids = validated_data.pop("document_ids", None)
        documents_input = validated_data.pop("documents_input", None)

        audit_rule = validated_data.pop("audit_rule", None)
        audit_frequency = validated_data.pop("audit_frequency", None)
        effective_date = validated_data.pop("effective_date", None)

        if audit_rule is not None:
            validated_data["rule"] = audit_rule

        if audit_frequency is not None:
            validated_data["frequency"] = audit_frequency

        today = now().date()

        # =========================
        # 🔥 FUTURE UPDATE (UNCHANGED)
        # =========================
        if effective_date and effective_date > today:
            VendorMappingHistory.objects.create(
                mapping=instance,
                changed_by=str(request.user) if request else "system",
                change_type="FUTURE_UPDATE",
                old_data=old_data,
                new_data={
                    **validated_data,
                    "documents": document_ids or documents_input or list(
                        instance.documents.values_list("id", flat=True)
                    )
                },
            )
            return instance

        # =========================
        # 🔥 APPLY UPDATE (ENHANCED)
        # =========================
        instance = super().update(instance, validated_data)

        # 🔥 FIX DOCUMENT ISSUE (CRITICAL)
        if document_ids is not None:
            instance.documents.set(document_ids)
        elif documents_input is not None:
            instance.documents.set(
                DocumentMaster.objects.filter(id__in=documents_input)
            )

        new_data = {
            "rule": instance.rule,
            "frequency": instance.frequency,
            "start_date": str(instance.start_date),
            "end_date": str(instance.end_date),
            "documents": list(instance.documents.values_list("id", flat=True)),  # 🔥 ADDED
        }

        VendorMappingHistory.objects.create(
            mapping=instance,
            changed_by=str(request.user) if request else "system",
            change_type="UPDATE",
            old_data=old_data,
            new_data=new_data,
        )

        return instance

    # =========================
    # ✅ VALIDATION (UNCHANGED)
    # =========================
    def validate(self, data):

        start_date = data.get("start_date")
        end_date = data.get("end_date")

        if start_date and end_date:
            if end_date < start_date:
                raise serializers.ValidationError({
                    "end_date": "End date must be after start date"
                })

        principal_employer = data.get("principal_employer")
        vendor = data.get("vendor")
        branch = data.get("branch")

        qs = VendorBranchMapping.objects.filter(
            principal_employer=principal_employer,
            vendor=vendor,
            branch=branch,
            start_date=start_date
        )

        if self.instance:
            qs = qs.exclude(id=self.instance.id)

        if qs.exists():
            raise serializers.ValidationError(
                "This vendor is already mapped to this branch for the selected start date."
            )

        return data