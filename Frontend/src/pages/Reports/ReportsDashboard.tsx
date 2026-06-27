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
    <div className="space-y-5">

      {/* Header */}

      <div className="rounded-xl border border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-900">

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">

          Reports & Dashboard

        </h1>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">

          Dashboard KPIs will be added here later.
          Select a report below to generate reports.

        </p>

      </div>

      {/* Dashboard Placeholder */}

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