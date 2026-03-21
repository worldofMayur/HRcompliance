from rest_framework import serializers
from .models import (
    State, Act, ComplianceNature, Section, Rule, AuditChecklist
)

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


from rest_framework import serializers
from .models import AuditChecklist, State, Act, ComplianceNature, Section, Rule
from master_apps.documents.models import DocumentMaster


class AuditChecklistCreateSerializer(serializers.Serializer):
    state = serializers.IntegerField()
    act = serializers.IntegerField()
    compliance_nature = serializers.CharField()
    section = serializers.CharField()
    rule = serializers.CharField()
    document = serializers.IntegerField()
    auditor_guide = serializers.CharField()

    def create(self, validated_data):
        state = State.objects.get(id=validated_data["state"])
        act = Act.objects.get(id=validated_data["act"])
        document = DocumentMaster.objects.get(id=validated_data["document"])

        compliance, _ = ComplianceNature.objects.get_or_create(
            name=validated_data["compliance_nature"]
        )

        section, _ = Section.objects.get_or_create(
            act=act,
            section_number=validated_data["section"],
            defaults={"title": validated_data["section"]}
        )

        rule, _ = Rule.objects.get_or_create(
            section=section,
            rule_number=validated_data["rule"],
            defaults={"description": validated_data["rule"]}
        )

        return AuditChecklist.objects.create(
            state=state,
            act=act,
            compliance_nature=compliance,
            section=section,
            rule=rule,
            document=document,
            auditor_guide=validated_data["auditor_guide"]
        )


class AuditChecklistListSerializer(serializers.ModelSerializer):
    state = serializers.CharField(source="state.name")
    act = serializers.CharField(source="act.name")
    compliance_nature = serializers.CharField(source="compliance_nature.name")
    section = serializers.CharField(source="section.section_number")
    rule = serializers.CharField(source="rule.rule_number")
    document = serializers.CharField(source="document.name")

    class Meta:
        model = AuditChecklist
        fields = [
            "id",
            "state",
            "act",
            "compliance_nature",
            "section",
            "rule",
            "document",
            "auditor_guide",   # ✅ ADD THIS
            "is_active",
        ]

