from django.db.models import Count
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from master_apps.principle_employee.models import PrincipalEmployer
from master_apps.vendor.mapping_models import VendorBranchMapping
from django.utils import timezone
from datetime import datetime
from django.db.models import Count, Q
from master_apps.vendor.compliance_models import VendorComplianceSubmission
from master_apps.vendor.constants import WorkflowStatus
from master_apps.principle_employee.models import PrincipalEmployerBranch


# =========================
# KPI
# =========================
class BranchDashboardKPIAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "PE":
            return Response({"error": "Unauthorized"}, status=403)

        try:
            pe = PrincipalEmployer.objects.get(user=request.user)
        except PrincipalEmployer.DoesNotExist:
            return Response({"error": "Principal Employer not found"}, status=404)

        queryset = VendorBranchMapping.objects.filter(principal_employer=pe)

        # Filters
        states = request.GET.getlist("states") or request.GET.getlist("states[]")
        branches = request.GET.getlist("branches") or request.GET.getlist("branches[]")
        vendors = request.GET.getlist("vendors") or request.GET.getlist("vendors[]")
        services = request.GET.getlist("services") or request.GET.getlist("services[]")

        if states:
            queryset = queryset.filter(branch__state__in=states)
        if branches:
            queryset = queryset.filter(branch_id__in=branches)
        if vendors:
            queryset = queryset.filter(vendor_id__in=vendors)
        if services:
            queryset = queryset.filter(vendor__nature_of_services__in=services)

        data = {
            "total_states": queryset.values("branch__state").distinct().count(),
            "total_branches": queryset.values("branch").distinct().count(),
            "total_vendor_mappings": queryset.count(),
            "unique_vendors": queryset.values("vendor").distinct().count(),
        }

        return Response(data)

from django.db.models import Count, Q

from django.db.models import Count
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from master_apps.principle_employee.models import (
    PrincipalEmployer,
    PrincipalEmployerBranch,
)
from .mapping_models import VendorBranchMapping


class BranchDashboardStateSummaryAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "PE":
            return Response({"error": "Unauthorized"}, status=403)

        try:
            pe = PrincipalEmployer.objects.get(user=request.user)
        except PrincipalEmployer.DoesNotExist:
            return Response(
                {"error": "Principal Employer not found"},
                status=404,
            )

        queryset = VendorBranchMapping.objects.filter(
            principal_employer=pe
        )

        # -------------------------------
        # Filters
        # -------------------------------
        states = request.GET.getlist("states") or request.GET.getlist("states[]")
        branches = request.GET.getlist("branches") or request.GET.getlist("branches[]")
        vendors = request.GET.getlist("vendors") or request.GET.getlist("vendors[]")
        services = request.GET.getlist("services") or request.GET.getlist("services[]")

        if states:
            queryset = queryset.filter(branch__state__in=states)

        if branches:
            queryset = queryset.filter(branch_id__in=branches)

        if vendors:
            queryset = queryset.filter(vendor_id__in=vendors)

        if services:
            queryset = queryset.filter(
                vendor__nature_of_services__in=services
            )

        # ----------------------------------------------------
        # REAL BRANCH COUNT
        # (Exclude auto-created "All Branches")
        # ----------------------------------------------------
        branch_queryset = PrincipalEmployerBranch.objects.filter(
            principal_employer=pe
        ).exclude(
            short_name__iexact="All Branches"
        )

        if states:
            branch_queryset = branch_queryset.filter(
                state__in=states
            )

        if branches:
            branch_queryset = branch_queryset.filter(
                id__in=branches
            )

        branch_counts = (
            branch_queryset
            .values("state")
            .annotate(
                branch_count=Count("id")
            )
        )

        branch_count_map = {
            row["state"]: row["branch_count"]
            for row in branch_counts
        }

        # ----------------------------------------------------
        # Vendor Mapping Summary
        # (Includes "All Branches" mappings)
        # ----------------------------------------------------
        mapping_summary = (
            queryset
            .values("branch__state")
            .annotate(
                total_vendor_mappings=Count("id"),
                unique_vendors=Count("vendor", distinct=True),
            )
        )

        mapping_map = {
            row["branch__state"]: row
            for row in mapping_summary
        }

        all_states = sorted(
            set(branch_count_map.keys()) |
            set(mapping_map.keys())
        )

        response = []

        for state in all_states:
            mapping = mapping_map.get(state)

            response.append({
                "branch__state": state,
                "branch_count": branch_count_map.get(state, 0),
                "total_vendor_mappings": (
                    mapping["total_vendor_mappings"]
                    if mapping else 0
                ),
                "unique_vendors": (
                    mapping["unique_vendors"]
                    if mapping else 0
                ),
            })

        return Response(response)

