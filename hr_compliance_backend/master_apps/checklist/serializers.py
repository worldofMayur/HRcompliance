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

    # CHECK GROUP
    check_group = serializers.CharField(
        required=False,
        allow_blank=False,
        default="First Check"
    )

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

        default_check_group = (
            validated_data.get("check_group")
            or "First Check"
        ).strip()

        # 🔥 HANDLE BOTH CASES
        guide_input = validated_data["auditor_guide"]

        if isinstance(guide_input, str):
            checklist_points = [guide_input.strip()]

        elif isinstance(guide_input, list):
            checklist_points = []

            for p in guide_input:

                if isinstance(p, dict):

                    text = str(
                        p.get("text", "")
                    ).strip()

                    if text:
                        checklist_points.append({
                            "text": text,
                            "check_group": str(
                                p.get("check_group")
                                or validated_data.get(
                                    "check_group",
                                    "First Check"
                                )
                            ).strip()
                        })

                else:

                    text = str(p).strip()

                    if text:
                        checklist_points.append(text)

        else:
            raise serializers.ValidationError(
                "Invalid auditor_guide format"
            )

        # ==========================================
        # REMOVE DUPLICATES SAFELY
        # SAME TEXT CAN EXIST IN DIFFERENT CHECK GROUPS
        # ==========================================

        unique_points = []
        seen_points = set()

        for point in checklist_points:

            if isinstance(point, dict):

                text = str(
                    point.get("text", "")
                ).strip()

                group = str(
                    point.get("check_group")
                    or "First Check"
                ).strip()

            else:

                text = str(point).strip()
                group = default_check_group

            key = (
                text.lower(),
                group.lower()
            )

            if not text:
                continue

            if key in seen_points:
                continue

            seen_points.add(key)
            unique_points.append(point)

        checklist_points = unique_points

        if not checklist_points:
            raise serializers.ValidationError(
                "Checklist points cannot be empty"
            )

        # 🚀 CREATE MULTIPLE ROWS
        objects = []

        # ==========================================
        # BUILD CHECKPOINTS WITH THEIR CHECK GROUP
        # ==========================================

        objects = []

        for index, point in enumerate(checklist_points):

            # ------------------------------------------
            # NEW FORMAT:
            # {
            #     "text": "Guideline text",
            #     "check_group": "First Check"
            # }
            # ------------------------------------------
            if isinstance(point, dict):

                guideline_text = str(
                    point.get("text", "")
                ).strip()

                point_check_group = str(
                    point.get("check_group")
                    or default_check_group
                ).strip()

            # ------------------------------------------
            # OLD FORMAT:
            # "Guideline text"
            #
            # Existing checklist creation continues
            # to work exactly as before.
            # ------------------------------------------
            else:

                guideline_text = str(point).strip()

                point_check_group = (
                    default_check_group
                )

            if not guideline_text:
                continue

            if not point_check_group:
                point_check_group = "First Check"

            objects.append(
                AuditChecklist(
                    state=state,
                    act=act,
                    compliance_nature=compliance,
                    section=section,
                    document=document,
                    audit_particulars=validated_data[
                        "audit_particulars"
                    ],
                    form_number=validated_data.get(
                        "form_number",
                        ""
                    ),
                    check_group=point_check_group,
                    auditor_guide=guideline_text,
                    sequence=index + 1,
                )
            )

        AuditChecklist.objects.bulk_create(objects)

        return objects


# =========================
# LIST SERIALIZER (UNCHANGED)
# =========================

class AuditChecklistListSerializer(serializers.ModelSerializer):
    state_id = serializers.IntegerField(source="state.id")
    act_id = serializers.IntegerField(source="act.id")
    document_id = serializers.IntegerField(source="document.id")
    state = serializers.CharField(source="state.name")
    act = serializers.CharField(source="act.name")
    compliance_nature = serializers.CharField(source="compliance_nature.name")
    section = serializers.CharField(source="section.section_number")
    document = serializers.CharField(source="document.name")

    audit_particulars = serializers.CharField()
    form_number = serializers.CharField()
    check_group = serializers.CharField()

    class Meta:
        model = AuditChecklist
        fields = [
            "id",
            "state",
            "state_id",
            "act",
            "act_id",
            "compliance_nature",
            "audit_particulars",
            "section",
            "form_number",
            "check_group",
            "document",
            "document_id",
            "auditor_guide",
            "sequence",
            "is_active",
        ]