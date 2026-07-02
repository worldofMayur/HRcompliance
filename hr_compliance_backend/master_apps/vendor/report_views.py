from io import BytesIO
from datetime import datetime

from django.http import HttpResponse

from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from master_apps.principle_employee.models import PrincipalEmployer
from master_apps.vendor.mapping_models import VendorBranchMapping

from rest_framework.views import APIView
from django.http import HttpResponse

from openpyxl import Workbook
from openpyxl.styles import Font

from master_apps.auditor.models import AuditEntry
from master_apps.vendor.mapping_models import VendorBranchMapping
from master_apps.principle_employee.models import PrincipalEmployerBranch

from master_apps.vendor.compliance_models import (
    VendorComplianceSubmission,
    WorkflowStatus,
)

from master_apps.vendor.models import Vendor


# ===================================================================
# MAIN EXCEL REPORT
# ===================================================================
class BranchWiseVendorReportAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != "PE":
            return Response({"error": "Unauthorized"}, status=403)

        try:
            pe = PrincipalEmployer.objects.get(user=request.user)
        except PrincipalEmployer.DoesNotExist:
            return Response({"error": "Principal Employer not found"}, status=404)

        data = request.data

        states = data.get("states", [])
        branches = data.get("branches", [])
        vendors = data.get("vendors", [])
        services = data.get("services", [])

        # Base queryset
        queryset = (
            VendorBranchMapping.objects
            .filter(principal_employer=pe)
            .select_related("vendor", "branch")
            .order_by("branch__state", "branch__short_name", "vendor__name")
        )

        if states and "all" not in states:
            queryset = queryset.filter(branch__state__in=states)

        if branches and "all" not in branches:
            queryset = queryset.filter(branch_id__in=branches)

        if vendors:
            queryset = queryset.filter(vendor_id__in=vendors)

        if services:
            queryset = queryset.filter(vendor__nature_of_services__in=services)

        # Empty report check
        if not queryset.exists():
            return Response({"message": "No records found matching your filters."}, status=404)

        # ===========================
        # Create Workbook
        # ===========================
        workbook = Workbook()
        worksheet = workbook.active
        worksheet.title = "Branch Wise Vendor Mapping"

        # ===========================
        # Styles
        # ===========================
        title_font = Font(bold=True, size=16, color="FFFFFF")
        header_font = Font(bold=True, color="FFFFFF")

        title_fill = PatternFill(fill_type="solid", fgColor="1F4E78")
        header_fill = PatternFill(fill_type="solid", fgColor="4472C4")

        thin_border = Border(
            left=Side(style="thin"),
            right=Side(style="thin"),
            top=Side(style="thin"),
            bottom=Side(style="thin")
        )

        center_alignment = Alignment(horizontal="center", vertical="center")

        # Enhanced Title (Two rows)
        worksheet.merge_cells("A1:J1")
        cell = worksheet["A1"]
        cell.value = "Compliance Clearance System"
        cell.font = title_font
        cell.fill = title_fill
        cell.alignment = center_alignment

        worksheet.merge_cells("A2:J2")
        cell = worksheet["A2"]
        cell.value = "Branch Wise Vendor Mapping Report"
        cell.font = Font(bold=True, size=14, color="FFFFFF")
        cell.fill = title_fill
        cell.alignment = center_alignment

        # Report Info
        worksheet["A4"] = "Principal Employer"
        worksheet["B4"] = pe.name

        worksheet["D4"] = "Generated On"
        worksheet["E4"] = datetime.now().strftime("%d-%b-%Y %I:%M %p")

        worksheet["G4"] = "Total Records"
        worksheet["H4"] = queryset.count()

        # Headers
        headers = [
            "State",
            "Branch",
            "Branch Address",
            "Vendor",
            "Nature of Service",
            "Agreement From",
            "Agreement To",
            "Contact Person",
            "Mobile",
            "Email"
        ]

        row = 6
        for col, header in enumerate(headers, start=1):
            cell = worksheet.cell(row=row, column=col)
            cell.value = header
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = center_alignment
            cell.border = thin_border

        row = 7

        # Data Rows
        for mapping in queryset:
            worksheet.cell(row=row, column=1).value = mapping.branch.state
            worksheet.cell(row=row, column=2).value = mapping.branch.short_name
            worksheet.cell(row=row, column=3).value = mapping.branch.address
            worksheet.cell(row=row, column=4).value = mapping.vendor.name
            worksheet.cell(row=row, column=5).value = mapping.vendor.nature_of_services

            worksheet.cell(row=row, column=6).value = (
                mapping.start_date.strftime("%d-%b-%Y") if mapping.start_date else ""
            )
            worksheet.cell(row=row, column=7).value = (
                mapping.end_date.strftime("%d-%b-%Y") if mapping.end_date else ""
            )

            worksheet.cell(row=row, column=8).value = mapping.vendor.contact_person
            worksheet.cell(row=row, column=9).value = mapping.vendor.mobile
            worksheet.cell(row=row, column=10).value = mapping.vendor.email

            row += 1

        # Apply borders
        for r in worksheet.iter_rows(
            min_row=6, max_row=worksheet.max_row, min_col=1, max_col=10
        ):
            for cell in r:
                cell.border = thin_border

        # Safe column width adjustment
        for col in range(1, 11):
            max_length = 0
            column_letter = get_column_letter(col)
            for r in range(1, worksheet.max_row + 1):
                value = worksheet.cell(row=r, column=col).value
                if value:
                    max_length = max(max_length, len(str(value)))
            worksheet.column_dimensions[column_letter].width = min(max_length + 4, 40)

        # Freeze panes + Auto filter
        worksheet.freeze_panes = "A7"
        worksheet.auto_filter.ref = f"A6:J{worksheet.max_row}"

        # ===========================
        # Return Excel Response
        # ===========================
        output = BytesIO()
        workbook.save(output)
        output.seek(0)

        pe_identifier = getattr(pe, 'short_name', getattr(pe, 'name', 'Report'))
        filename = f"BranchWiseVendorMapping_{pe_identifier}_{datetime.now().strftime('%Y%m%d')}.xlsx"

        response = HttpResponse(
            output.read(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        response["Content-Disposition"] = f'attachment; filename="{filename}"'

        return response


# ===================================================================
# DROPDOWN FILTER APIS FOR REPORTS
# ===================================================================
class PEReportStatesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            pe = PrincipalEmployer.objects.get(user=request.user)
        except PrincipalEmployer.DoesNotExist:
            return Response([])

        states = (
            VendorBranchMapping.objects
            .filter(principal_employer=pe)
            .values_list("branch__state", flat=True)
            .distinct()
            .order_by("branch__state")
        )

        return Response([
            {"id": state, "name": state}
            for state in states if state
        ])


class PEReportBranchesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            pe = PrincipalEmployer.objects.get(user=request.user)
        except PrincipalEmployer.DoesNotExist:
            return Response([])

        states = (
            request.GET.getlist("states")
            or request.GET.getlist("states[]")
        )

        print("States:", states)
        queryset = VendorBranchMapping.objects.filter(principal_employer=pe)

        if states:
            queryset = queryset.filter(branch__state__in=states)

        branches = (
            queryset.values(
                "branch_id",
                "branch__short_name",
                "branch__state",
            )
            .distinct()
            .order_by(
                "branch__state",
                "branch__short_name",
            )
        )

        return Response([
            {
                "id": item["branch_id"],
                "name": f'{item["branch__short_name"]} - {item["branch__state"]}',
            }
            for item in branches
        ])


class PEReportVendorsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            pe = PrincipalEmployer.objects.get(user=request.user)
        except PrincipalEmployer.DoesNotExist:
            return Response([])

        states = (
            request.GET.getlist("states")
            or request.GET.getlist("states[]")
        )

        branches = (
            request.GET.getlist("branches")
            or request.GET.getlist("branches[]")
        )

        print("States:", states)
        print("Branches:", branches)

        queryset = VendorBranchMapping.objects.filter(
            principal_employer=pe
        )

        if states:
            queryset = queryset.filter(
                branch__state__in=states
            )

        if branches:
            queryset = queryset.filter(
                branch_id__in=branches
            )

        vendors = (
            queryset.values(
                "vendor_id",
                "vendor__name"
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


class PEComplianceVendorsAPIView(PEReportVendorsAPIView):
    """
    Compliance report uses the same vendor filtering
    as Branch report.
    """
    pass


class PEReportServicesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            pe = PrincipalEmployer.objects.get(user=request.user)
        except PrincipalEmployer.DoesNotExist:
            return Response([])

        states = (
            request.GET.getlist("states")
            or request.GET.getlist("states[]")
        )

        branches = (
            request.GET.getlist("branches")
            or request.GET.getlist("branches[]")
        )

        vendors = (
            request.GET.getlist("vendors")
            or request.GET.getlist("vendors[]")
        )

        print("States:", states)
        print("Branches:", branches)
        print("Vendors:", vendors)

        queryset = VendorBranchMapping.objects.filter(
            principal_employer=pe
        )

        if states:
            queryset = queryset.filter(
                branch__state__in=states
            )

        if branches:
            queryset = queryset.filter(
                branch_id__in=branches
            )

        if vendors:
            queryset = queryset.filter(
                vendor_id__in=vendors
            )

        services = (
            queryset.values_list(
                "vendor__nature_of_services",
                flat=True
            )
            .distinct()
            .order_by(
                "vendor__nature_of_services"
            )
        )

        return Response([
            {
                "id": item,
                "name": item,
            }
            for item in services if item
        ])


from master_apps.auditor.models import AuditEntry
from master_apps.vendor.mapping_models import VendorBranchMapping


class PEReportAuditPeriodsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            pe = PrincipalEmployer.objects.get(user=request.user)
        except PrincipalEmployer.DoesNotExist:
            return Response([])

        states = (
            request.GET.getlist("states")
            or request.GET.getlist("states[]")
        )

        branches = (
            request.GET.getlist("branches")
            or request.GET.getlist("branches[]")
        )

        vendors = (
            request.GET.getlist("vendors")
            or request.GET.getlist("vendors[]")
        )

        queryset = VendorBranchMapping.objects.filter(
            principal_employer=pe
        )

        if states:
            queryset = queryset.filter(
                branch__state__in=states
            )

        if branches:
            queryset = queryset.filter(
                branch_id__in=branches
            )

        if vendors:
            queryset = queryset.filter(
                vendor_id__in=vendors
            )

        branch_ids = queryset.values_list(
            "branch_id",
            flat=True
        )

        audit_periods = (
            AuditEntry.objects.filter(
                branch_id__in=branch_ids
            )
            .values_list(
                "audit_period",
                flat=True
            )
            .distinct()
            .order_by("-audit_period")
        )

        return Response([
            {
                "id": period,
                "name": period,
            }
            for period in audit_periods
        ])


class PEComplianceAuditPeriodsAPIView(PEReportAuditPeriodsAPIView):
    """
    Compliance report uses the same audit period logic.
    """
    pass


class PECompliancePeriodicitiesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            pe = PrincipalEmployer.objects.get(user=request.user)
        except PrincipalEmployer.DoesNotExist:
            return Response([])

        states = request.GET.getlist("states") or request.GET.getlist("states[]")
        branches = request.GET.getlist("branches") or request.GET.getlist("branches[]")
        vendors = request.GET.getlist("vendors") or request.GET.getlist("vendors[]")

        queryset = VendorBranchMapping.objects.filter(
            principal_employer=pe
        )

        if states:
            queryset = queryset.filter(branch__state__in=states)

        if branches:
            queryset = queryset.filter(branch_id__in=branches)

        if vendors:
            queryset = queryset.filter(vendor_id__in=vendors)

        periodicities = (
            queryset.values_list(
                "frequency",
                flat=True
            )
            .distinct()
            .order_by("frequency")
        )

        return Response([
            {
                "id": p,
                "name": p.replace("_", " ").title(),
            }
            for p in periodicities if p
        ])



class PEExceptionalAuditPeriodsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            pe = PrincipalEmployer.objects.get(user=request.user)
        except PrincipalEmployer.DoesNotExist:
            return Response([])

        states = request.GET.getlist("states") or request.GET.getlist("states[]")
        branches = request.GET.getlist("branches") or request.GET.getlist("branches[]")
        vendors = request.GET.getlist("vendors") or request.GET.getlist("vendors[]")

        submissions = VendorComplianceSubmission.objects.filter(
            principal_employer=pe,
            workflow_status=WorkflowStatus.FROZEN,
            has_exceptional_approval=True,
        )

        if states:
            submissions = submissions.filter(
                state__in=states
            )

        if branches:
            submissions = submissions.filter(
                branch_id__in=branches
            )

        if vendors:
            submissions = submissions.filter(
                vendor_id__in=vendors
            )

        periods = (
            submissions.values_list(
                "audit_period",
                flat=True,
            )
            .distinct()
            .order_by("-audit_period")
        )

        return Response([
            {
                "id": p,
                "name": p,
            }
            for p in periods
        ])

# ===================================================================
# EXCEPTIONAL APPROVAL - DEDICATED FILTER APIS
# ===================================================================

class PEExceptionalStatesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            pe = PrincipalEmployer.objects.get(user=request.user)
        except PrincipalEmployer.DoesNotExist:
            return Response([])

        # Only AuditEntries with Exceptional Approval status
        exceptional_entries = AuditEntry.objects.filter(
            status__in=[
                "Exceptional Approval - Delayed Complied",
                "Exceptional Approval- Not Complied",
            ]
        )

        branch_ids = exceptional_entries.values_list("branch_id", flat=True).distinct()

        states = (
            PrincipalEmployerBranch.objects
            .filter(id__in=branch_ids)
            .values_list("state", flat=True)
            .distinct()
            .order_by("state")
        )

        return Response([
            {"id": state, "name": state}
            for state in states if state
        ])


import traceback

class PEExceptionalBranchesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            pe = PrincipalEmployer.objects.get(user=request.user)

            states = (
                request.GET.getlist("states")
                or request.GET.getlist("states[]")
            )

            submissions = VendorComplianceSubmission.objects.filter(
                principal_employer=pe,
                workflow_status=WorkflowStatus.FROZEN,
                has_exceptional_approval=True,
            )

            if states:
                submissions = submissions.filter(
                    state__in=states
                )

            branch_ids = (
                submissions.values_list(
                    "branch_id",
                    flat=True,
                )
                .distinct()
            )

            branches = (
                PrincipalEmployerBranch.objects.filter(
                    id__in=branch_ids
                )
                .values(
                    "id",
                    "short_name",
                    "state",
                )
                .order_by(
                    "state",
                    "short_name",
                )
            )

            return Response([
                {
                    "id": b["id"],
                    "name": f'{b["short_name"]} - {b["state"]}',
                }
                for b in branches
            ])

        except PrincipalEmployer.DoesNotExist:
            return Response([])

        except Exception as e:
            traceback.print_exc()
            print("ERROR:", e)
            return Response({"error": str(e)}, status=500)


class PEExceptionalVendorsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            pe = PrincipalEmployer.objects.get(user=request.user)
        except PrincipalEmployer.DoesNotExist:
            return Response([])

        states = request.GET.getlist("states") or request.GET.getlist("states[]")
        branches = request.GET.getlist("branches") or request.GET.getlist("branches[]")

        submissions = VendorComplianceSubmission.objects.filter(
            principal_employer=pe,
            workflow_status=WorkflowStatus.FROZEN,
            has_exceptional_approval=True,
        )

        if states:
            submissions = submissions.filter(
                state__in=states
            )

        if branches:
            submissions = submissions.filter(
                branch_id__in=branches
            )

        vendor_ids = submissions.values_list(
            "vendor_id",
            flat=True,
        ).distinct()

        vendors = (
            Vendor.objects.filter(
                id__in=vendor_ids
            )
            .values(
                "id",
                "name",
            )
            .order_by("name")
        )

        return Response([
            {
                "id": v["id"],
                "name": v["name"],
            }
            for v in vendors
        ])

# ===================================================================
# EXCEPTIONAL APPROVAL REPORT - MAIN VIEW (Polished)
# ===================================================================
class ExceptionalApprovalReportAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != "PE":
            return Response({"error": "Unauthorized"}, status=403)

        try:
            pe = PrincipalEmployer.objects.get(user=request.user)
        except PrincipalEmployer.DoesNotExist:
            return Response({"error": "Principal Employer not found"}, status=404)

        data = request.data

        states = data.get("states", [])
        branches = data.get("branches", [])
        vendors = data.get("vendors", [])
        audit_periods = data.get("audit_periods", [])

        # Main queryset
        queryset = AuditEntry.objects.select_related(
            "auditor",
            "checklist",
            "checklist__document",
        ).filter(
            status__in=[
                "Exceptional Approval - Delayed Complied",
                "Exceptional Approval- Not Complied",
            ]
        )

        # Filters
        if branches and "all" not in branches:
            queryset = queryset.filter(branch_id__in=branches)

        if audit_periods and "all" not in audit_periods:
            queryset = queryset.filter(audit_period__in=audit_periods)

        if not queryset.exists():
            return Response({"message": "No records found matching your filters."}, status=404)

        # ===========================
        # Excel Generation
        # ===========================
        workbook = Workbook()
        worksheet = workbook.active
        worksheet.title = "Exceptional Approval Report"

        title_font = Font(bold=True, size=16, color="FFFFFF")
        header_font = Font(bold=True, color="FFFFFF")
        title_fill = PatternFill(fill_type="solid", fgColor="1F4E78")
        header_fill = PatternFill(fill_type="solid", fgColor="4472C4")
        thin_border = Border(left=Side(style="thin"), right=Side(style="thin"),
                             top=Side(style="thin"), bottom=Side(style="thin"))
        center_alignment = Alignment(horizontal="center", vertical="center")

        # Title
        worksheet.merge_cells("A1:K1")
        worksheet["A1"] = "Compliance Clearance System"
        worksheet["A1"].font = title_font
        worksheet["A1"].fill = title_fill
        worksheet["A1"].alignment = center_alignment

        worksheet.merge_cells("A2:K2")
        worksheet["A2"] = "Exceptional Approval Report"
        worksheet["A2"].font = Font(bold=True, size=14, color="FFFFFF")
        worksheet["A2"].fill = title_fill
        worksheet["A2"].alignment = center_alignment

        # Info Row
        worksheet["A4"] = "Principal Employer"
        worksheet["B4"] = pe.name
        worksheet["D4"] = "Generated On"
        worksheet["E4"] = datetime.now().strftime("%d-%b-%Y %I:%M %p")
        worksheet["G4"] = "Total Records"
        worksheet["H4"] = queryset.count()

        # Headers
        headers = [
            "State", "Branch", "Branch Address", "Vendor", "Audit Period",
            "Audit Date", "Document", "Audit Particulars", "Observation",
            "Recommendation", "Status"
        ]

        row = 6
        for col, header in enumerate(headers, start=1):
            cell = worksheet.cell(row=row, column=col)
            cell.value = header
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = center_alignment
            cell.border = thin_border

        row = 7

        for audit in queryset:

            try:
                mapping = VendorBranchMapping.objects.select_related(
                    "branch",
                    "vendor",
                ).get(
                    branch_id=audit.branch_id,
                    principal_employer=pe
                )
            except VendorBranchMapping.DoesNotExist:
                continue

            branch = mapping.branch
            vendor = mapping.vendor

            if states and "all" not in states:
                if branch.state not in states:
                    continue

            if vendors and "all" not in vendors:
                if str(vendor.id) not in vendors:
                    continue

            ws_row = [
                branch.state,
                branch.short_name,
                branch.address,
                vendor.name,
                audit.audit_period,
                "",
                getattr(audit.checklist.document, "name", ""),
                getattr(audit.checklist, "audit_particulars", ""),
                audit.observation,
                audit.recommendation,
                audit.status,
            ]

            for col, value in enumerate(ws_row, start=1):
                cell = worksheet.cell(row=row, column=col)
                cell.value = value
                cell.border = thin_border

            row += 1


        # Column widths
        for col in range(1, 12):
            column_letter = get_column_letter(col)
            max_length = 0
            for r in range(1, worksheet.max_row + 1):
                value = worksheet.cell(row=r, column=col).value
                if value:
                    max_length = max(max_length, len(str(value)))
            worksheet.column_dimensions[column_letter].width = min(max_length + 4, 45)

        worksheet.freeze_panes = "A7"
        worksheet.auto_filter.ref = f"A6:K{worksheet.max_row}"

        # Response
        output = BytesIO()
        workbook.save(output)
        output.seek(0)

        pe_identifier = getattr(pe, 'short_name', getattr(pe, 'name', 'PE'))
        filename = f"ExceptionalApprovalReport_{pe_identifier}_{datetime.now().strftime('%Y%m%d')}.xlsx"

        response = HttpResponse(
            output.read(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        response["Content-Disposition"] = f'attachment; filename="{filename}"'

        return response