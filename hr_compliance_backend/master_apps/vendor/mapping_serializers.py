from rest_framework import serializers
from .mapping_models import VendorBranchMapping, VendorMappingHistory
from master_apps.documents.models import DocumentMaster
from django.utils.timezone import now
from datetime import date


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
    # ✅ WRITE
    # =========================
    document_ids = serializers.PrimaryKeyRelatedField(
        queryset=DocumentMaster.objects.all(),
        many=True,
        write_only=True,
        required=False
    )

    documents_input = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )

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
    auditor_id = serializers.IntegerField(
    source="auditor.id",
    read_only=True
    )
    vendor_short_name = serializers.CharField(source="vendor.short_name", read_only=True)
    vendor_email = serializers.CharField(source="vendor.email", read_only=True)
    vendor_mobile = serializers.CharField(source="vendor.mobile", read_only=True)
    nature_of_services = serializers.CharField(source="vendor.nature_of_services", read_only=True)

    state = serializers.SerializerMethodField()

    def get_state(self, obj):
        return obj.branch.state if obj.branch else None

    def get_status(self, obj):
        today = now().date()

        if obj.effective_date and obj.effective_date > today:
            return "Active"

        if (
            obj.principal_employer and
            hasattr(obj.principal_employer, "status") and
            obj.principal_employer.status == "Inactive"
        ):
            return "Inactive"

        if obj.end_date and obj.end_date < today:
            return "Inactive"

        return "Active"

    class Meta:
        model = VendorBranchMapping
        fields = "__all__"
        read_only_fields = ["created_at", "status", "rule", "frequency"]

    # =========================
    # ✅ CREATE
    # =========================
    def create(self, validated_data):
        document_ids = validated_data.pop("document_ids", [])
        documents_input = validated_data.pop("documents_input", [])

        audit_rule = validated_data.pop("audit_rule", None)
        audit_frequency = validated_data.pop("audit_frequency", None)

        principal_employer = validated_data.get(
            "principal_employer"
        )

        if principal_employer:
            validated_data["rule"] = (
                principal_employer.rules_applicable.upper()
            )

        if audit_frequency:
            validated_data["frequency"] = audit_frequency

        mapping = super().create(validated_data)

        if document_ids:
            mapping.documents.set(document_ids)
        elif documents_input:
            mapping.documents.set(
                DocumentMaster.objects.filter(id__in=documents_input)
            )

        return mapping

    # =========================
    # ✅ UPDATE (FINAL FIXED)
    # =========================
    def update(self, instance, validated_data):
        request = self.context.get("request")

        # 🔥 ALWAYS take CURRENT DB state as base
        previous_documents = list(instance.documents.values_list("id", flat=True))

        old_data = {
            "rule": instance.rule,
            "frequency": instance.frequency,
            "start_date": str(instance.start_date),
            "end_date": str(instance.end_date),
            "effective_date": (
                str(instance.effective_date)
                if instance.effective_date else None
            ),

            # ✅ ADD THIS
            "auditor_id": (
                instance.auditor.id
                if instance.auditor else None
            ),

            "documents": previous_documents,
        }

        document_ids = validated_data.pop("document_ids", None)
        documents_input = validated_data.pop("documents_input", None)

        effective_date = validated_data.pop("effective_date", None)

        validated_data.pop("rule", None)
        validated_data.pop("audit_rule", None)

        audit_frequency = validated_data.pop(
            "audit_frequency",
            None
        )

        if audit_frequency is not None:
            validated_data["frequency"] = audit_frequency

        today = now().date()

        # =========================
        # 🔥 FUTURE UPDATE
        # =========================
        if effective_date:
            if isinstance(effective_date, str):
                effective_date = date.fromisoformat(effective_date)

        # Inside update() method of VendorBranchMappingSerializer

        if effective_date and effective_date > today:

            if document_ids is not None:
                safe_documents = [d.id for d in document_ids] if hasattr(document_ids[0], 'id') else document_ids
            elif documents_input is not None:
                safe_documents = documents_input
            else:
                safe_documents = previous_documents

            safe_new_data = {
                "rule": validated_data.get("rule", instance.rule),

                "frequency": validated_data.get(
                    "frequency",
                    instance.frequency
                ),

                "start_date": str(
                    validated_data.get(
                        "start_date",
                        instance.start_date
                    )
                ),

                "end_date": str(
                    validated_data.get(
                        "end_date",
                        instance.end_date
                    )
                ),

                "effective_date": str(effective_date),

                # ✅ ADD THIS
                "auditor_id": (
                    validated_data.get("auditor").id
                    if validated_data.get("auditor")
                    else (
                        instance.auditor.id
                        if instance.auditor else None
                    )
                ),

                "documents": safe_documents,
            }

            VendorMappingHistory.objects.create(
                mapping=instance,
                changed_by=str(request.user) if request else "system",
                change_type="FUTURE_UPDATE",
                effective_date=effective_date,
                old_data={"documents": previous_documents},
                new_data=safe_new_data,
            )
            return instance   # ← Do not apply immediately

        # =========================
        # 🔥 IMMEDIATE UPDATE
        # =========================
        instance = super().update(instance, validated_data)

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

            "effective_date": (
                str(instance.effective_date)
                if instance.effective_date else None
            ),

            # ✅ ADD THIS
            "auditor_id": (
                instance.auditor.id
                if instance.auditor else None
            ),

            "documents": list(
                instance.documents.values_list(
                    "id",
                    flat=True
                )
            ),
        }

        VendorMappingHistory.objects.create(
            mapping=instance,
            changed_by=str(request.user) if request else "system",
            change_type="UPDATE",
            effective_date=now().date(),
            old_data=old_data,
            new_data=new_data,
        )

        return instance

    # =========================
    # ✅ VALIDATION
    # =========================
    def validate(self, data):
        start_date = data.get("start_date")
        end_date = data.get("end_date")

        if start_date and end_date and end_date < start_date:
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