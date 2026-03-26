from rest_framework import serializers
from .models import (
    State, Act, ComplianceNature, Section, Rule, AuditChecklist
)
from master_apps.documents.models import DocumentMaster


# =========================
# MASTER SERIALIZERS
# =========================

class StateSerializer(serializers.ModelSerializer):
    class Meta:
        model = State
        fields = ["id", "name"]


class ActSerializer(serializers.ModelSerializer):
    class Meta:
        model = Act
        fields = ["id", "name"]


class ComplianceNatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComplianceNature
        fields = ["id", "name"]


class SectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Section
        fields = ["id", "section_number", "title"]


class RuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rule
        fields = ["id", "rule_number"]


# =========================
# CREATE CHECKLIST (UPDATED)
# =========================

class AuditChecklistCreateSerializer(serializers.Serializer):
    state = serializers.IntegerField()
    act = serializers.IntegerField()
    compliance_nature = serializers.CharField()
    section = serializers.CharField()
    document = serializers.IntegerField()

    # ✅ NEW FIELDS
    audit_particulars = serializers.CharField()
    form_number = serializers.CharField(required=False, allow_blank=True)

    # ✅ Guidelines
    auditor_guide = serializers.CharField()

    def validate(self, data):
        if not data.get("state"):
            raise serializers.ValidationError("State is required")

        if not data.get("act"):
            raise serializers.ValidationError("Act is required")

        if not data.get("document"):
            raise serializers.ValidationError("Document is required")

        if not data.get("auditor_guide"):
            raise serializers.ValidationError("Checklist points are required")

        return data

    def create(self, validated_data):

        # 🔍 Fetch master data
        try:
            state = State.objects.get(id=validated_data["state"])
        except State.DoesNotExist:
            raise serializers.ValidationError("Invalid state")

        try:
            act = Act.objects.get(id=validated_data["act"])
        except Act.DoesNotExist:
            raise serializers.ValidationError("Invalid act")

        try:
            document = DocumentMaster.objects.get(id=validated_data["document"])
        except DocumentMaster.DoesNotExist:
            raise serializers.ValidationError("Invalid document")

        # ✅ Compliance (safe default handling)
        compliance, _ = ComplianceNature.objects.get_or_create(
            name=validated_data["compliance_nature"].strip()
        )

        # ✅ Section
        section, _ = Section.objects.get_or_create(
            act=act,
            section_number=validated_data["section"].strip(),
            defaults={"title": validated_data["section"].strip()}
        )

        # 🚫 Duplicate check
        exists = AuditChecklist.objects.filter(
            state=state,
            act=act,
            section=section,
            document=document
        ).exists()

        if exists:
            raise serializers.ValidationError("Checklist already exists")

        # ✅ Create checklist
        return AuditChecklist.objects.create(
            state=state,
            act=act,
            compliance_nature=compliance,
            section=section,
            document=document,
            audit_particulars=validated_data["audit_particulars"],
            form_number=validated_data.get("form_number", ""),
            auditor_guide=validated_data["auditor_guide"],
        )


# =========================
# LIST SERIALIZER (UPDATED)
# =========================

class AuditChecklistListSerializer(serializers.ModelSerializer):
    state = serializers.CharField(source="state.name")
    act = serializers.CharField(source="act.name")
    compliance_nature = serializers.CharField(source="compliance_nature.name")
    section = serializers.CharField(source="section.section_number")
    document = serializers.CharField(source="document.name")

    # ✅ NEW FIELDS
    audit_particulars = serializers.CharField()
    form_number = serializers.CharField()

    class Meta:
        model = AuditChecklist
        fields = [
            "id",
            "state",
            "act",
            "compliance_nature",
            "audit_particulars",
            "section",
            "form_number",
            "document",
            "auditor_guide",
            "is_active",
        ]