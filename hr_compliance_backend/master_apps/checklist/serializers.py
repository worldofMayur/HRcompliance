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


class AuditChecklistCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditChecklist
        fields = [
            "state",
            "act",
            "compliance_nature",
            "section",
            "rule",
            "document",
            "auditor_guide",
        ]


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

