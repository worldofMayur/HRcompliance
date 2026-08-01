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
import re
from master_apps.principle_employee.models import PrincipalEmployerBranch
from django.db.models import Avg, Count, Q
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from master_apps.principle_employee.models import PrincipalEmployer
from master_apps.vendor.compliance_models import VendorComplianceSubmission
from calendar import month_abbr
from collections import defaultdict
from django.db.models.functions import ExtractYear
from django.db.models import Q
from django.db.models import F
from django.db.models import Sum

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


from collections import defaultdict
from django.db.models import Count
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from master_apps.principle_employee.models import (
    PrincipalEmployer,
    PrincipalEmployerBranch,
)

from master_apps.vendor.mapping_models import VendorBranchMapping

import re
from django.db.models import Count
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from master_apps.principle_employee.models import (
    PrincipalEmployer,
    PrincipalEmployerBranch,
)

from master_apps.vendor.mapping_models import VendorBranchMapping
from master_apps.vendor.compliance_models import VendorComplianceSubmission


class ExceptionalDashboardAPIView(APIView):
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

        print("\n==============================")
        print("PE:", pe.short_name)
        print("==============================")

        # ------------------------------------
        # Branch Count
        # ------------------------------------

        branch_summary = (
            PrincipalEmployerBranch.objects
            .filter(principal_employer=pe)
            .exclude(short_name__iexact="All Branches")
            .values("state")
            .annotate(branch_count=Count("id"))
        )

        branch_map = {
            row["state"]: row["branch_count"]
            for row in branch_summary
        }

        # ------------------------------------
        # Vendor Count
        # ------------------------------------

        vendor_summary = (
            VendorBranchMapping.objects
            .filter(principal_employer=pe)
            .values("branch__state")
            .annotate(
                vendor_count=Count(
                    "vendor",
                    distinct=True
                )
            )
        )

        vendor_map = {
            row["branch__state"]: row["vendor_count"]
            for row in vendor_summary
        }

        states = sorted(
            set(branch_map.keys()) |
            set(vendor_map.keys())
        )

        response = {}

        for state in states:

            response[state] = {

                "state": state,

                "branch_count": branch_map.get(state, 0),

                "vendor_count": vendor_map.get(state, 0),

                "jan": 0,
                "feb": 0,
                "mar": 0,
                "apr": 0,
                "may": 0,
                "jun": 0,
                "jul": 0,
                "aug": 0,
                "sep": 0,
                "oct": 0,
                "nov": 0,
                "dec": 0,
            }

        print("\n========== COUNTS ==========")

        print(
            "TOTAL:",
            VendorComplianceSubmission.objects.filter(
                principal_employer=pe
            ).count()
        )

        print(
            "EXCEPTIONAL:",
            VendorComplianceSubmission.objects.filter(
                principal_employer=pe,
                has_exceptional_approval=True
            ).count()
        )

        print(
            "CC ISSUED:",
            VendorComplianceSubmission.objects.filter(
                principal_employer=pe,
                is_cc_issued=True
            ).count()
        )

        print(
            "FROZEN:",
            VendorComplianceSubmission.objects.filter(
                principal_employer=pe,
                workflow_status="FROZEN"
            ).count()
        )

        print(
            "EXCEPTIONAL + CC:",
            VendorComplianceSubmission.objects.filter(
                principal_employer=pe,
                has_exceptional_approval=True,
                is_cc_issued=True,
            ).count()
        )

        print("============================\n")

        print("========== ALL SUBMISSIONS ==========")

        all_rows = VendorComplianceSubmission.objects.filter(
            principal_employer=pe
        ).select_related(
            "vendor",
            "document",
            "branch",
        )

        for row in all_rows:

            print(
                {
                    "id": row.id,
                    "vendor": row.vendor.short_name,
                    "document": row.document.name,
                    "branch": row.branch.short_name,
                    "audit_period": row.audit_period,
                    "workflow": row.workflow_status,
                    "exceptional": row.has_exceptional_approval,
                    "cc": row.is_cc_issued,
                    "frozen": row.is_frozen,
                }
            )

        print("=====================================\n")

        submissions = (
            VendorComplianceSubmission.objects.filter(
                principal_employer=pe,
                has_exceptional_approval=True,
                is_cc_issued=True,
            )
            .select_related(
                "vendor",
                "branch",
            )
            .order_by(
                "vendor_id",
                "branch_id",
                "audit_period",
            )
        )

        print(
            "SUBMISSIONS USED BY DASHBOARD:",
            submissions.count()
        )

        month_keys = [
            "jan",
            "feb",
            "mar",
            "apr",
            "may",
            "jun",
            "jul",
            "aug",
            "sep",
            "oct",
            "nov",
            "dec",
        ]

        processed_audits = set()

        for submission in submissions:

            audit_key = (
                submission.vendor_id,
                submission.branch_id,
                submission.audit_period,
            )

            if audit_key in processed_audits:
                continue

            processed_audits.add(audit_key)

            print("\n==============================")

            print("Submission ID:", submission.id)
            print("Vendor:", submission.vendor.short_name)
            print("State:", submission.state)
            print("Audit Period:", submission.audit_period)
            print("Workflow:", submission.workflow_status)
            print("Exceptional:", submission.has_exceptional_approval)
            print("CC Issued:", submission.is_cc_issued)

            state = submission.state

            if state not in response:

                print("State Missing:", state)

                continue

            mapping = VendorBranchMapping.objects.filter(
                principal_employer=pe,
                vendor=submission.vendor,
                branch=submission.branch,
            ).first()

            print("Mapping:", mapping)

            if not mapping:

                print("Mapping Not Found")

                continue

            frequency = str(mapping.frequency).strip().upper()

            print("Frequency:", frequency)

            period = str(
                submission.audit_period
            ).lower()

            base_month = None

            for index, month in enumerate(month_keys, start=1):

                if month in period:

                    base_month = index

                    break

            if base_month is None:

                match = re.search(
                    r"(\\d{4})[-/](\\d{1,2})",
                    period
                )

                if match:

                    base_month = int(match.group(2))

            print("Base Month:", base_month)

            if base_month is None:

                print("Unable to determine month")

                continue

            if frequency == "MONTHLY":

                months = [base_month]

            elif frequency == "QUARTERLY":

                start = ((base_month - 1) // 3) * 3 + 1

                months = [
                    start,
                    start + 1,
                    start + 2,
                ]

            elif frequency == "HALF_YEARLY":

                start = 1 if base_month <= 6 else 7

                months = list(
                    range(start, start + 6)
                )

            elif frequency == "ANNUALLY":

                months = list(
                    range(1, 13)
                )

            else:

                months = [base_month]

            print("Months:", months)

            for month in months:

                response[state][month_keys[month - 1]] += 1

                print(
                    "Incremented:",
                    month_keys[month - 1]
                )

        print("\n========== FINAL RESPONSE ==========")

        print(response)

        return Response(list(response.values()))


from collections import defaultdict
from datetime import timedelta
from django.utils import timezone


class TopExceptionalVendorsAPIView(APIView):
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

        submissions = (
            VendorComplianceSubmission.objects.filter(
                principal_employer=pe,
                has_exceptional_approval=True,
                is_cc_issued=True,
            )
            .select_related(
                "vendor",
                "branch",
            )
            .order_by(
                "vendor_id",
                "branch_id",
                "audit_period",
            )
        )

        vendor_counts = defaultdict(int)
        processed = set()

        for submission in submissions:

            key = (
                submission.vendor_id,
                submission.branch_id,
                submission.audit_period,
            )

            if key in processed:
                continue

            processed.add(key)

            vendor_name = (
                submission.vendor.short_name
                or submission.vendor.name
            )

            vendor_counts[vendor_name] += 1

        response = [
            {
                "vendor": vendor,
                "count": count,
            }
            for vendor, count in vendor_counts.items()
        ]

        response.sort(
            key=lambda x: x["count"],
            reverse=True,
        )

        return Response(response[:10])


from django.db.models import Count
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from master_apps.auditor.models import AuditEntry


from django.db.models import Count
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from master_apps.principle_employee.models import PrincipalEmployer
from master_apps.vendor.compliance_models import VendorComplianceSubmission


class DocumentReferencePieAPIView(APIView):
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

        queryset = VendorComplianceSubmission.objects.filter(
            principal_employer=pe,
            has_exceptional_approval=True,
            is_cc_issued=True,
        )

        # Optional Filters
        vendor_id = request.GET.get("vendor_id")
        branch_id = request.GET.get("branch_id")
        audit_period = request.GET.get("audit_period")

        if vendor_id:
            queryset = queryset.filter(vendor_id=vendor_id)

        if branch_id:
            queryset = queryset.filter(branch_id=branch_id)

        if audit_period:
            queryset = queryset.filter(audit_period=audit_period)

        data = (
            queryset.values(
                "document_id",
                "document__name",
            )
            .annotate(count=Count("id"))
            .order_by("-count")
        )

        response = [
            {
                "document_id": row["document_id"],
                "document_name": row["document__name"],
                "count": row["count"],
            }
            for row in data
        ]

        return Response(response)
        

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from master_apps.vendor.compliance_models import VendorComplianceSubmission


class ExceptionalVendorListAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        pe_id = request.GET.get("pe_id")
        branch_id = request.GET.get("branch_id")
        audit_period = request.GET.get("audit_period")

        queryset = (
            VendorComplianceSubmission.objects.filter(
                has_exceptional_approval=True,
                is_cc_issued=True,
            )
            .select_related("vendor")
        )

        if pe_id:
            queryset = queryset.filter(
                principal_employer_id=pe_id
            )

        if branch_id:
            queryset = queryset.filter(
                branch_id=branch_id
            )

        if audit_period:
            queryset = queryset.filter(
                audit_period=audit_period
            )

        vendors = (
            queryset.values(
                "vendor_id",
                "vendor__name",
            )
            .distinct()
            .order_by("vendor__name")
        )

        return Response([
            {
                "id": item["vendor_id"],
                "name": item["vendor__name"],
            }
            for item in vendors
        ])


from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from master_apps.vendor.compliance_models import VendorComplianceSubmission


class ExceptionalDocumentListAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        pe_id = request.GET.get("pe_id")
        vendor_id = request.GET.get("vendor_id")
        branch_id = request.GET.get("branch_id")
        audit_period = request.GET.get("audit_period")

        queryset = (
            VendorComplianceSubmission.objects.filter(
                has_exceptional_approval=True,
                is_cc_issued=True,
            )
            .select_related("document")
        )

        if pe_id:
            queryset = queryset.filter(
                principal_employer_id=pe_id
            )

        if vendor_id:
            queryset = queryset.filter(
                vendor_id=vendor_id
            )

        if branch_id:
            queryset = queryset.filter(
                branch_id=branch_id
            )

        if audit_period:
            queryset = queryset.filter(
                audit_period=audit_period
            )

        documents = (
            queryset.values(
                "document_id",
                "document__name",
            )
            .distinct()
            .order_by("document__name")
        )

        return Response([
            {
                "id": item["document_id"],
                "name": item["document__name"],
            }
            for item in documents
        ])


from collections import defaultdict
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from master_apps.principle_employee.models import PrincipalEmployer
from master_apps.vendor.compliance_models import VendorComplianceSubmission


class DocumentWiseRemittanceTrendAPIView(APIView):
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

        # -----------------------------------------
        # Optional Filters
        # -----------------------------------------
        vendors = request.GET.getlist("vendors")
        audit_periods = request.GET.getlist("audit_periods")
        documents = request.GET.getlist("documents")

        queryset = VendorComplianceSubmission.objects.filter(
            principal_employer=pe,
        )

        if vendors:
            queryset = queryset.filter(vendor_id__in=vendors)

        if audit_periods:
            queryset = queryset.filter(audit_period__in=audit_periods)

        # -----------------------------------------
        # Decide which remittance field to use
        # Default = PF
        # -----------------------------------------
        date_field = "pf_remittance_date"

        if documents:
            document_name = documents[0].strip().lower()

            if "esic" in document_name:
                date_field = "esic_remittance_date"

        queryset = queryset.exclude(**{
            f"{date_field}__isnull": True
        }).order_by("audit_period")

        trend = defaultdict(
            lambda: {
                "total_day": 0,
                "count": 0,
                "before_15": 0,
                "after_15": 0,
            }
        )

        for submission in queryset:

            remittance_date = getattr(submission, date_field)

            if not remittance_date:
                continue

            month = submission.audit_period
            day = remittance_date.day

            trend[month]["total_day"] += day
            trend[month]["count"] += 1

            if day <= 15:
                trend[month]["before_15"] += 1
            else:
                trend[month]["after_15"] += 1

        response = []

        for month, values in trend.items():

            response.append(
                {
                    "month": month,
                    "remittance_day": round(
                        values["total_day"] / values["count"]
                    ),
                    "before_15": values["before_15"],
                    "after_15": values["after_15"],
                }
            )

        response.sort(key=lambda x: x["month"])

        return Response(response)


class DocumentWiseComplianceTrendAPIView(APIView):
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

        selected_year = int(
            request.GET.get(
                "year",
                timezone.now().year,
            )
        )

        queryset = VendorComplianceSubmission.objects.filter(
            principal_employer=pe
        )

        vendors = request.GET.getlist("vendors")
        branches = request.GET.getlist("branches")
        states = request.GET.getlist("states")

        if vendors:
            queryset = queryset.filter(vendor_id__in=vendors)

        if branches:
            queryset = queryset.filter(branch_id__in=branches)

        if states:
            queryset = queryset.filter(state__in=states)

        trend = {}

        for month in range(1, 13):

            trend[month] = {

                "month": month_abbr[month],

                "pf_total": 0,
                "pf_count": 0,
                "pf_before_15": 0,
                "pf_after_15": 0,

                "esic_total": 0,
                "esic_count": 0,
                "esic_before_15": 0,
                "esic_after_15": 0,
            }

        for submission in queryset:

            # -------------------------
            # PF
            # -------------------------

            if (
                submission.pf_remittance_date and
                submission.pf_remittance_date.year == selected_year
            ):

                month = submission.pf_remittance_date.month
                day = submission.pf_remittance_date.day

                trend[month]["pf_total"] += day
                trend[month]["pf_count"] += 1

                if day <= 15:
                    trend[month]["pf_before_15"] += 1
                else:
                    trend[month]["pf_after_15"] += 1

            # -------------------------
            # ESIC
            # -------------------------

            if (
                submission.esic_remittance_date and
                submission.esic_remittance_date.year == selected_year
            ):

                month = submission.esic_remittance_date.month
                day = submission.esic_remittance_date.day

                trend[month]["esic_total"] += day
                trend[month]["esic_count"] += 1

                if day <= 15:
                    trend[month]["esic_before_15"] += 1
                else:
                    trend[month]["esic_after_15"] += 1

        response = []

        for month in range(1, 13):

            item = trend[month]

            response.append({

                "month": item["month"],

                "pf": round(
                    item["pf_total"] / item["pf_count"],
                    1
                ) if item["pf_count"] else 0,

                "esic": round(
                    item["esic_total"] / item["esic_count"],
                    1
                ) if item["esic_count"] else 0,

                "pf_before_15": item["pf_before_15"],
                "pf_after_15": item["pf_after_15"],

                "esic_before_15": item["esic_before_15"],
                "esic_after_15": item["esic_after_15"],
            })

        return Response({
            "year": selected_year,
            "trend": response,
        })


class DocumentWiseAvailableYearsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        if request.user.role != "PE":
            return Response(
                {"error": "Unauthorized"},
                status=403,
            )

        try:
            pe = PrincipalEmployer.objects.get(user=request.user)
        except PrincipalEmployer.DoesNotExist:
            return Response(
                {"error": "Principal Employer not found"},
                status=404,
            )

        queryset = VendorComplianceSubmission.objects.filter(
            principal_employer=pe
        ).filter(
            Q(pf_remittance_date__isnull=False) |
            Q(esic_remittance_date__isnull=False)
        )

        years = set()

        pf_years = (
            queryset
            .exclude(pf_remittance_date__isnull=True)
            .annotate(year=ExtractYear("pf_remittance_date"))
            .values_list("year", flat=True)
            .distinct()
        )

        esic_years = (
            queryset
            .exclude(esic_remittance_date__isnull=True)
            .annotate(year=ExtractYear("esic_remittance_date"))
            .values_list("year", flat=True)
            .distinct()
        )

        years.update(pf_years)
        years.update(esic_years)

        years = sorted(
            [y for y in years if y is not None],
            reverse=True,
        )

        return Response(
            {
                "years": years
            }
        )


class ComplianceDashboardFiltersAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        if request.user.role != "PE":
            return Response(
                {"error": "Unauthorized"},
                status=403,
            )

        try:
            pe = PrincipalEmployer.objects.get(user=request.user)

        except PrincipalEmployer.DoesNotExist:
            return Response(
                {"error": "Principal Employer not found"},
                status=404,
            )

        queryset = VendorComplianceSubmission.objects.filter(
            principal_employer=pe
        )

        # -----------------------------
        # Selected Filters
        # -----------------------------

        selected_states = request.GET.getlist("states")

        selected_branches = request.GET.getlist("branches")

        selected_vendors = request.GET.getlist("vendors")

        # -----------------------------
        # State
        # -----------------------------

        states = (
            VendorComplianceSubmission.objects
            .filter(principal_employer=pe)
            .values_list(
                "state",
                flat=True,
            )
            .distinct()
            .order_by("state")
        )

        # -----------------------------
        # Branch
        # -----------------------------

        if selected_states:
            queryset = queryset.filter(
                state__in=selected_states
            )

        branches = (
            queryset
            .values(
                "branch_id",
                "branch__short_name",
            )
            .distinct()
            .order_by(
                "branch__short_name"
            )
        )

        # -----------------------------
        # Vendor
        # -----------------------------

        if selected_branches:
            queryset = queryset.filter(
                branch_id__in=selected_branches
            )

        vendors = (
            queryset
            .values(
                "vendor_id",
                "vendor__name",
            )
            .distinct()
            .order_by(
                "vendor__name"
            )
        )

        # -----------------------------
        # Audit Period
        # -----------------------------

        if selected_vendors:
            queryset = queryset.filter(
                vendor_id__in=selected_vendors
            )

        audit_periods = (
            queryset
            .values_list(
                "audit_period",
                flat=True,
            )
            .distinct()
            .order_by(
                "audit_period"
            )
        )

        return Response({

            "states": [
                {
                    "id": s,
                    "name": s,
                }
                for s in states
            ],

            "branches": [
                {
                    "id": b["branch_id"],
                    "name": b["branch__short_name"],
                }
                for b in branches
            ],

            "vendors": [
                {
                    "id": v["vendor_id"],
                    "name": v["vendor__name"],
                }
                for v in vendors
            ],

            "audit_periods": [
                {
                    "id": a,
                    "name": a,
                }
                for a in audit_periods
            ],
        })


class ComplianceDashboardSummaryV2APIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        if request.user.role != "PE":
            return Response(
                {"error": "Unauthorized"},
                status=403,
            )

        try:
            pe = PrincipalEmployer.objects.get(
                user=request.user
            )

        except PrincipalEmployer.DoesNotExist:
            return Response(
                {"error": "Principal Employer not found"},
                status=404,
            )

        queryset = VendorComplianceSubmission.objects.filter(
            principal_employer=pe
        )

        # ----------------------------------------
        # Filters
        # ----------------------------------------

        states = request.GET.getlist("states")
        branches = request.GET.getlist("branches")
        vendors = request.GET.getlist("vendors")
        audit_periods = request.GET.getlist("audit_periods")

        if states:
            queryset = queryset.filter(
                state__in=states
            )

        if branches:
            queryset = queryset.filter(
                branch_id__in=branches
            )

        if vendors:
            queryset = queryset.filter(
                vendor_id__in=vendors
            )

        if audit_periods:
            queryset = queryset.filter(
                audit_period__in=audit_periods
            )

        # ----------------------------------------
        # Summary Cards
        # ----------------------------------------

        cc_issued = queryset.filter(
            is_cc_issued=True
        ).count()

        exceptional_cc = queryset.filter(
            has_exceptional_approval=True,
            is_cc_issued=True,
        ).count()

        under_audit = queryset.filter(
            workflow_status__in=[
                WorkflowStatus.SUBMITTED,
                WorkflowStatus.UNDER_REVIEW,
                WorkflowStatus.REUPLOAD_REQUESTED,
                WorkflowStatus.REUPLOADED,
            ]
        ).count()

        document_not_submitted = queryset.filter(
            workflow_status__in=[
                WorkflowStatus.DRAFT,
                WorkflowStatus.SAVED,
            ]
        ).count()

        return Response(
            {
                "ccIssued": cc_issued,
                "exceptionalCC": exceptional_cc,
                "underAudit": under_audit,
                "documentNotSubmitted": document_not_submitted,
            }
        )


class ComplianceDashboardMonthlyTrendV2APIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        if request.user.role != "PE":
            return Response(
                {"error": "Unauthorized"},
                status=403,
            )

        try:
            pe = PrincipalEmployer.objects.get(
                user=request.user
            )

        except PrincipalEmployer.DoesNotExist:
            return Response(
                {"error": "Principal Employer not found"},
                status=404,
            )

        queryset = VendorComplianceSubmission.objects.filter(
            principal_employer=pe
        )

        # -----------------------------
        # Filters
        # -----------------------------

        states = request.GET.getlist("states")
        branches = request.GET.getlist("branches")
        vendors = request.GET.getlist("vendors")
        audit_periods = request.GET.getlist("audit_periods")

        if states:
            queryset = queryset.filter(state__in=states)

        if branches:
            queryset = queryset.filter(branch_id__in=branches)

        if vendors:
            queryset = queryset.filter(vendor_id__in=vendors)

        if audit_periods:
            queryset = queryset.filter(
                audit_period__in=audit_periods
            )

        periods = (
            queryset.values_list(
                "audit_period",
                flat=True,
            )
            .distinct()
            .order_by("-audit_period")[:6]
        )

        periods = list(periods)[::-1]

        response = []

        for period in periods:

            rows = queryset.filter(
                audit_period=period
            )

            response.append({
                "month": period,

                "ccIssued": rows.filter(
                    is_cc_issued=True
                ).count(),

                "exceptionalCC": rows.filter(
                    has_exceptional_approval=True,
                    is_cc_issued=True,
                ).count(),

                "underAudit": rows.filter(
                    workflow_status__in=[
                        WorkflowStatus.SUBMITTED,
                        WorkflowStatus.UNDER_REVIEW,
                        WorkflowStatus.REUPLOAD_REQUESTED,
                        WorkflowStatus.REUPLOADED,
                    ]
                ).count(),

                "documentNotSubmitted": rows.filter(
                    workflow_status__in=[
                        WorkflowStatus.DRAFT,
                        WorkflowStatus.SAVED,
                    ]
                ).count(),
            })

        return Response(response)


class ComplianceDashboardDistributionV2APIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        if request.user.role != "PE":
            return Response(
                {"error": "Unauthorized"},
                status=403,
            )

        try:
            pe = PrincipalEmployer.objects.get(
                user=request.user
            )

        except PrincipalEmployer.DoesNotExist:
            return Response(
                {"error": "Principal Employer not found"},
                status=404,
            )

        queryset = VendorComplianceSubmission.objects.filter(
            principal_employer=pe
        )

        # ----------------------------------------
        # Filters
        # ----------------------------------------

        states = request.GET.getlist("states")
        branches = request.GET.getlist("branches")
        vendors = request.GET.getlist("vendors")
        audit_periods = request.GET.getlist("audit_periods")

        if states:
            queryset = queryset.filter(
                state__in=states
            )

        if branches:
            queryset = queryset.filter(
                branch_id__in=branches
            )

        if vendors:
            queryset = queryset.filter(
                vendor_id__in=vendors
            )

        if audit_periods:
            queryset = queryset.filter(
                audit_period__in=audit_periods
            )

        response = {
            "ccIssued": queryset.filter(
                is_cc_issued=True
            ).count(),

            "exceptionalCC": queryset.filter(
                has_exceptional_approval=True,
                is_cc_issued=True,
            ).count(),

            "underAudit": queryset.filter(
                workflow_status__in=[
                    WorkflowStatus.SUBMITTED,
                    WorkflowStatus.UNDER_REVIEW,
                    WorkflowStatus.REUPLOAD_REQUESTED,
                    WorkflowStatus.REUPLOADED,
                ]
            ).count(),

            "documentNotSubmitted": queryset.filter(
                workflow_status__in=[
                    WorkflowStatus.DRAFT,
                    WorkflowStatus.SAVED,
                ]
            ).count(),
        }

        return Response({
            "distribution": response
        })


class ComplianceDashboardGenderDistributionAPIView(APIView):
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

        queryset = VendorComplianceSubmission.objects.filter(
            principal_employer=pe,
            is_cc_issued=True,
        )

        # -----------------------------
        # Filters
        # -----------------------------

        states = request.GET.getlist("states")
        branches = request.GET.getlist("branches")
        vendors = request.GET.getlist("vendors")
        services = request.GET.getlist("services")
        audit_periods = request.GET.getlist("audit_periods")

        if states:
            queryset = queryset.filter(state__in=states)

        if branches:
            queryset = queryset.filter(branch_id__in=branches)

        if vendors:
            queryset = queryset.filter(vendor_id__in=vendors)

        if services:
            queryset = queryset.filter(
                vendor__nature_of_services__in=services
            )
        
        if audit_periods:
            queryset = queryset.filter(
                audit_period__in=audit_periods
            )

        male = queryset.aggregate(
            total=Sum("male_employees")
        )["total"] or 0

        female = queryset.aggregate(
            total=Sum("female_employees")
        )["total"] or 0

        return Response({
            "male": male,
            "female": female,
        })


class ComplianceDashboardGenderFiltersAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        if request.user.role != "PE":
            return Response(
                {"error": "Unauthorized"},
                status=403,
            )

        try:
            pe = PrincipalEmployer.objects.get(
                user=request.user
            )

        except PrincipalEmployer.DoesNotExist:
            return Response(
                {"error": "Principal Employer not found"},
                status=404,
            )

        queryset = VendorComplianceSubmission.objects.filter(
            principal_employer=pe,
            is_cc_issued=True,
        )

        # -----------------------------
        # Current Selections
        # -----------------------------

        states = request.GET.getlist("states")
        branches = request.GET.getlist("branches")
        vendors = request.GET.getlist("vendors")

        if states:
            queryset = queryset.filter(
                state__in=states
            )

        if branches:
            queryset = queryset.filter(
                branch_id__in=branches
            )

        if vendors:
            queryset = queryset.filter(
                vendor_id__in=vendors
            )

        states_data = (
            queryset.values_list(
                "state",
                flat=True,
            )
            .distinct()
            .order_by("state")
        )

        branches_data = (
            queryset.values(
                "branch_id",
                "branch__short_name",
            )
            .distinct()
            .order_by("branch__short_name")
        )

        vendors_data = (
            queryset.values(
                "vendor__id",
                "vendor__name",
            )
            .distinct()
            .order_by("vendor__name")
        )

        services_data = (
            queryset.values_list(
                "vendor__nature_of_services",
                flat=True,
            )
            .distinct()
            .order_by("vendor__nature_of_services")
        )

        audit_periods_data = (
            queryset.values_list(
                "audit_period",
                flat=True,
            )
            .distinct()
            .order_by("audit_period")
        )

        return Response({

            "states": [
                {
                    "id": x,
                    "name": x,
                }
                for x in states_data
            ],

            "branches": [
                {
                    "id": x["branch_id"],
                    "name": x["branch__short_name"],
                }
                for x in branches_data
            ],

            "vendors": [
                {
                    "id": x["vendor__id"],
                    "name": x["vendor__name"],
                }
                for x in vendors_data
            ],

            "services": [
                {
                    "id": x,
                    "name": x,
                }
                for x in services_data
            ],

            "audit_periods": [
                {
                    "id": x,
                    "name": x,
                }
                for x in audit_periods_data
            ],
        })