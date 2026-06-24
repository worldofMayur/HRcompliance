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

    audit_particulars = serializers.CharField()
    form_number = serializers.CharField(required=False, allow_blank=True)

    # ✅ ACCEPT BOTH STRING & LIST
    auditor_guide = serializers.JSONField()

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

        # ✅ Compliance
        compliance, _ = ComplianceNature.objects.get_or_create(
            name=validated_data["compliance_nature"].strip()
        )

        # ✅ Section
        section, _ = Section.objects.get_or_create(
            act=act,
            section_number=validated_data["section"].strip(),
            defaults={"title": validated_data["section"].strip()}
        )

        guide_input = validated_data["auditor_guide"]

        # 🔥 HANDLE BOTH CASES
        if isinstance(guide_input, str):
            checklist_points = [guide_input.strip()]

        elif isinstance(guide_input, list):
            checklist_points = [
                str(p).strip()
                for p in guide_input
                if str(p).strip()
            ]

        else:
            raise serializers.ValidationError(
                "Invalid auditor_guide format"
            )

        checklist_points = list(
            dict.fromkeys(checklist_points)
        )
        else:
            raise serializers.ValidationError("Invalid auditor_guide format")

        if not checklist_points:
            raise serializers.ValidationError("Checklist points cannot be empty")

        # 🚀 CREATE MULTIPLE ROWS
        objects = []

        for index, point in enumerate(checklist_points):
            objects.append(
                AuditChecklist(
                    state=state,
                    act=act,
                    compliance_nature=compliance,
                    section=section,
                    document=document,
                    audit_particulars=validated_data["audit_particulars"],
                    form_number=validated_data.get("form_number", ""),
                    auditor_guide=point,
                    sequence=index + 1,
                )
            )

        AuditChecklist.objects.bulk_create(objects)

        return objects


# =========================
# LIST SERIALIZER (UNCHANGED)
# =========================

class AuditChecklistListSerializer(serializers.ModelSerializer):
    state = serializers.CharField(source="state.name")
    act = serializers.CharField(source="act.name")
    compliance_nature = serializers.CharField(source="compliance_nature.name")
    section = serializers.CharField(source="section.section_number")
    document = serializers.CharField(source="document.name")

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
            "sequence",
            "is_active",
        ]