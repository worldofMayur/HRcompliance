from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .mapping_models import VendorBranchMapping
from .mapping_serializers import VendorBranchMappingSerializer
from master_apps.principle_employee.models import (
    PrincipalEmployer,
    PrincipalEmployerBranch
)
from master_apps.documents.models import DocumentMaster
from master_apps.principle_employee.models import PrincipalEmployerBranch
from rest_framework.generics import UpdateAPIView
from django.utils.timezone import now   # ✅ ADDED
from django.db.models import Q
import copy
from .utils import apply_pending_updates, apply_mapping_for_period
from datetime import date
from django.utils.timezone import now
import calendar
import datetime
from .compliance_models import VendorComplianceSubmission


def parse_period(period):

    if not period:
        return None, None

    try:

        period = period.replace("–", "-").strip()

        month_map = {
            "Jan": 1,
            "Feb": 2,
            "Mar": 3,
            "Apr": 4,
            "May": 5,
            "Jun": 6,
            "Jul": 7,
            "Aug": 8,
            "Sep": 9,
            "Oct": 10,
            "Nov": 11,
            "Dec": 12,
        }

        # =========================================
        # CASE 1: MONTHLY FORMAT
        # Example:
        # "Dec 2025"
        # =========================================

        if " " in period and "-" not in period.split()[0]:

            month_str, year_str = period.split()

            month = month_map.get(month_str)

            if month:

                year = int(year_str)

                start_date = datetime.date(
                    year,
                    month,
                    1
                )

                last_day = calendar.monthrange(
                    year,
                    month
                )[1]

                end_date = datetime.date(
                    year,
                    month,
                    last_day
                )

                return start_date, end_date

        # =========================================
        # CASE 2: RANGE FORMAT
        # Example:
        # "Jan-Jun 2025"
        # "Jan–Jun 2025"
        # =========================================

        if " " in period:

            range_part, year_str = period.split(" ", 1)

            if "-" in range_part:

                start_m, end_m = range_part.split("-")

                start_month = month_map.get(start_m.strip())

                end_month = month_map.get(end_m.strip())

                year = int(year_str)

                if start_month and end_month:

                    start_date = datetime.date(
                        year,
                        start_month,
                        1
                    )

                    last_day = calendar.monthrange(
                        year,
                        end_month
                    )[1]

                    end_date = datetime.date(
                        year,
                        end_month,
                        last_day
                    )

                    return start_date, end_date

        return None, None

    except Exception as e:

        print(f"parse_period failed for '{period}': {e}")

        return None, None
# ==========================================================
# 🔥 CREATE MAPPING (PE SIDE)
# ==========================================================
class VendorBranchMappingCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):

        if request.user.role != "PE":
            return Response({"error": "Unauthorized"}, status=403)

        pe = PrincipalEmployer.objects.get(user=request.user)

        data = request.data.copy()
        data["principal_employer"] = pe.id

        # 🔥 FIX RULE/FREQUENCY
        if "rule" in data:
            data["audit_rule"] = data.pop("rule")

        if "frequency" in data:
            data["audit_frequency"] = data.pop("frequency")

        # 🔥 FIX DOCUMENTS
        document_ids = data.pop("document_ids", None)
        print("DOCUMENT IDS:", document_ids)
        documents_input = data.pop("documents", None)
        print("REQUEST DATA:", request.data)

        serializer = VendorBranchMappingSerializer(
            data=data,
            context={"request": request}
        )

        print("REQUEST DATA:", request.data)

        if serializer.is_valid():

            mapping = serializer.save()

            print("MAPPING CREATED:", mapping.id)

            if document_ids:
                mapping.documents.set(document_ids)
            elif documents_input:
                mapping.documents.set(documents_input)

            return Response(
                {"message": "Mapping created"},
                status=201
            )

        print("VALIDATION ERROR:", serializer.errors)

        return Response(
            serializer.errors,
            status=400
        )


# ==========================================================
# 🔥 LIST MAPPINGS (PE SIDE)
# ==========================================================
class VendorBranchMappingListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        if request.user.role != "PE":
            return Response([], status=200)

        try:
            pe = PrincipalEmployer.objects.get(user=request.user)
        except PrincipalEmployer.DoesNotExist:
            return Response([], status=200)

        mappings = VendorBranchMapping.objects.filter(
            principal_employer=pe
        ).select_related(
            "vendor", "branch", "auditor"
        ).prefetch_related("documents")

        for mapping in mappings:
            apply_pending_updates(mapping)

            # 🔥 STATUS FIX
            
            mapping.status = mapping.update_status()

        serializer = VendorBranchMappingSerializer(mappings, many=True)
        return Response(serializer.data)


