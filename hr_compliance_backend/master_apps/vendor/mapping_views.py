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

from master_apps.principle_employee.models import PrincipalEmployerBranch


# ==========================================================
# 🔥 CREATE MAPPING (PE SIDE)
# ==========================================================
class VendorBranchMappingCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):

        print("Incoming Data:", request.data)

        if request.user.role != "PE":
            return Response({"error": "Unauthorized"}, status=403)

        try:
            pe = PrincipalEmployer.objects.get(user=request.user)
        except PrincipalEmployer.DoesNotExist:
            return Response({"error": "PE profile not found"}, status=400)

        data = request.data.copy()
        data["principal_employer"] = pe.id

        documents = data.pop("documents", [])

        serializer = VendorBranchMappingSerializer(data=data)

        if serializer.is_valid():

            mapping = serializer.save()

            # save multiple documents
            mapping.documents.set(documents)

            return Response({"message": "Mapping created"}, status=201)

        print("Serializer Errors:", serializer.errors)
        return Response(serializer.errors, status=400)


# ==========================================================
# 🔥 LIST MAPPINGS (PE SIDE)
# ==========================================================
class VendorBranchMappingListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        if request.user.role != "PE":
            return Response([], status=200)

        vendor_id = request.GET.get("vendor")

        if not vendor_id:
            return Response([], status=200)

        try:
            pe = PrincipalEmployer.objects.get(user=request.user)
        except PrincipalEmployer.DoesNotExist:
            return Response([], status=200)

        mappings = VendorBranchMapping.objects.filter(
            vendor_id=vendor_id,
            principal_employer=pe
        ).select_related("vendor", "branch", "auditor", "document")

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
# 🔥 VENDOR SIDE DROPDOWN APIs (UNCHANGED LOGIC)
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

        pe_ids = VendorBranchMapping.objects.filter(
            vendor=vendor
        ).values_list("principal_employer_id", flat=True).distinct()

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

        mappings = VendorBranchMapping.objects.filter(
            vendor=vendor,
            principal_employer_id=pe_id
        ).select_related("branch")

        states = set()

        for mapping in mappings:
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

        mappings = VendorBranchMapping.objects.filter(
            vendor=vendor,
            principal_employer_id=pe_id,
            branch__state=state
        ).select_related("branch")

        branches_dict = {}

        for mapping in mappings:
            branch = mapping.branch
            branches_dict[branch.id] = {
                "id": branch.id,
                "name": f"{branch.short_name} - {branch.address}"
            }

        return Response(list(branches_dict.values()))


# ===============================
# 4️⃣ MAPPED DOCUMENTS (Vendor Login)
# ===============================
class VendorMappedDocumentsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        pe_id = request.GET.get("pe_id")
        branch_id = request.GET.get("branch_id")

        if request.user.role != "VENDOR" or not pe_id or not branch_id:
            return Response([])

        vendor = request.user.vendor_profile

        mappings = VendorBranchMapping.objects.filter(
            vendor=vendor,
            principal_employer_id=pe_id,
            branch_id=branch_id
        ).prefetch_related("documents")

        documents = []

        for mapping in mappings:
            for doc in mapping.documents.all():
                    documents.append({
                        "id": doc.id,
                        "name": doc.name,
                        "frequency": mapping.frequency
                    })

        return Response(documents)