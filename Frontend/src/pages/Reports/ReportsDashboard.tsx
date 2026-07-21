import { useState } from "react";
import { Select, Card } from "antd";
import VendorComplianceDashboard from "./dashboards/VendorComplianceDashboard";

const { Option } = Select;

import BranchReport from "./reports/BranchReport";
import ComplianceReport from "./reports/ComplianceReport";
import ExceptionalReport from "./reports/ExceptionalReport";
import DocumentWiseReport from "./reports/DocumentWiseReport";

import { ReportType } from "./data/reportConfig";
import BranchVendorDashboard from "./dashboards/BranchVendorDashboard";
import ExceptionalApprovalDashboard from "./dashboards/ExceptionalApprovalDashboard";

export default function ReportsDashboard() {
  const [selectedReport, setSelectedReport] = useState<ReportType>("branch");

  return (
    <div className="space-y-5">

      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Reports & Dashboard
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Dashboard analytics and report generation
          </p>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid gap-6 xl:grid-cols-[78%_22%]">

        {/* ================= Dashboard ================= */}
        <div className="relative rounded-3xl border border-blue-200 bg-white p-6 shadow-lg dark:border-blue-900 dark:bg-gray-900">

          {/* Live Badge */}
          <div className="absolute -top-3 left-6 rounded-full bg-blue-600 px-4 py-1 text-xs font-medium text-white shadow-md">
            📊 LIVE DASHBOARD
          </div>

          {selectedReport === "branch" && (
            <BranchVendorDashboard />
          )}

          {selectedReport === "compliance" && (
            <VendorComplianceDashboard />
          )}

          {selectedReport === "exception" && (
            <ExceptionalApprovalDashboard />
          )}
        </div>

        {/* ================= Sidebar ================= */}
        <div className="sticky top-6 self-start space-y-6">

          {/* Report Type */}
          <Card className="shadow-sm">
            <label className="mb-3 block text-sm font-semibold text-gray-700">
              Report Type
            </label>

            <Select
              className="w-full"
              size="large"
              value={selectedReport}
              onChange={(value) => setSelectedReport(value)}
            >
              <Option value="branch">
                Branch Wise Vendor Mapping
              </Option>

              <Option value="compliance">
                Vendor Compliance Status
              </Option>

              <Option value="exception">
                Exceptional Approval Report
              </Option>

              <Option value="document">
                Document Wise Compliance Status
              </Option>
            </Select>
          </Card>

          {/* Filters */}
          <div className="space-y-5">
            {selectedReport === "branch" && <BranchReport />}
            {selectedReport === "compliance" && <ComplianceReport />}
            {selectedReport === "exception" && <ExceptionalReport />}
            {selectedReport === "document" && <DocumentWiseReport />}
          </div>

        </div>

      </div>
    </div>
  );
}