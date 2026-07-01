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

      {/* Header */}

      <div className="rounded-xl border border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-900">

        <h1 className="text-2xl font-bold">
          Reports & Dashboard
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Dashboard analytics and report generation.
        </p>

      </div>

      {/* Main Layout */}

      <div className="grid gap-5 xl:grid-cols-[75%_25%]">

        {/* Dashboard */}

        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 dark:border-gray-700 dark:bg-gray-900 min-h-[900px]">

          <h2 className="text-xl font-semibold">
            Dashboard
          </h2>

          <p className="mt-2 text-gray-500">
            KPI Cards, Charts, Compliance Trend,
            Monthly Statistics and Analytics
            will be displayed here.
          </p>

        </div>

        {/* Sidebar */}

        <div className="sticky top-6 self-start">

          {/* Report Type */}

          <div className="mb-5 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">

            <label className="mb-2 block text-sm font-medium">
              Report Type
            </label>

            <Select
              className="w-full"
              value={selectedReport}
              onChange={(value) =>
                setSelectedReport(value)
              }
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

          {/* Report */}

          {/* <div className="space-y-5">

            {selectedReport === "branch" && (
              <BranchReport />
            )}

            {selectedReport === "compliance" && (
              <ComplianceReport />
            )}

            {selectedReport === "exception" && (
              <ExceptionalReport />
            )}

          </div> */}

        </div>

      </div>

    </div>
  );
}