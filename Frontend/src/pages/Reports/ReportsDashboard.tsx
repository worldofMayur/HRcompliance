import { useState } from "react";

import ReportCards from "./components/ReportCards";

import BranchReport from "./reports/BranchReport";
import ComplianceReport from "./reports/ComplianceReport";
import ExceptionalReport from "./reports/ExceptionalReport";

import { ReportType } from "./data/reportConfig";

export default function ReportsDashboard() {
  const [selectedReport, setSelectedReport] =
    useState<ReportType>("branch");

  return (
    <div className="space-y-8">

      {/* Header */}

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">

          Reports & Dashboard

        </h1>

        <p className="mt-2 text-gray-500 dark:text-gray-400">

          Dashboard KPIs will be added here later.
          Select a report below to generate reports.

        </p>

      </div>

      {/* Dashboard Placeholder */}

      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800">

        <h2 className="text-lg font-semibold">

          Dashboard (Coming Soon)

        </h2>

        <p className="mt-2 text-gray-500">

          Total Vendors, Pending Audits, Completed Audits,
          Compliance %, Monthly Trends etc.

        </p>

      </div>

      {/* Report Cards */}

      <ReportCards
        selectedReport={selectedReport}
        onSelect={setSelectedReport}
      />

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