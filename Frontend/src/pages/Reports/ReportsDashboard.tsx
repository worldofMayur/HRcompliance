import { useState } from "react";
import {
  FileText,
  ClipboardCheck,
  ShieldCheck,
  Download,
  Search,
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";

type ReportType =
  | "branch"
  | "compliance"
  | "exception"
  | "";

import { ReactNode } from "react";

interface ReportCard {
  id: ReportType;
  title: string;
  description: string;
  icon: ReactNode;
}

const reportCards: ReportCard[] = [
  {
    id: "branch",
    title: "Branch Wise Vendor Mapping",
    description:
      "View mapped vendors branch wise along with service details.",
    icon: <FileText size={24} />,
  },
  {
    id: "compliance",
    title: "Vendor Compliance Clearance Status",
    description:
      "Track monthly compliance clearance status of vendors.",
    icon: <ClipboardCheck size={24} />,
  },
  {
    id: "exception",
    title: "Exceptional Approval Report",
    description:
      "View Exceptional Approval reports submitted by auditors.",
    icon: <ShieldCheck size={24} />,
  },
];

export default function ReportsDashboard() {
  const [selectedReport, setSelectedReport] =
    useState<ReportType>("");

  const [principalEmployer, setPrincipalEmployer] =
    useState("");

  const [state, setState] =
    useState("");

  const [branch, setBranch] =
    useState("");

  const [vendor, setVendor] =
    useState("");

  const [periodicity, setPeriodicity] =
    useState("");

  const [auditMonth, setAuditMonth] =
    useState("");

  const [tableData, setTableData] =
    useState<any[]>([]);

  const handleGenerateReport = () => {
    console.log({
      selectedReport,
      principalEmployer,
      state,
      branch,
      vendor,
      periodicity,
      auditMonth,
    });

    // Backend API Here
  };

  return (
    <div className="space-y-8">

      {/* Header */}

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Reports & Dashboard
        </h1>

        <p className="mt-2 text-gray-500">
          Generate compliance reports, monitor vendor
          activities and export reports in Excel or PDF.
        </p>

      </div>

      {/* Report Cards */}

      <div>

        <h2 className="mb-5 text-lg font-semibold">
          Available Reports
        </h2>

        <div className="grid gap-6 lg:grid-cols-3">

          {reportCards.map((report) => (

            <button
              key={report.id}
              onClick={() => setSelectedReport(report.id)}
              className={`rounded-2xl border p-6 text-left transition-all duration-300

              ${
                selectedReport === report.id
                  ? "border-brand-500 bg-brand-50 shadow-lg"
                  : "border-gray-200 bg-white hover:border-brand-400 hover:shadow-md"
              }`}
            >

              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-brand-100 text-brand-600">

                {report.icon}

              </div>

              <h3 className="text-lg font-semibold text-gray-900">

                {report.title}

              </h3>

              <p className="mt-2 text-sm text-gray-500">

                {report.description}

              </p>

            </button>

          ))}

        </div>

      </div>

      {/* Filter Section */}

      {selectedReport && (

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="mb-6 flex items-center justify-between">

            <div>

              <h2 className="text-xl font-semibold">

                Report Filters

              </h2>

              <p className="text-gray-500 text-sm">

                Select required filters and click Generate Report.

              </p>

            </div>

          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

            <div>

              <label className="mb-2 block text-sm font-medium">

                Principal Employer

              </label>

              <select
                value={principalEmployer}
                onChange={(e) =>
                  setPrincipalEmployer(e.target.value)
                }
                className="w-full rounded-xl border border-gray-300 p-3"
              >

                <option>Select Principal Employer</option>

              </select>

            </div>

            <div>

              <label className="mb-2 block text-sm font-medium">

                State

              </label>

              <select
                value={state}
                onChange={(e) =>
                  setState(e.target.value)
                }
                className="w-full rounded-xl border border-gray-300 p-3"
              >

                <option>Select State</option>

              </select>

            </div>

            <div>

              <label className="mb-2 block text-sm font-medium">

                Branch

              </label>

              <select
                value={branch}
                onChange={(e) =>
                  setBranch(e.target.value)
                }
                className="w-full rounded-xl border border-gray-300 p-3"
              >

                <option>Select Branch</option>

              </select>

            </div>
                        <div>
              <label className="mb-2 block text-sm font-medium">
                Vendor
              </label>

              <select
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                className="w-full rounded-xl border border-gray-300 p-3"
              >
                <option>Select Vendor</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Audit Periodicity
              </label>

              <select
                value={periodicity}
                onChange={(e) => setPeriodicity(e.target.value)}
                className="w-full rounded-xl border border-gray-300 p-3"
              >
                <option>Select Periodicity</option>
                <option>Monthly</option>
                <option>Quarterly</option>
                <option>Half Yearly</option>
                <option>Yearly</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Audit Month
              </label>

              <select
                value={auditMonth}
                onChange={(e) => setAuditMonth(e.target.value)}
                className="w-full rounded-xl border border-gray-300 p-3"
              >
                <option>Select Audit Month</option>

                <option>January</option>
                <option>February</option>
                <option>March</option>
                <option>April</option>
                <option>May</option>
                <option>June</option>
                <option>July</option>
                <option>August</option>
                <option>September</option>
                <option>October</option>
                <option>November</option>
                <option>December</option>
              </select>
            </div>

          </div>

          <div className="mt-8 flex flex-wrap gap-4">

            <button
              onClick={handleGenerateReport}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-white transition hover:bg-brand-700"
            >
              <Search size={18} />
              Generate Report
            </button>

            <button
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-6 py-3 transition hover:bg-gray-50"
            >
              <Download size={18} />
              Export Excel
            </button>

            <button
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-6 py-3 transition hover:bg-gray-50"
            >
              <Download size={18} />
              Export PDF
            </button>

          </div>

        </div>

      )}

            {/* ================= REPORT TABLE ================= */}

      {selectedReport && (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/[0.05] dark:bg-white/[0.03]">

          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">

            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">

                {selectedReport === "branch" &&
                  "Branch Wise Vendor Mapping"}

                {selectedReport === "compliance" &&
                  "Vendor Compliance Clearance Status"}

                {selectedReport === "exception" &&
                  "Exceptional Approval Report"}

              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Generated report will appear below.
              </p>
            </div>

          </div>

          {tableData.length === 0 ? (

            <div className="flex h-72 flex-col items-center justify-center">

              <FileText
                size={60}
                className="text-gray-300"
              />

              <h3 className="mt-5 text-xl font-semibold">

                No Report Generated

              </h3>

              <p className="mt-2 text-gray-500">

                Select filters and click Generate Report.

              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <div className="min-w-[1500px]">

                <Table>

                  <TableHeader className="border-b border-gray-200">

                    <TableRow>

                      {selectedReport === "branch" && (
                        <>

                          <TableCell
                            isHeader
                            className="px-5 py-4"
                          >
                            State
                          </TableCell>

                          <TableCell
                            isHeader
                            className="px-5 py-4"
                          >
                            Branch
                          </TableCell>

                          <TableCell
                            isHeader
                            className="px-5 py-4"
                          >
                            Vendor
                          </TableCell>

                          <TableCell
                            isHeader
                            className="px-5 py-4"
                          >
                            Nature Of Service
                          </TableCell>

                          <TableCell
                            isHeader
                            className="px-5 py-4"
                          >
                            Agreement From
                          </TableCell>

                          <TableCell
                            isHeader
                            className="px-5 py-4"
                          >
                            Agreement To
                          </TableCell>

                          <TableCell
                            isHeader
                            className="px-5 py-4"
                          >
                            Contact Person
                          </TableCell>

                          <TableCell
                            isHeader
                            className="px-5 py-4"
                          >
                            Mobile
                          </TableCell>

                          <TableCell
                            isHeader
                            className="px-5 py-4"
                          >
                            Email
                          </TableCell>

                        </>
                      )}

                      {selectedReport === "compliance" && (
                        <>

                          <TableCell isHeader className="px-5 py-4">
                            State
                          </TableCell>

                          <TableCell isHeader className="px-5 py-4">
                            Branch
                          </TableCell>

                          <TableCell isHeader className="px-5 py-4">
                            Vendor
                          </TableCell>

                          <TableCell isHeader className="px-5 py-4">
                            Audit Month
                          </TableCell>

                          <TableCell isHeader className="px-5 py-4">
                            Status
                          </TableCell>

                          <TableCell isHeader className="px-5 py-4">
                            Clearance Date
                          </TableCell>

                        </>
                      )}

                      {selectedReport === "exception" && (
                        <>

                          <TableCell isHeader className="px-5 py-4">
                            State
                          </TableCell>

                          <TableCell isHeader className="px-5 py-4">
                            Branch
                          </TableCell>

                          <TableCell isHeader className="px-5 py-4">
                            Vendor
                          </TableCell>

                          <TableCell isHeader className="px-5 py-4">
                            Document
                          </TableCell>

                          <TableCell isHeader className="px-5 py-4">
                            Observation
                          </TableCell>

                          <TableCell isHeader className="px-5 py-4">
                            Recommendation
                          </TableCell>

                          <TableCell isHeader className="px-5 py-4">
                            Approval Status
                          </TableCell>

                        </>
                      )}

                    </TableRow>

                  </TableHeader>

                  <TableBody>

                    {tableData.map((row: any, index) => (

                      <TableRow key={index}>
                                              {selectedReport === "branch" && (
                        <>
                          <TableCell className="px-5 py-4">
                            {row.state}
                          </TableCell>

                          <TableCell className="px-5 py-4">
                            {row.branch}
                          </TableCell>

                          <TableCell className="px-5 py-4">
                            {row.vendor}
                          </TableCell>

                          <TableCell className="px-5 py-4">
                            {row.service}
                          </TableCell>

                          <TableCell className="px-5 py-4">
                            {row.agreement_from}
                          </TableCell>

                          <TableCell className="px-5 py-4">
                            {row.agreement_to}
                          </TableCell>

                          <TableCell className="px-5 py-4">
                            {row.contact_person}
                          </TableCell>

                          <TableCell className="px-5 py-4">
                            {row.mobile}
                          </TableCell>

                          <TableCell className="px-5 py-4">
                            {row.email}
                          </TableCell>
                        </>
                      )}

                      {selectedReport === "compliance" && (
                        <>
                          <TableCell className="px-5 py-4">
                            {row.state}
                          </TableCell>

                          <TableCell className="px-5 py-4">
                            {row.branch}
                          </TableCell>

                          <TableCell className="px-5 py-4">
                            {row.vendor}
                          </TableCell>

                          <TableCell className="px-5 py-4">
                            {row.audit_month}
                          </TableCell>

                          <TableCell className="px-5 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium
                                ${
                                  row.status === "Clear"
                                    ? "bg-green-100 text-green-700"
                                    : row.status === "Pending"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                            >
                              {row.status}
                            </span>
                          </TableCell>

                          <TableCell className="px-5 py-4">
                            {row.clearance_date}
                          </TableCell>
                        </>
                      )}

                      {selectedReport === "exception" && (
                        <>
                          <TableCell className="px-5 py-4">
                            {row.state}
                          </TableCell>

                          <TableCell className="px-5 py-4">
                            {row.branch}
                          </TableCell>

                          <TableCell className="px-5 py-4">
                            {row.vendor}
                          </TableCell>

                          <TableCell className="px-5 py-4">
                            {row.document}
                          </TableCell>

                          <TableCell className="px-5 py-4">
                            {row.observation}
                          </TableCell>

                          <TableCell className="px-5 py-4">
                            {row.recommendation}
                          </TableCell>

                          <TableCell className="px-5 py-4">
                            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                              {row.approval_status}
                            </span>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
            </div>
          </div>

        )}

      </div>

    </div>
  );
}