# =========================
# MONTHLY TREND
# =========================
class BranchDashboardMonthlyTrendAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "PE":
            return Response({"error": "Unauthorized"}, status=403)

        try:
            pe = PrincipalEmployer.objects.get(user=request.user)
        except PrincipalEmployer.DoesNotExist:
            return Response({"error": "Principal Employer not found"}, status=404)

        queryset = VendorBranchMapping.objects.filter(principal_employer=pe)

        # Filters
        states = request.GET.getlist("states") or request.GET.getlist("states[]")
        branches = request.GET.getlist("branches") or request.GET.getlist("branches[]")
        vendors = request.GET.getlist("vendors") or request.GET.getlist("vendors[]")
        services = request.GET.getlist("services") or request.GET.getlist("services[]")

        if states:
            queryset = queryset.filter(branch__state__in=states)
        if branches:
            queryset = queryset.filter(branch_id__in=branches)
        if vendors:
            queryset = queryset.filter(vendor_id__in=vendors)
        if services:
            queryset = queryset.filter(vendor__nature_of_services__in=services)

        today = timezone.now().date()
        response = []

        for i in range(5, -1, -1):
            month = today.month - i
            year = today.year
            while month <= 0:
                month += 12
                year -= 1

            month_start = datetime(year, month, 1).date()
            if month == 12:
                month_end = datetime(year + 1, 1, 1).date()
            else:
                month_end = datetime(year, month + 1, 1).date()

            vendor_count = (
                queryset.filter(
                    start_date__lt=month_end,
                    end_date__gte=month_start,
                )
                .values("vendor")
                .distinct()
                .count()
            )

            response.append({
                "month": month_start.strftime("%b"),
                "unique_vendors": vendor_count,
            })

        return Response(response)


# =========================
# TOP BRANCHES - FIXED
# =========================
class BranchDashboardTopBranchesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "PE":
            return Response({"error": "Unauthorized"}, status=403)

        try:
            pe = PrincipalEmployer.objects.get(user=request.user)
        except PrincipalEmployer.DoesNotExist:
            return Response({"error": "Principal Employer not found"}, status=404)

        queryset = VendorBranchMapping.objects.filter(principal_employer=pe)

        # Filters
        states = request.GET.getlist("states") or request.GET.getlist("states[]")
        branches = request.GET.getlist("branches") or request.GET.getlist("branches[]")
        vendors = request.GET.getlist("vendors") or request.GET.getlist("vendors[]")
        services = request.GET.getlist("services") or request.GET.getlist("services[]")

        if states:
            queryset = queryset.filter(branch__state__in=states)
        if branches:
            queryset = queryset.filter(branch_id__in=branches)
        if vendors:
            queryset = queryset.filter(vendor_id__in=vendors)
        if services:
            queryset = queryset.filter(vendor__nature_of_services__in=services)

        try:
            data = (
                queryset.values(
                    "branch__short_name",   # ← FIXED: short_name, not branch_name
                    "branch__state",
                )
                .annotate(unique_vendors=Count("vendor", distinct=True))
                .order_by("-unique_vendors")[:10]
            )

            result = [
                {
                    "branch_name": item["branch__short_name"],   # Frontend-friendly name
                    "state": item["branch__state"],
                    "unique_vendors": item["unique_vendors"],
                }
                for item in data
            ]

            return Response(result)

        except Exception as e:
            print(f"TopBranchesAPIView Error: {e}")
            return Response({"error": "Failed to fetch top branches", "detail": str(e)}, status=500)


