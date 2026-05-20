import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";

import Badge from "../ui/badge/Badge";

// =====================================
// TYPES
// =====================================

interface AuditRecord {

  id: number;

  vendor: string;

  branch: string;

  auditPeriod: string;

  auditor: string;

  status:
    | "Complied"
    | "Under Review"
    | "Reupload Required"
    | "Exceptional Approval";

  progress: number;
}

// =====================================
// TABLE DATA
// =====================================

const tableData: AuditRecord[] = [

  {
    id: 1,

    vendor: "TCS Facility Management",

    branch: "Mumbai HO",

    auditPeriod: "Apr-2026",

    auditor: "Rahul Sharma",

    status: "Complied",

    progress: 100,
  },

  {
    id: 2,

    vendor: "Infosys Security Services",

    branch: "Bangalore Tech Park",

    auditPeriod: "Apr-2026",

    auditor: "Sneha Verma",

    status: "Under Review",

    progress: 72,
  },

  {
    id: 3,

    vendor: "Wipro Housekeeping",

    branch: "Delhi NCR",

    auditPeriod: "Apr-2026",

    auditor: "Amit Kulkarni",

    status: "Reupload Required",

    progress: 45,
  },

  {
    id: 4,

    vendor: "HCL Payroll Solutions",

    branch: "Hyderabad Branch",

    auditPeriod: "Apr-2026",

    auditor: "Priya Nair",

    status: "Exceptional Approval",

    progress: 90,
  },

  {
    id: 5,

    vendor: "Tech Mahindra Support",

    branch: "Pune Campus",

    auditPeriod: "Apr-2026",

    auditor: "Karan Mehta",

    status: "Complied",

    progress: 100,
  },
];

export default function RecentOrders() {

  return (

    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-4 pt-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">

      {/* ===================================== */}
      {/* HEADER */}
      {/* ===================================== */}

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        {/* LEFT */}

        <div>

          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Recent Compliance Audits
          </h3>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Latest vendor audit activities and compliance review status
          </p>

        </div>

        {/* RIGHT BUTTONS */}

        <div className="flex items-center gap-3">

          {/* FILTER */}

          <button className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">

            <svg
              className="stroke-current fill-white dark:fill-gray-800"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
            >

              <path
                d="M2.29004 5.90393H17.7067"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <path
                d="M17.7075 14.0961H2.29085"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <path
                d="M12.0826 3.33331C13.5024 3.33331 14.6534 4.48431 14.6534 5.90414C14.6534 7.32398 13.5024 8.47498 12.0826 8.47498C10.6627 8.47498 9.51172 7.32398 9.51172 5.90415C9.51172 4.48432 10.6627 3.33331 12.0826 3.33331Z"
                strokeWidth="1.5"
              />

              <path
                d="M7.91745 11.525C6.49762 11.525 5.34662 12.676 5.34662 14.0959C5.34661 15.5157 6.49762 16.6667 7.91745 16.6667C9.33728 16.6667 10.4883 15.5157 10.4883 14.0959C10.4883 12.676 9.33728 11.525 7.91745 11.525Z"
                strokeWidth="1.5"
              />

            </svg>

            Filter

          </button>

          {/* VIEW ALL */}

          <button className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">

            View All

          </button>

        </div>

      </div>

      {/* ===================================== */}
      {/* TABLE */}
      {/* ===================================== */}

      <div className="max-w-full overflow-x-auto custom-scrollbar">

        <Table>

          {/* HEADER */}

          <TableHeader className="border-y border-gray-100 dark:border-gray-800">

            <TableRow>

              <TableCell
                isHeader
                className="py-3 text-start text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
              >
                Vendor
              </TableCell>

              <TableCell
                isHeader
                className="py-3 text-start text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
              >
                Branch
              </TableCell>

              <TableCell
                isHeader
                className="py-3 text-start text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
              >
                Audit Period
              </TableCell>

              <TableCell
                isHeader
                className="py-3 text-start text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
              >
                Auditor
              </TableCell>

              <TableCell
                isHeader
                className="py-3 text-start text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
              >
                Progress
              </TableCell>

              <TableCell
                isHeader
                className="py-3 text-start text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
              >
                Status
              </TableCell>

            </TableRow>

          </TableHeader>

          {/* BODY */}

          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">

            {tableData.map((audit) => (

              <TableRow
                key={audit.id}
                className="transition hover:bg-gray-50 dark:hover:bg-white/[0.02]"
              >

                {/* VENDOR */}

                <TableCell className="py-4">

                  <div>

                    <p className="font-semibold text-gray-800 text-sm dark:text-white/90">
                      {audit.vendor}
                    </p>

                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Vendor ID #{audit.id}
                    </span>

                  </div>

                </TableCell>

                {/* BRANCH */}

                <TableCell className="py-4 text-sm text-gray-600 dark:text-gray-300">

                  {audit.branch}

                </TableCell>

                {/* PERIOD */}

                <TableCell className="py-4 text-sm text-gray-600 dark:text-gray-300">

                  {audit.auditPeriod}

                </TableCell>

                {/* AUDITOR */}

                <TableCell className="py-4 text-sm text-gray-600 dark:text-gray-300">

                  {audit.auditor}

                </TableCell>

                {/* PROGRESS */}

                <TableCell className="py-4">

                  <div className="flex items-center gap-3">

                    <div className="relative h-2 w-full max-w-[100px] rounded-full bg-gray-200 dark:bg-gray-800">

                      <div
                        className={`absolute left-0 top-0 h-full rounded-full ${
                          audit.progress >= 90
                            ? "bg-green-500"
                            : audit.progress >= 70
                            ? "bg-blue-500"
                            : "bg-red-500"
                        }`}
                        style={{
                          width: `${audit.progress}%`,
                        }}
                      ></div>

                    </div>

                    <span className="min-w-[36px] text-xs font-semibold text-gray-700 dark:text-gray-300">

                      {audit.progress}%

                    </span>

                  </div>

                </TableCell>

                {/* STATUS */}

                <TableCell className="py-4">

                  <Badge
                    size="sm"
                    color={
                      audit.status === "Complied"
                        ? "success"
                        : audit.status === "Under Review"
                        ? "warning"
                        : audit.status === "Exceptional Approval"
                        ? "info"
                        : "error"
                    }
                  >

                    {audit.status}

                  </Badge>

                </TableCell>

              </TableRow>

            ))}

          </TableBody>

        </Table>

      </div>

      {/* ===================================== */}
      {/* FOOTER */}
      {/* ===================================== */}

      <div className="mt-5 flex flex-col gap-3 border-t border-gray-200 pt-5 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">

        <p className="text-sm text-gray-500 dark:text-gray-400">

          Showing latest vendor compliance audit activities

        </p>

        <div className="flex items-center gap-4">

          <div className="flex items-center gap-2">

            <span className="h-2.5 w-2.5 rounded-full bg-green-500"></span>

            <span className="text-xs text-gray-500 dark:text-gray-400">
              Complied
            </span>

          </div>

          <div className="flex items-center gap-2">

            <span className="h-2.5 w-2.5 rounded-full bg-yellow-500"></span>

            <span className="text-xs text-gray-500 dark:text-gray-400">
              Under Review
            </span>

          </div>

          <div className="flex items-center gap-2">

            <span className="h-2.5 w-2.5 rounded-full bg-red-500"></span>

            <span className="text-xs text-gray-500 dark:text-gray-400">
              Reupload
            </span>

          </div>

        </div>

      </div>

    </div>
  );
}