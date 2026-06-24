from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import (
    State, Act, Section, AuditChecklist, StateAct
)

from .serializers import (
    StateSerializer,
    ActSerializer,
    SectionSerializer,
    AuditChecklistCreateSerializer,
    AuditChecklistListSerializer,
)
from django.db import transaction


# =========================
# STATE LIST
# =========================
class StateListAPIView(APIView):
    def get(self, request):
        qs = State.objects.filter(is_active=True).order_by("name")
        serializer = StateSerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


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

        acts = Act.objects.filter(
            stateact__state_id=state_id
        ).distinct().order_by("name")

        serializer = ActSerializer(acts, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


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
        serializer = SectionSerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


# =========================
# CREATE AUDIT CHECKLIST
# =========================
class AuditChecklistCreateAPIView(APIView):
    def post(self, request):
        serializer = AuditChecklistCreateSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {
                    "error": "Validation failed",
                    "details": serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        created_objects = serializer.save()

        # HANDLE BULK RESPONSE
        if isinstance(created_objects, list):
            return Response(
                {
                    "message": f"{len(created_objects)} checklist(s) created successfully",
                },
                status=status.HTTP_201_CREATED
            )

        return Response(
            {"message": "Audit checklist created successfully"},
            status=status.HTTP_201_CREATED
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
                "document",
            )
            .order_by(
                "state",
                "act",
                "section",
                "sequence"
            )
        )

        serializer = AuditChecklistListSerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


# =========================
# UPDATE CHECKLIST
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

        checklist.audit_particulars = request.data.get(
            "audit_particulars", checklist.audit_particulars
        )

        checklist.form_number = request.data.get(
            "form_number", checklist.form_number
        )

        checklist.auditor_guide = request.data.get(
            "auditor_guide", checklist.auditor_guide
        )

        # OPTIONAL: update section
        if request.data.get("section"):
            section, _ = Section.objects.get_or_create(
                act=checklist.act,
                section_number=request.data.get("section").strip(),
                defaults={"title": request.data.get("section").strip()},
            )
            checklist.section = section

        checklist.save()

        return Response(
            {"message": "Checklist updated successfully"},
            status=status.HTTP_200_OK,
        )


class AuditChecklistGroupUpdateAPIView(APIView):

    def put(self, request, pk):

        try:
            first_row = AuditChecklist.objects.get(pk=pk)

        except AuditChecklist.DoesNotExist:
            return Response(
                {"error": "Checklist not found"},
                status=404
            )

        group_rows = AuditChecklist.objects.filter(
            state=first_row.state,
            act=first_row.act,
            section=first_row.section,
            document=first_row.document,
            audit_particulars=first_row.audit_particulars,
        )

        group_rows.update(
            audit_particulars=request.data.get(
                "audit_particulars",
                first_row.audit_particulars
            ),

            form_number=request.data.get(
                "form_number",
                first_row.form_number
            )
        )

        return Response(
            {"message": "Updated"}
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


# =========================
# CREATE ACT
# =========================
class ActCreateAPIView(APIView):
    def post(self, request):
        name = request.data.get("name")
        state_id = request.data.get("state")

        if not name:
            return Response(
                {"error": "Act name required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        act, _ = Act.objects.get_or_create(name=name.strip())

        if state_id:
            StateAct.objects.get_or_create(
                state_id=state_id,
                act=act
            )

        return Response(
            {
                "message": "Act created",
                "id": act.id,
                "name": act.name
            },
            status=status.HTTP_201_CREATED
        )


# =========================
# DELETE CHECKLIST
# =========================
class AuditChecklistDeleteAPIView(APIView):
    def delete(self, request, pk):
        try:
            obj = AuditChecklist.objects.get(pk=pk)
            obj.delete()

            return Response(
                {"message": "Deleted"},
                status=status.HTTP_200_OK
            )

        except AuditChecklist.DoesNotExist:
            return Response(
                {"error": "Not found"},
                status=status.HTTP_404_NOT_FOUND
            )


class AuditChecklistGuidelineUpdateAPIView(APIView):

    def put(self, request, pk):

        try:

            guidelines = request.data.get("guidelines", [])

            first_row = AuditChecklist.objects.get(pk=pk)

            group = AuditChecklist.objects.filter(
                state=first_row.state,
                act=first_row.act,
                section=first_row.section,
                document=first_row.document,
                audit_particulars=first_row.audit_particulars
            )

            group.delete()

            rows = []

            for index, point in enumerate(guidelines):

                rows.append(
                    AuditChecklist(
                        state=first_row.state,
                        act=first_row.act,
                        compliance_nature=first_row.compliance_nature,
                        section=first_row.section,
                        document=first_row.document,
                        audit_particulars=request.data.get(
                            "audit_particulars",
                            first_row.audit_particulars
                        ),
                        form_number=request.data.get(
                            "form_number",
                            first_row.form_number
                        ),
                        auditor_guide=point,
                        sequence=index + 1
                    )
                )

            AuditChecklist.objects.bulk_create(rows)

            return Response({
                "message": "Updated"
            })

        except Exception as e:

            return Response(
                {
                    "error": str(e)
                },
                status=500
            )