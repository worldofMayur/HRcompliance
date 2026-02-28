from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from .mapping_models import VendorBranchMapping
from .mapping_serializers import VendorBranchMappingSerializer

from master_apps.principle_employee.models import PrincipalEmployer


# ==========================================================
# EXISTING CREATE VIEW (UNCHANGED)
# ==========================================================
class VendorBranchMappingCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):

        if request.user.role != "PE":
            return Response({"error": "Unauthorized"}, status=403)

        try:
            pe = PrincipalEmployer.objects.get(
                email=request.user.email
            )
        except PrincipalEmployer.DoesNotExist:
            return Response({"error": "PE profile not found"}, status=400)

        data = request.data.copy()
        data["principal_employer"] = pe.id

        serializer = VendorBranchMappingSerializer(data=data)

        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Mapping created"}, status=201)

        return Response(serializer.errors, status=400)


# ==========================================================
# EXISTING LIST VIEW (UNCHANGED)
# ==========================================================
class VendorBranchMappingListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        vendor_id = request.GET.get("vendor")

        if not vendor_id:
            return Response([], status=200)

        mappings = VendorBranchMapping.objects.filter(
            vendor_id=vendor_id
        ).select_related("vendor", "branch", "auditor", "document")

        serializer = VendorBranchMappingSerializer(mappings, many=True)
        return Response(serializer.data)


# ==========================================================
# 🔥 VENDOR DROPDOWN APIs (CLEAN VERSION)
# ==========================================================


# ===============================
# 1️⃣ MAPPED PE LIST
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

        pes = PrincipalEmployer.objects.filter(
            id__in=pe_ids
        )

        data = [
            {
                "id": pe.id,
                "short_name": pe.short_name
            }
            for pe in pes
        ]

        return Response(data)


# ===============================
# 2️⃣ MAPPED STATES
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
        ).select_related("branch__state")

        states_dict = {}

        for mapping in mappings:
            state = mapping.branch.state
            states_dict[state.id] = {
                "id": state.id,
                "name": state.name
            }

        return Response(list(states_dict.values()))


# ===============================
# 3️⃣ MAPPED BRANCHES
# ===============================
class VendorMappedBranchesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        pe_id = request.GET.get("pe_id")
        state_id = request.GET.get("state_id")

        if request.user.role != "VENDOR" or not pe_id or not state_id:
            return Response([])

        vendor = request.user.vendor_profile

        mappings = VendorBranchMapping.objects.filter(
            vendor=vendor,
            principal_employer_id=pe_id,
            branch__state_id=state_id
        ).select_related("branch__city")

        branches_dict = {}

        for mapping in mappings:
            branch = mapping.branch
            branches_dict[branch.id] = {
                "id": branch.id,
                "name": f"{branch.city.name} - {branch.address}"
            }

        return Response(list(branches_dict.values()))


# ===============================
# 4️⃣ MAPPED DOCUMENTS
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
            branch_id=branch_id,
            document__is_active=True
        ).select_related("document")

        docs_dict = {}

        for mapping in mappings:
            doc = mapping.document
            if doc:
                docs_dict[doc.id] = {
                    "id": doc.id,
                    "name": doc.name
                }

        return Response(list(docs_dict.values()))