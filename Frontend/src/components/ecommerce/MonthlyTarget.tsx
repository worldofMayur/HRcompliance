import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { useState } from "react";

import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";

import { MoreDotIcon } from "../../icons";

export default function MonthlyTarget() {

  const [isOpen, setIsOpen] = useState(false);

  // =====================================
  // COMPLIANCE SCORE
  // =====================================

  const series = [88];

  const options: ApexOptions = {

    colors: ["#22C55E"],

    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "radialBar",
      height: 450,

      sparkline: {
        enabled: true,
      },
    },

    plotOptions: {

      radialBar: {

        startAngle: -90,
        endAngle: 90,

        hollow: {
          size: "78%",
        },

        track: {
          background: "#E5E7EB",
          strokeWidth: "100%",
          margin: 8,
        },

        dataLabels: {

          name: {
            show: false,
          },

          value: {

            fontSize: "42px",

            fontWeight: "700",

            offsetY: -30,

            color: "#111827",

            formatter: function (val) {
              return `${val}%`;
            },
          },
        },
      },
    },

    fill: {
      type: "solid",
      colors: ["#22C55E"],
    },

    stroke: {
      lineCap: "round",
    },

    labels: ["Compliance"],
  };

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  return (

    <div className="rounded-2xl border border-gray-200 bg-gray-50 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">

      {/* ===================================== */}
      {/* TOP CARD */}
      {/* ===================================== */}

     <div className="rounded-2xl bg-white px-6 pt-7 pb-14 dark:bg-gray-900 sm:px-6 sm:pt-6">

        {/* HEADER */}

        <div className="flex items-start justify-between">

          <div>

            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Compliance Health Score
            </h3>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Overall HR compliance performance across audits
            </p>

          </div>

          {/* DROPDOWN */}

          <div className="relative inline-block">

            <button
              className="dropdown-toggle"
              onClick={toggleDropdown}
            >

              <MoreDotIcon className="size-6 text-gray-400 transition hover:text-gray-700 dark:hover:text-gray-300" />

            </button>

            <Dropdown
              isOpen={isOpen}
              onClose={closeDropdown}
              className="w-44 p-2"
            >

              <DropdownItem
                onItemClick={closeDropdown}
                className="flex w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
              >
                View Compliance Report
              </DropdownItem>

              <DropdownItem
                onItemClick={closeDropdown}
                className="flex w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
              >
                Export Analytics
              </DropdownItem>

            </Dropdown>

          </div>
        </div>

        {/* RADIAL CHART */}

        <div className="relative mt-2">

          <div className="max-h-[450px]">

            <Chart
              options={options}
              series={series}
              type="radialBar"
              height={450}
            />

          </div>

          {/* STATUS BADGE */}

          <span className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-[105%] rounded-full bg-green-100 px-4 py-1 text-xs font-semibold text-green-700 dark:bg-green-500/15 dark:text-green-400">

            Excellent Compliance

          </span>

        </div>

        {/* DESCRIPTION */}

        <p className="mx-auto mt-8 max-w-[420px] text-center text-sm leading-7 text-gray-500 dark:text-gray-400 sm:text-base">

          Your organization maintained a high compliance score this month with
          strong audit closure performance and reduced re-upload cases.

        </p>

      </div>

      {/* ===================================== */}
      {/* BOTTOM STATS */}
      {/* ===================================== */}

      <div className="grid grid-cols-2 gap-y-5 border-t border-gray-200 px-6 py-5 dark:border-gray-800 sm:grid-cols-4">

        {/* COMPLIED */}

        <div className="text-center">

          <p className="mb-1 text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
            Complied Audits
          </p>

          <div className="flex items-center justify-center gap-1">

            <h4 className="text-lg font-bold text-green-600 dark:text-green-400">
              318
            </h4>

            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >

              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M7.60141 2.33683C7.73885 2.18084 7.9401 2.08243 8.16435 2.08243C8.16475 2.08243 8.16516 2.08243 8.16556 2.08243C8.35773 2.08219 8.54998 2.15535 8.69664 2.30191L12.6968 6.29924C12.9898 6.59203 12.9899 7.0669 12.6971 7.3599C12.4044 7.6529 11.9295 7.65306 11.6365 7.36027L8.91435 4.64004L8.91435 13.5C8.91435 13.9142 8.57856 14.25 8.16435 14.25C7.75013 14.25 7.41435 13.9142 7.41435 13.5L7.41435 4.64442L4.69679 7.36025C4.4038 7.65305 3.92893 7.6529 3.63613 7.35992C3.34333 7.06693 3.34348 6.59206 3.63646 6.29926L7.60141 2.33683Z"
                fill="#22C55E"
              />

            </svg>

          </div>

        </div>

        {/* UNDER REVIEW */}

        <div className="text-center">

          <p className="mb-1 text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
            Under Review
          </p>

          <h4 className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
            41
          </h4>

        </div>

        {/* REUPLOAD */}

        <div className="text-center">

          <p className="mb-1 text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
            Reupload Cases
          </p>

          <div className="flex items-center justify-center gap-1">

            <h4 className="text-lg font-bold text-red-600 dark:text-red-400">
              15
            </h4>

            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >

              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M7.26816 13.6632C7.4056 13.8192 7.60686 13.9176 7.8311 13.9176C7.83148 13.9176 7.83187 13.9176 7.83226 13.9176C8.02445 13.9178 8.21671 13.8447 8.36339 13.6981L12.3635 9.70076C12.6565 9.40797 12.6567 8.9331 12.3639 8.6401C12.0711 8.34711 11.5962 8.34694 11.3032 8.63973L8.5811 11.36L8.5811 2.5C8.5811 2.08579 8.24531 1.75 7.8311 1.75C7.41688 1.75 7.0811 2.08579 7.0811 2.5L7.0811 11.3556L4.36354 8.63975C4.07055 8.34695 3.59568 8.3471 3.30288 8.64009C3.01008 8.93307 3.01023 9.40794 3.30321 9.70075L7.26816 13.6632Z"
                fill="#EF4444"
              />

            </svg>

          </div>

        </div>

        {/* EXCEPTIONAL */}

        <div className="text-center">

          <p className="mb-1 text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
            Exceptional Approvals
          </p>

          <h4 className="text-lg font-bold text-blue-600 dark:text-blue-400">
            9
          </h4>

        </div>

      </div>

    </div>
  );
}