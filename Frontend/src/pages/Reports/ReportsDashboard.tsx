import { useState } from "react";
import { Select, Card } from "antd";
import VendorComplianceDashboard from "./dashboards/VendorComplianceDashboard";
import BranchVendorDashboard from "./dashboards/BranchVendorDashboard";
import ExceptionalApprovalDashboard from "./dashboards/ExceptionalApprovalDashboard";
import DocumentWiseComplianceDashboard from "./dashboards/DocumentWiseComplianceDashboard";

import BranchReport from "./reports/BranchReport";
import ComplianceReport from "./reports/ComplianceReport";
import ExceptionalReport from "./reports/ExceptionalReport";
import DocumentWiseReport from "./reports/DocumentWiseReport";

import { ReportType } from "./data/reportConfig";

const { Option } = Select;

export default function ReportsDashboard() {
  const [selectedReport, setSelectedReport] = useState<ReportType>("compliance");

  return (
    <div className="space-y-6">

      {/* Main Layout */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* ================= LEFT: Live Dashboard ================= */}
        <div className="relative min-w-0">
          {/* Live Badge */}
          <div className="absolute -top-3 left-6 z-10 rounded-full bg-blue-600 px-4 py-1 text-xs font-semibold text-white shadow-md">
            📊 LIVE DASHBOARD
          </div>

          <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm dark:border-blue-900/50 dark:bg-gray-900">
            {selectedReport === "branch" && <BranchVendorDashboard />}
            {selectedReport === "compliance" && <VendorComplianceDashboard />}
            {selectedReport === "exception" && <ExceptionalApprovalDashboard />}
            {selectedReport === "document" && <DocumentWiseComplianceDashboard />}
          </div>
        </div>

        {/* ================= RIGHT: Sidebar ================= */}
        <div className="space-y-5 xl:sticky xl:top-6 xl:self-start">
          {/* Report Type */}
          <Card
            className="shadow-sm"
            styles={{ body: { padding: "16px 18px" } }}
          >
            <label className="mb-2.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">
              Report Type
            </label>

            <Select
              className="w-full"
              size="large"
              value={selectedReport}
              onChange={(value) => setSelectedReport(value)}
            >
              <Option value="branch">Branch Wise Vendor Mapping</Option>
              <Option value="compliance">Vendor Compliance Status</Option>
              <Option value="exception">Exceptional Approval Report</Option>
              <Option value="document">Document Wise Compliance Status</Option>
            </Select>
          </Card>

          {/* Report Filters + Download */}
          <div className="space-y-4">
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