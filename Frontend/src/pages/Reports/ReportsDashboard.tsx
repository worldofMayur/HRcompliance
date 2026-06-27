import { useState } from "react";
import { Select } from "antd";

const { Option } = Select;

import BranchReport from "./reports/BranchReport";
import ComplianceReport from "./reports/ComplianceReport";
import ExceptionalReport from "./reports/ExceptionalReport";

import { ReportType } from "./data/reportConfig";

export default function ReportsDashboard() {
  const [selectedReport, setSelectedReport] =
    useState<ReportType>("branch");

  return (
    <div className="space-y-5">

      <div className="rounded-xl border border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-900">

  <div className="flex items-end justify-between gap-6">

    <div>

      <h1 className="text-2xl font-bold">
        Reports & Dashboard
      </h1>

      <p className="mt-1 text-sm text-gray-500">
        Generate reports using the filters below.
      </p>

    </div>

    <div className="w-80">

      <label className="mb-2 block text-sm font-medium">
        Report Type
      </label>

      <Select
        className="w-full"
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

      </Select>

    </div>

  </div>

</div>

      {/* Dashboard Placeholder */}


      {/* Selected Report */}

      {selectedReport === "branch" && (
        <BranchReport />
      )}

      {selectedReport === "compliance" && (
        <ComplianceReport />
      )}

      {selectedReport === "exception" && (
        <ExceptionalReport />
      )}

    </div>
  );
}