# =========================
# SERVICE DISTRIBUTION
# =========================
class BranchDashboardServiceDistributionAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "PE":
            return Response({"error": "Unauthorized"}, status=403)

        try:
            pe = PrincipalEmployer.objects.get(user=request.user)
        except PrincipalEmployer.DoesNotExist:
            return Response({"error": "Principal Employer not found"}, status=404)

        queryset = VendorBranchMapping.objects.filter(principal_employer=pe)

        # Filters
        states = request.GET.getlist("states") or request.GET.getlist("states[]")
        branches = request.GET.getlist("branches") or request.GET.getlist("branches[]")
        vendors = request.GET.getlist("vendors") or request.GET.getlist("vendors[]")
        services = request.GET.getlist("services") or request.GET.getlist("services[]")

        if states:
            queryset = queryset.filter(branch__state__in=states)
        if branches:
            queryset = queryset.filter(branch_id__in=branches)
        if vendors:
            queryset = queryset.filter(vendor_id__in=vendors)
        if services:
            queryset = queryset.filter(vendor__nature_of_services__in=services)

        try:
            data = (
                queryset.values("vendor__nature_of_services")
                .annotate(vendors=Count("vendor", distinct=True))
                .order_by("-vendors")
            )

            response = [
                {
                    "service": item["vendor__nature_of_services"],
                    "vendors": item["vendors"],
                }
                for item in data
            ]

            return Response(response)

        except Exception as e:
            print(f"ServiceDistributionAPIView Error: {e}")
            return Response({"error": "Failed to fetch service distribution", "detail": str(e)}, status=500)


class ComplianceDashboardSummaryAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        if request.user.role != "PE":
            return Response({"error": "Unauthorized"}, status=403)

        try:
            pe = PrincipalEmployer.objects.get(user=request.user)
        except PrincipalEmployer.DoesNotExist:
            return Response({"error": "Principal Employer not found"}, status=404)

        queryset = VendorComplianceSubmission.objects.filter(
            principal_employer=pe
        )

        # ---------------- Filters ----------------

        states = request.GET.getlist("states")
        branches = request.GET.getlist("branches")
        vendors = request.GET.getlist("vendors")
        audit_months = request.GET.getlist("audit_months")

        if states:
            queryset = queryset.filter(state__in=states)

        if branches:
            queryset = queryset.filter(branch_id__in=branches)

        if vendors:
            queryset = queryset.filter(vendor_id__in=vendors)

        if audit_months:
            queryset = queryset.filter(audit_period__in=audit_months)

        data = {

            "ccIssued":
                queryset.filter(
                    is_cc_issued=True
                ).count(),

            "underReview":
                queryset.filter(
                    workflow_status=WorkflowStatus.UNDER_REVIEW
                ).count(),

            "reupload":
                queryset.filter(
                    workflow_status=WorkflowStatus.REUPLOAD_REQUESTED
                ).count(),

            "exceptional":
                queryset.filter(
                    workflow_status=WorkflowStatus.EXCEPTIONAL_APPROVAL
                ).count(),

            "complied":
                queryset.filter(
                    workflow_status=WorkflowStatus.COMPLIED
                ).count(),

            "nonComplied":
                queryset.filter(
                    workflow_status=WorkflowStatus.NON_COMPLIED
                ).count(),
        }

        return Response(data)


from collections import defaultdict
from datetime import datetime

class ComplianceDashboardMonthlyTrendAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        if request.user.role != "PE":
            return Response({"error": "Unauthorized"}, status=403)

        try:
            pe = PrincipalEmployer.objects.get(user=request.user)
        except PrincipalEmployer.DoesNotExist:
            return Response({"error": "Principal Employer not found"}, status=404)

        queryset = VendorComplianceSubmission.objects.filter(
            principal_employer=pe
        )

        monthly = defaultdict(lambda: {
            "ccIssued": 0,
            "complied": 0,
            "nonComplied": 0,
        })

        for row in queryset:

            month = row.audit_period or "Unknown"

            if row.is_cc_issued:
                monthly[month]["ccIssued"] += 1

            if row.workflow_status == WorkflowStatus.COMPLIED:
                monthly[month]["complied"] += 1

            if row.workflow_status == WorkflowStatus.NON_COMPLIED:
                monthly[month]["nonComplied"] += 1

        response = []

        for month, values in monthly.items():
            response.append({
                "month": month,
                **values,
            })

        return Response(sorted(response, key=lambda x: x["month"]))



from django.db.models import Count, Q
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from collections import defaultdict

from master_apps.vendor.compliance_models import VendorComplianceSubmission
from master_apps.principle_employee.models import PrincipalEmployer
from master_apps.vendor.constants import WorkflowStatus


class VendorWiseComplianceAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "PE":
            return Response({"error": "Unauthorized"}, status=403)

        try:
            pe = PrincipalEmployer.objects.get(user=request.user)
        except PrincipalEmployer.DoesNotExist:
            return Response({"error": "PE not found"}, status=404)

        queryset = VendorComplianceSubmission.objects.filter(principal_employer=pe)

        # Filters
        states = request.GET.getlist("states")
        branches = request.GET.getlist("branches")
        vendors = request.GET.getlist("vendors")
        audit_months = request.GET.getlist("audit_months")

        if states:
            queryset = queryset.filter(state__in=states)
        if branches:
            queryset = queryset.filter(branch_id__in=branches)
        if vendors:
            queryset = queryset.filter(vendor_id__in=vendors)
        if audit_months:
            queryset = queryset.filter(audit_period__in=audit_months)

        data = (
            queryset.values("vendor__name", "vendor__short_name")
            .annotate(
                total=Count("id"),
                cc_issued=Count("id", filter=Q(is_cc_issued=True)),
                complied=Count("id", filter=Q(workflow_status=WorkflowStatus.COMPLIED)),
                non_complied=Count("id", filter=Q(workflow_status=WorkflowStatus.NON_COMPLIED)),
                exceptional=Count("id", filter=Q(workflow_status=WorkflowStatus.EXCEPTIONAL_APPROVAL)),
                under_review=Count("id", filter=Q(workflow_status=WorkflowStatus.UNDER_REVIEW)),
            )
            .order_by("-total")
        )

        return Response(list(data))


class ComplianceStatusDistributionAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "PE":
            return Response({"error": "Unauthorized"}, status=403)

        try:
            pe = PrincipalEmployer.objects.get(user=request.user)
        except PrincipalEmployer.DoesNotExist:
            return Response({"error": "PE not found"}, status=404)

        queryset = VendorComplianceSubmission.objects.filter(principal_employer=pe)

        # Same filters as above...
        states = request.GET.getlist("states")
        branches = request.GET.getlist("branches")
        vendors = request.GET.getlist("vendors")
        audit_months = request.GET.getlist("audit_months")

        if states: queryset = queryset.filter(state__in=states)
        if branches: queryset = queryset.filter(branch_id__in=branches)
        if vendors: queryset = queryset.filter(vendor_id__in=vendors)
        if audit_months: queryset = queryset.filter(audit_period__in=audit_months)

        total = queryset.count()

        distribution = {
            "Complied": queryset.filter(workflow_status=WorkflowStatus.COMPLIED).count(),
            "Non Complied": queryset.filter(workflow_status=WorkflowStatus.NON_COMPLIED).count(),
            "Exceptional Approval": queryset.filter(workflow_status=WorkflowStatus.EXCEPTIONAL_APPROVAL).count(),
            "Under Review": queryset.filter(workflow_status=WorkflowStatus.UNDER_REVIEW).count(),
            "Reupload Requested": queryset.filter(workflow_status=WorkflowStatus.REUPLOAD_REQUESTED).count(),
            "CC Issued": queryset.filter(is_cc_issued=True).count(),
        }

        return Response({
            "total": total,
            "distribution": distribution
        })


class AllBranchesVendorAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        if request.user.role != "PE":
            return Response({"error": "Unauthorized"}, status=403)

        try:
            pe = PrincipalEmployer.objects.get(user=request.user)
        except PrincipalEmployer.DoesNotExist:
            return Response({"error": "PE not found"}, status=404)

        mappings = (
            VendorBranchMapping.objects
            .filter(
                principal_employer=pe,
                branch__short_name__iexact="All Branches"
            )
            .select_related("vendor", "branch")
        )

        response = []

        for mapping in mappings:

            print("STATE:", mapping.branch.state)

            branches = (
                PrincipalEmployerBranch.objects
                .filter(
                    principal_employer=pe,
                    state=mapping.branch.state
                )
                .exclude(
                    short_name__iexact="All Branches"
                )
            )

            print(
                "BRANCHES:",
                list(branches.values_list("short_name", flat=True))
            )

            total_branches = branches.count()

            response.append({
                "state": mapping.branch.state,
                "total_branches": total_branches,
                "vendor_name": mapping.vendor.name,
                "nature_of_services": mapping.vendor.nature_of_services,
            })

        return Response(response)