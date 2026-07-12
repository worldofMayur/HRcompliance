import { useState } from "react";
import { Select, Card } from "antd";

const { Option } = Select;

import BranchReport from "./reports/BranchReport";
import ComplianceReport from "./reports/ComplianceReport";
import ExceptionalReport from "./reports/ExceptionalReport";
import DocumentWiseReport from "./reports/DocumentWiseReport";

import { ReportType } from "./data/reportConfig";
import BranchVendorDashboard from "./dashboards/BranchVendorDashboard";

export default function ReportsDashboard() {
  const [selectedReport, setSelectedReport] = useState<ReportType>("branch");

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Reports & Dashboard
        </h1>
        <p className="mt-1 text-gray-500">
          Dashboard analytics and report generation.
        </p>
      </div>

      {/* Main Layout - Dashboard gets more space */}
      <div className="grid gap-6 xl:grid-cols-[78%_22%]">

        {/* ==================== MAIN DASHBOARD AREA (Wider) ==================== */}
        <div className="rounded-3xl border border-blue-200 bg-white p-6 shadow-lg dark:border-blue-900 dark:bg-gray-900 min-h-[680px] relative">
          
          {/* Highlight Badge */}
          <div className="absolute -top-3 left-6 bg-blue-600 text-white text-xs font-medium px-4 py-1 rounded-full shadow-md">
            📊 LIVE DASHBOARD
          </div>

          {selectedReport === "branch" && <BranchVendorDashboard />}
        </div>

        {/* ==================== SIDEBAR (Narrower) ==================== */}
        <div className="space-y-6 sticky top-6 self-start">

          {/* Report Type Selector */}
          <Card className="shadow-sm">
            <label className="mb-3 block text-sm font-semibold text-gray-700">
              Report Type
            </label>
            <Select
              className="w-full"
              value={selectedReport}
              onChange={(value) => setSelectedReport(value)}
              size="large"
            >
              <Option value="branch">Branch Wise Vendor Mapping</Option>
              <Option value="compliance">Vendor Compliance Status</Option>
              <Option value="exception">Exceptional Approval Report</Option>
              <Option value="document">Document Wise Compliance Status</Option>
            </Select>
          </Card>

          {/* Report Filters Sidebar */}
          <Card className="shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                🔍
              </div>
              <div>
                <h3 className="font-semibold">Report Filters</h3>
                <p className="text-xs text-gray-500">Select the required filters.</p>
              </div>
            </div>

            {/* Filters will go here later */}
            <div className="space-y-4 text-sm">
              {/* You can move your actual filters here if needed */}
            </div>

            <button className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-2xl flex items-center justify-center gap-2 transition">
              🔍 Download Report
            </button>
          </Card>

          {/* Other Report Components */}
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