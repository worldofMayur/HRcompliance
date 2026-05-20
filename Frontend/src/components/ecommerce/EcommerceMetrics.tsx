import {
  ArrowDownIcon,
  ArrowUpIcon,
  BoxIconLine,
  GroupIcon,
} from "../../icons";

import Badge from "../ui/badge/Badge";

export default function EcommerceMetrics() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">

      {/* ===================================== */}
      {/* TOTAL VENDORS */}
      {/* ===================================== */}

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-white/[0.03] md:p-6">

        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10">

          <GroupIcon className="text-blue-600 size-6 dark:text-blue-400" />

        </div>

        <div className="flex items-end justify-between mt-5">

          <div>

            <span className="text-sm text-gray-500 dark:text-gray-400">
              Total Vendors
            </span>

            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              128
            </h4>

          </div>

          <Badge color="success">

            <ArrowUpIcon />

            12.5%

          </Badge>

        </div>

      </div>

      {/* ===================================== */}
      {/* ACTIVE AUDITS */}
      {/* ===================================== */}

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-white/[0.03] md:p-6">

        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-500/10">

          <BoxIconLine className="text-orange-600 size-6 dark:text-orange-400" />

        </div>

        <div className="flex items-end justify-between mt-5">

          <div>

            <span className="text-sm text-gray-500 dark:text-gray-400">
              Active Audits
            </span>

            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              42
            </h4>

          </div>

          <Badge color="warning">

            <ArrowUpIcon />

            8.2%

          </Badge>

        </div>

      </div>

      {/* ===================================== */}
      {/* COMPLIED AUDITS */}
      {/* ===================================== */}

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-white/[0.03] md:p-6">

        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-green-50 dark:bg-green-500/10">

          <GroupIcon className="text-green-600 size-6 dark:text-green-400" />

        </div>

        <div className="flex items-end justify-between mt-5">

          <div>

            <span className="text-sm text-gray-500 dark:text-gray-400">
              Complied Audits
            </span>

            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              96
            </h4>

          </div>

          <Badge color="success">

            <ArrowUpIcon />

            18.4%

          </Badge>

        </div>

      </div>

      {/* ===================================== */}
      {/* REUPLOAD REQUIRED */}
      {/* ===================================== */}

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-white/[0.03] md:p-6">

        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-red-50 dark:bg-red-500/10">

          <BoxIconLine className="text-red-600 size-6 dark:text-red-400" />

        </div>

        <div className="flex items-end justify-between mt-5">

          <div>

            <span className="text-sm text-gray-500 dark:text-gray-400">
              Reupload Required
            </span>

            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              11
            </h4>

          </div>

          <Badge color="error">

            <ArrowDownIcon />

            3.1%

          </Badge>

        </div>

      </div>

    </div>
  );
}