# ==========================================================
# 🔥 NEW: PE BRANCH DROPDOWN (FOR VENDOR MAPPING SCREEN)
# ==========================================================
class PEBranchDropdownAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        if request.user.role != "PE":
            return Response([], status=200)

        try:
            pe = PrincipalEmployer.objects.get(user=request.user)
        except PrincipalEmployer.DoesNotExist:
            return Response([], status=200)

        branches = PrincipalEmployerBranch.objects.filter(
            principal_employer=pe,
            status="active"
        ).order_by("state")

        data = [
            {
                "id": branch.id,
                "state": branch.state,
                "short_name": branch.short_name,
                "address": branch.address
            }
            for branch in branches
        ]

        return Response(data)


# ==========================================================
# 🔥 VENDOR SIDE DROPDOWN APIs
# ==========================================================

# ===============================
# 1️⃣ MAPPED PE LIST (Vendor Login)
# ===============================
class VendorMappedPEAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        if request.user.role != "VENDOR":
            return Response([])

        vendor = request.user.vendor_profile

        today = now().date()

        valid_pe_ids = set()

        mappings = VendorBranchMapping.objects.filter(
            vendor=vendor
        )

        for mapping in mappings:
            apply_pending_updates(mapping)

            mapping.status = mapping.update_status()

            valid_pe_ids.add(mapping.principal_employer_id)

        pe_ids = list(valid_pe_ids)

        pes = PrincipalEmployer.objects.filter(id__in=pe_ids)

        data = [
            {
                "id": pe.id,
                "short_name": pe.short_name,
                "rules_applicable": pe.rules_applicable
            }
            for pe in pes
        ]

        return Response(data)


# ===============================
# 2️⃣ MAPPED STATES (Vendor Login)
# ===============================
class VendorMappedStatesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        pe_id = request.GET.get("pe_id")

        if request.user.role != "VENDOR" or not pe_id:
            return Response([])

        vendor = request.user.vendor_profile
        today = now().date()

        # ❌ DO NOT FILTER HERE
        mappings = VendorBranchMapping.objects.filter(
            vendor=vendor,
            principal_employer_id=pe_id
        ).select_related("branch")

        states = set()

        for mapping in mappings:
            apply_pending_updates(mapping)

            mapping.status = mapping.update_status()

            if mapping.branch and mapping.branch.state:
                states.add(mapping.branch.state)

        formatted = [
            {
                "id": state,
                "name": state
            }
            for state in states
        ]

        return Response(formatted)


# ===============================
# 3️⃣ MAPPED BRANCHES (Vendor Login)
# ===============================
# master_apps/vendor/mapping_views.py
class VendorMappedBranchesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        pe_id = request.GET.get("pe_id")
        state = request.GET.get("state")

        if request.user.role != "VENDOR" or not pe_id or not state:
            return Response([])

        vendor = getattr(request.user, "vendor_profile", None)
        if not vendor:
            return Response([])

        today = now().date()

        mappings = VendorBranchMapping.objects.filter(
            vendor=vendor,
            principal_employer_id=pe_id,
            branch__state=state
        ).select_related("branch").order_by("branch__short_name")

        branches_dict = {}

        for mapping in mappings:
            apply_pending_updates(mapping)
            mapping.status = mapping.update_status()

            branch = mapping.branch
            if not branch:
                continue

            # ✅ FORCE SHOW ALL BRANCHES (Active + Inactive)
            display_name = f"{branch.short_name} - {branch.address}"
            if getattr(branch, 'status', 'active') != "active":
                display_name += " (Inactive)"

            branches_dict[branch.id] = {
                "id": branch.id,
                "name": display_name,
                "is_inactive": getattr(branch, 'status', 'active') != "active"
            }

        # Debug: Print how many branches are being returned
        print(f"DEBUG: Vendor {vendor.id} - PE {pe_id} - State {state} → {len(branches_dict)} branches returned")

        return Response(list(branches_dict.values()))


# ===============================
# 4️⃣ MAPPED DOCUMENTS (Vendor Login)
# ===============================
# mapping_views.py → VendorMappedDocumentsAPIView.get()

