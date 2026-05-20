import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import {
  MoreDotIcon,
} from "../../icons";

import { useState } from "react";

export default function MonthlySalesChart() {

  const [isOpen, setIsOpen] = useState(false);

  // =====================================
  // CHART OPTIONS
  // =====================================

  const options: ApexOptions = {

    colors: ["#465FFF"],

    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 260,

      toolbar: {
        show: false,
      },
    },

    plotOptions: {

      bar: {
        horizontal: false,
        columnWidth: "42%",
        borderRadius: 8,
        borderRadiusApplication: "end",
      },
    },

    dataLabels: {
      enabled: false,
    },

    stroke: {
      show: true,
      width: 4,
      colors: ["transparent"],
    },

    xaxis: {

      categories: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],

      axisBorder: {
        show: false,
      },

      axisTicks: {
        show: false,
      },

      labels: {
        style: {
          colors: "#6B7280",
          fontSize: "12px",
        },
      },
    },

    yaxis: {

      labels: {
        style: {
          colors: "#6B7280",
          fontSize: "12px",
        },
      },

      title: {
        text: undefined,
      },
    },

    legend: {
      show: false,
    },

    grid: {

      borderColor: "#E5E7EB",

      yaxis: {
        lines: {
          show: true,
        },
      },

      xaxis: {
        lines: {
          show: false,
        },
      },
    },

    fill: {
      opacity: 1,
    },

    tooltip: {

      theme: "light",

      x: {
        show: true,
      },

      y: {

        formatter: (val: number) =>
          `${val} Audits`,
      },
    },
  };

  // =====================================
  // MONTHLY HR COMPLIANCE DATA
  // =====================================

  const series = [

    {
      name: "Completed Audits",

      data: [
        18,
        25,
        20,
        31,
        28,
        35,
        40,
        26,
        38,
        44,
        39,
        30,
      ],
    },
  ];

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  return (

    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">

      {/* ===================================== */}
      {/* HEADER */}
      {/* ===================================== */}

      <div className="flex items-center justify-between">

        <div>

          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Monthly Compliance Audits
          </h3>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Audit completion trend across all branches
          </p>

        </div>

        {/* DROPDOWN */}

        <div className="relative inline-block">

          <button
            className="dropdown-toggle"
            onClick={toggleDropdown}
          >

            <MoreDotIcon className="text-gray-400 transition hover:text-gray-700 dark:hover:text-gray-300 size-6" />

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
              View Audit Analytics
            </DropdownItem>

            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
            >
              Export Report
            </DropdownItem>

          </Dropdown>

        </div>
      </div>

      {/* ===================================== */}
      {/* STATS */}
      {/* ===================================== */}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">

        <div className="rounded-xl bg-blue-50 px-4 py-3 dark:bg-blue-500/10">

          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Total Audits
          </p>

          <h4 className="mt-1 text-xl font-bold text-blue-600 dark:text-blue-400">
            374
          </h4>

        </div>

        <div className="rounded-xl bg-green-50 px-4 py-3 dark:bg-green-500/10">

          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Complied
          </p>

          <h4 className="mt-1 text-xl font-bold text-green-600 dark:text-green-400">
            318
          </h4>

        </div>

        <div className="rounded-xl bg-yellow-50 px-4 py-3 dark:bg-yellow-500/10">

          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Under Review
          </p>

          <h4 className="mt-1 text-xl font-bold text-yellow-600 dark:text-yellow-400">
            41
          </h4>

        </div>

        <div className="rounded-xl bg-red-50 px-4 py-3 dark:bg-red-500/10">

          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Reupload Cases
          </p>

          <h4 className="mt-1 text-xl font-bold text-red-600 dark:text-red-400">
            15
          </h4>

        </div>

      </div>

      {/* ===================================== */}
      {/* CHART */}
      {/* ===================================== */}

      <div className="max-w-full overflow-x-auto custom-scrollbar mt-6">

        <div className="-ml-4 min-w-[700px] xl:min-w-full pl-2">

          <Chart
            options={options}
            series={series}
            type="bar"
            height={260}
          />

        </div>

      </div>

    </div>
  );
}