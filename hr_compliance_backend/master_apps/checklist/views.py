from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import (
    State, Act, ComplianceNature, Section, Rule, AuditChecklist, StateAct
)

from .serializers import (
    StateSerializer,
    ActSerializer,
    ComplianceNatureSerializer,
    SectionSerializer,
    RuleSerializer,
    AuditChecklistCreateSerializer,
    AuditChecklistListSerializer,
)

# =========================
# STATE LIST
# =========================
class StateListAPIView(APIView):
    def get(self, request):
        qs = State.objects.filter(is_active=True).order_by("name")
        return Response(StateSerializer(qs, many=True).data, status=status.HTTP_200_OK)


# =========================
# ACTS BY STATE
# =========================
class ActByStateAPIView(APIView):
    def get(self, request):
        state_id = request.GET.get("state")

        if not state_id:
            return Response(
                {"error": "state query parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        qs = Act.objects.filter(
            stateact__state_id=state_id,
            is_active=True
        ).order_by("name")

        return Response(ActSerializer(qs, many=True).data, status=status.HTTP_200_OK)


# =========================
# COMPLIANCE NATURE LIST
# =========================
class ComplianceNatureListAPIView(APIView):
    def get(self, request):
        qs = ComplianceNature.objects.filter(is_active=True).order_by("name")
        return Response(
            ComplianceNatureSerializer(qs, many=True).data,
            status=status.HTTP_200_OK
        )


# =========================
# SECTIONS BY ACT
# =========================
class SectionByActAPIView(APIView):
    def get(self, request):
        act_id = request.GET.get("act")

        if not act_id:
            return Response(
                {"error": "act query parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        qs = Section.objects.filter(act_id=act_id).order_by("section_number")
        return Response(SectionSerializer(qs, many=True).data, status=status.HTTP_200_OK)


# =========================
# RULES BY SECTION
# =========================
class RuleBySectionAPIView(APIView):
    def get(self, request):
        section_id = request.GET.get("section")

        if not section_id:
            return Response(
                {"error": "section query parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        qs = Rule.objects.filter(section_id=section_id).order_by("rule_number")
        return Response(RuleSerializer(qs, many=True).data, status=status.HTTP_200_OK)


# =========================
# CREATE AUDIT CHECKLIST (✅ FIXED)
# =========================
class AuditChecklistCreateAPIView(APIView):
    def post(self, request):
        serializer = AuditChecklistCreateSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        serializer.save()

        return Response(
            {"message": "Audit checklist created successfully"},
            status=201
        )


# =========================
# LIST AUDIT CHECKLIST
# =========================
class AuditChecklistListAPIView(APIView):
    def get(self, request):
        qs = (
            AuditChecklist.objects
            .select_related(
                "state",
                "act",
                "compliance_nature",
                "section",
                "rule",
                "document",
            )
            .order_by("-id")
        )
        serializer = AuditChecklistListSerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


# =========================
# UPDATE AUDITOR GUIDE (INLINE EDIT)
# =========================
class AuditChecklistUpdateAPIView(APIView):
    def put(self, request, pk):
        try:
            checklist = AuditChecklist.objects.get(pk=pk)
        except AuditChecklist.DoesNotExist:
            return Response(
                {"error": "Checklist not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        checklist.auditor_guide = request.data.get(
            "auditor_guide", checklist.auditor_guide
        )
        checklist.save(update_fields=["auditor_guide"])

        return Response(
            {"message": "Checklist updated successfully"},
            status=status.HTTP_200_OK,
        )


# =========================
# TOGGLE ACTIVE / INACTIVE
# =========================
class AuditChecklistToggleStatusAPIView(APIView):
    def post(self, request, pk):
        try:
            checklist = AuditChecklist.objects.get(pk=pk)
        except AuditChecklist.DoesNotExist:
            return Response(
                {"error": "Checklist not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        checklist.is_active = not checklist.is_active
        checklist.save(update_fields=["is_active"])

        return Response(
            {"message": "Checklist status updated"},
            status=status.HTTP_200_OK,
        )

class ActCreateAPIView(APIView):
    def post(self, request):
        name = request.data.get("name")
        state_id = request.data.get("state")

        if not name:
            return Response({"error": "Act name required"}, status=400)

        act, _ = Act.objects.get_or_create(name=name.strip())

        # map to state
        if state_id:
            StateAct.objects.get_or_create(
                state_id=state_id,
                act=act
            )

        return Response(
            {"message": "Act created", "id": act.id, "name": act.name},
            status=201
        )