# ===============================
# 4️⃣ MAPPED DOCUMENTS (Vendor Login)  ← REPLACE THIS CLASS
# ===============================
# master_apps/vendor/mapping_views.py
class VendorMappedDocumentsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "VENDOR":
            return Response([])

        vendor = getattr(request.user, "vendor_profile", None)
        if not vendor:
            return Response([])

        pe_id = request.GET.get("pe_id")
        branch_id = request.GET.get("branch_id")
        period = request.GET.get("period")
        # ✅ HIDE FROZEN / CC ISSUED PERIODS
        already_completed = VendorComplianceSubmission.objects.filter(
            vendor=vendor,
            branch_id=branch_id,
            audit_period=period,
            is_cc_issued=True
        ).exists()

        if already_completed:
            return Response([])

        if not pe_id or not branch_id:
            return Response([])

        mappings = VendorBranchMapping.objects.filter(
            vendor=vendor,
            principal_employer_id=pe_id,
            branch_id=branch_id
        ).prefetch_related("documents").order_by("-start_date")

        start_date, end_date = parse_period(period)
        reference_date = end_date or now().date()
        print("\n========================")
        print("PERIOD:", period)
        print("START DATE:", start_date)
        print("END DATE:", end_date)
        print("REFERENCE DATE:", reference_date)
        print("========================\n")

        valid_mappings = []

        # In VendorMappedDocumentsAPIView.get()

        for mapping in mappings:

            # =========================
            # APPLY VIRTUAL HISTORY
            # =========================
            if period and end_date:

                virtual = apply_mapping_for_period(
                    mapping,
                    reference_date
                )

            else:

                apply_pending_updates(mapping)

                virtual = mapping

            # =========================
            # SAFE STATUS UPDATE
            # =========================
            virtual.status = getattr(
                virtual,
                'update_status',
                lambda: "Active"
            )()

            # =========================
            # VALID DATE RANGE CHECK
            # =========================
            if (
                getattr(virtual, 'start_date', None)
                and virtual.start_date <= reference_date
                and (
                    not getattr(virtual, 'end_date', None)
                    or virtual.end_date >= reference_date
                )
            ):
                valid_mappings.append(virtual)

        # =========================
        # NO VALID MAPPING
        # =========================
        if not valid_mappings:
            return Response([])

        # =========================
        # GET LATEST VALID MAPPING
        # =========================
        latest = max(
            valid_mappings,
            key=lambda x: getattr(
                x,
                'start_date',
                date(1900, 1, 1)
            )
        )

        # =========================
        # FIXED: PREFER VIRTUAL DOCS
        # =========================
        doc_ids = (
            getattr(latest, "_virtual_documents", None)
            or getattr(latest, "_documents_cache", None)
        )

        if doc_ids is not None:

            docs = DocumentMaster.objects.filter(
                id__in=doc_ids
            )

        else:

            docs = latest.documents.all()

        data = []

        for doc in docs:

            submission = (
                VendorComplianceSubmission.objects
                .filter(
                    vendor=vendor,
                    branch_id=branch_id,
                    document_id=doc.id,
                    audit_period__iexact=period
                )
                .order_by("-id")
                .first()
            )

            data.append({
                "id": doc.id,
                "name": doc.name,
                "audit_period": period,

                # NEW
                "submission_id": submission.id if submission else None,

                "is_reuploaded":
                    submission.is_reuploaded
                    if submission else False,

                "reupload_remark":
                    submission.reupload_remark
                    if submission else "",

                "workflow_status":
                    submission.workflow_status
                    if submission else "",
            })

        return Response(data)

# ==========================================================
# 🔥 UPDATE MAPPING (EDIT FROM UI)
# ==========================================================
class VendorBranchMappingUpdateAPIView(UpdateAPIView):
    queryset = VendorBranchMapping.objects.all()
    permission_classes = [IsAuthenticated]

    def patch(self, request, *args, **kwargs):
        obj = self.get_object()

        serializer = VendorBranchMappingSerializer(
            obj,
            data=request.data,
            partial=True,
            context={"request": request}
        )

        serializer.is_valid(raise_exception=True)
        mapping = serializer.save()

        return Response({
            "message": "Mapping updated successfully",
            "data": serializer.data
        })

class VendorMappingMetaAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "VENDOR":
            return Response({})

        vendor = getattr(request.user, "vendor_profile", None)
        if not vendor:
            return Response({})

        pe_id = request.GET.get("pe_id")
        branch_id = request.GET.get("branch_id")

        if not pe_id or not branch_id:
            return Response({})

        mapping = VendorBranchMapping.objects.filter(
            vendor=vendor,
            principal_employer_id=pe_id,
            branch_id=branch_id
        ).order_by("-start_date").first()   # Better to order by start_date

        if not mapping:
            return Response({})

        apply_pending_updates(mapping)

        return Response({
            "start_date": mapping.start_date,
            "end_date": mapping.end_date,
            "frequency": mapping.frequency,
            "rule": mapping.rule
        })
# master_apps/auditor/views.py

class AuditorMappingDetailsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        pe_id = request.GET.get("pe_id")
        vendor_id = request.GET.get("vendor_id")
        branch_id = request.GET.get("branch_id")

        if not all([pe_id, vendor_id, branch_id]):
            return Response({"error": "Missing parameters"}, status=400)

        mapping = VendorBranchMapping.objects.filter(
            principal_employer_id=pe_id,
            vendor_id=vendor_id,
            branch_id=branch_id
        ).order_by("-start_date").first()

        if not mapping:
            return Response({})

        apply_pending_updates(mapping)
        virtual = apply_mapping_for_period(mapping)   # Use the fixed function

        return Response({
            "frequency": virtual._virtual_frequency or virtual.frequency,
            "start_date": virtual._virtual_start_date or virtual.start_date,
            "end_date": virtual._virtual_end_date or virtual.end_date,
            "auditor_id": virtual._virtual_auditor_id,
        })