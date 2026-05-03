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


import datetime

def parse_period(period):
    if not period:
        return None, None

    try:
        period = period.replace("–", "-").strip()

        # Case 1: Monthly format like "Jun 2028"
        if " " in period and "-" not in period.split()[0]:
            month_str, year_str = period.split()
            month_map = {
                "Jan": 1, "Feb": 2, "Mar": 3, "Apr": 4, "May": 5, "Jun": 6,
                "Jul": 7, "Aug": 8, "Sep": 9, "Oct": 10, "Nov": 11, "Dec": 12,
            }
            month = month_map.get(month_str)
            if month:
                start_date = datetime.date(int(year_str), month, 1)
                end_date = datetime.date(int(year_str), month + 1, 1) - datetime.timedelta(days=1)
                return start_date, end_date

        # Case 2: Range format like "Jan–Jun 2025" or "Jan-Feb 2025"
        if " " in period:
            range_part, year_str = period.split(" ", 1)
            if "-" in range_part or "–" in range_part:
                start_m, end_m = range_part.replace("–", "-").split("-")
                month_map = {
                    "Jan": 1, "Feb": 2, "Mar": 3, "Apr": 4, "May": 5, "Jun": 6,
                    "Jul": 7, "Aug": 8, "Sep": 9, "Oct": 10, "Nov": 11, "Dec": 12,
                }
                start_date = datetime.date(int(year_str), month_map[start_m.strip()], 1)
                end_date = datetime.date(int(year_str), month_map[end_m.strip()] + 1, 1) - datetime.timedelta(days=1)
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
        documents_input = data.pop("documents", None)

        serializer = VendorBranchMappingSerializer(
            data=data,
            context={"request": request}
        )

        if serializer.is_valid():
            mapping = serializer.save()

            # 🔥 SAVE DOCUMENTS CORRECTLY
            if document_ids:
                mapping.documents.set(document_ids)
            elif documents_input:
                mapping.documents.set(documents_input)

            return Response({"message": "Mapping created"}, status=201)

        return Response(serializer.errors, status=400)


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

            # ✅ EFFECTIVE DATE CHECK
            if mapping.effective_date and mapping.effective_date > today:
                continue

            # ✅ ACTIVE STATUS ONLY
            if mapping.status != "Active":
                continue

            # ✅ CONTRACT NOT EXPIRED
            if mapping.end_date and mapping.end_date < today:
                continue

            valid_pe_ids.add(mapping.principal_employer_id)

        pe_ids = list(valid_pe_ids)

        pes = PrincipalEmployer.objects.filter(id__in=pe_ids)

        data = [
            {
                "id": pe.id,
                "short_name": pe.short_name
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

            # ✅ EFFECTIVE DATE FILTER
            if mapping.effective_date and mapping.effective_date > today:
                continue

            # ✅ FILTER AFTER UPDATE
            if mapping.status != "Active":
                continue

            if mapping.end_date and mapping.end_date < today:
                continue

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
class VendorMappedBranchesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        pe_id = request.GET.get("pe_id")
        state = request.GET.get("state")

        if request.user.role != "VENDOR" or not pe_id or not state:
            return Response([])

        vendor = request.user.vendor_profile
        today = now().date()

        # ❌ DO NOT FILTER HERE
        mappings = VendorBranchMapping.objects.filter(
            vendor=vendor,
            principal_employer_id=pe_id,
            branch__state=state
        ).select_related("branch")

        branches_dict = {}

        for mapping in mappings:
            apply_pending_updates(mapping)

            mapping.status = mapping.update_status()

            # ✅ EFFECTIVE DATE FILTER
            if mapping.effective_date and mapping.effective_date > today:
                continue

            # ✅ FILTER AFTER UPDATE
            if mapping.status != "Active":
                continue

            if mapping.end_date and mapping.end_date < today:
                continue

            branch = mapping.branch

            # ✅ FILTER INACTIVE BRANCH
            if branch.status != "active":
                continue

            branches_dict[branch.id] = {
                "id": branch.id,
                "name": f"{branch.short_name} - {branch.address}"
            }

        return Response(list(branches_dict.values()))


# ===============================
# 4️⃣ MAPPED DOCUMENTS (Vendor Login)
# ===============================
# mapping_views.py → VendorMappedDocumentsAPIView.get()

# ===============================
# 4️⃣ MAPPED DOCUMENTS (Vendor Login)  ← REPLACE THIS CLASS
# ===============================
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

        if not pe_id or not branch_id:
            return Response([])

        mappings = VendorBranchMapping.objects.filter(
            vendor=vendor,
            principal_employer_id=pe_id,
            branch_id=branch_id
        ).prefetch_related("documents").order_by("-start_date")

        start_date, end_date = parse_period(period)
        reference_date = end_date or now().date()

        print(f"DEBUG: Period='{period}', Parsed end_date={end_date}, reference_date={reference_date}")

        valid_mappings = []

        for mapping in mappings:
            # ALWAYS apply history when period is provided
            if period and end_date:
                virtual_mapping = apply_mapping_for_period(mapping, end_date)
                print(f"DEBUG: Applied history for mapping {mapping.id}, target={end_date}")
            else:
                apply_pending_updates(mapping)
                virtual_mapping = mapping

            virtual_mapping.status = virtual_mapping.update_status()

            if (
                virtual_mapping.start_date and virtual_mapping.start_date <= reference_date and
                (not virtual_mapping.end_date or virtual_mapping.end_date >= reference_date)
            ):
                valid_mappings.append(virtual_mapping)

        if not valid_mappings:
            return Response([])

        latest_mapping = max(valid_mappings, key=lambda x: x.start_date or date(1900, 1, 1))

        doc_ids = getattr(latest_mapping, "_documents_cache", None)

        if doc_ids is not None:
            docs = DocumentMaster.objects.filter(id__in=doc_ids)
            print(f"DEBUG: Using history cache: {doc_ids}")
        else:
            docs = latest_mapping.documents.all()
            print(f"DEBUG: Using live documents")

        data = [
            {
                "id": doc.id,
                "name": doc.name,
                "frequency": latest_mapping.frequency,
                "start_date": latest_mapping.start_date,
                "end_date": latest_mapping.end_date,
            }
            for doc in docs
        ]

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
            "frequency": mapping.frequency
        })