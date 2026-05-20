import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

import ChartTab from "../common/ChartTab";

export default function StatisticsChart() {

  // =====================================
  // CHART OPTIONS
  // =====================================

  const options: ApexOptions = {

    legend: {

      show: true,

      position: "top",

      horizontalAlign: "left",

      fontSize: "13px",

      labels: {
        colors: "#6B7280",
      },
    },

    colors: [
      "#22C55E",
      "#EF4444",
      "#465FFF",
    ],

    chart: {

      fontFamily: "Outfit, sans-serif",

      height: 350,

      type: "area",

      toolbar: {
        show: false,
      },
    },

    stroke: {

      curve: "smooth",

      width: [3, 3, 3],
    },

    fill: {

      type: "gradient",

      gradient: {

        shadeIntensity: 1,

        opacityFrom: 0.35,

        opacityTo: 0.02,

        stops: [0, 90, 100],
      },
    },

    markers: {

      size: 4,

      strokeColors: "#fff",

      strokeWidth: 2,

      hover: {
        size: 7,
      },
    },

    grid: {

      borderColor: "#E5E7EB",

      xaxis: {
        lines: {
          show: false,
        },
      },

      yaxis: {
        lines: {
          show: true,
        },
      },
    },

    dataLabels: {
      enabled: false,
    },

    tooltip: {

      enabled: true,

      shared: true,

      intersect: false,
    },

    xaxis: {

      type: "category",

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
          fontSize: "12px",
          colors: "#6B7280",
        },
      },
    },

    yaxis: {

      labels: {

        style: {
          fontSize: "12px",
          colors: ["#6B7280"],
        },
      },

      title: {
        text: "",
      },
    },
  };

  // =====================================
  // HR COMPLIANCE ANALYTICS
  // =====================================

  const series = [

    {
      name: "Complied Audits",

      data: [
        85,
        92,
        88,
        95,
        101,
        98,
        110,
        118,
        121,
        129,
        136,
        142,
      ],
    },

    {
      name: "Reupload Cases",

      data: [
        24,
        21,
        26,
        19,
        18,
        15,
        14,
        12,
        11,
        9,
        7,
        6,
      ],
    },

    {
      name: "Exceptional Approvals",

      data: [
        5,
        7,
        6,
        8,
        9,
        8,
        10,
        11,
        9,
        8,
        7,
        6,
      ],
    },
  ];

  return (

    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">

      {/* ===================================== */}
      {/* HEADER */}
      {/* ===================================== */}

      <div className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

        {/* LEFT */}

        <div className="w-full">

          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Compliance Analytics
          </h3>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Overall audit performance, reupload trends and exceptional approvals
          </p>

        </div>

        {/* RIGHT */}

        <div className="flex w-full items-start gap-3 sm:justify-end">

          <ChartTab />

        </div>

      </div>

      {/* ===================================== */}
      {/* TOP SUMMARY CARDS */}
      {/* ===================================== */}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

        {/* CARD 1 */}

        <div className="rounded-xl border border-green-100 bg-green-50 p-4 dark:border-green-500/20 dark:bg-green-500/10">

          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Total Compliance Rate
          </p>

          <div className="mt-2 flex items-end justify-between">

            <h4 className="text-2xl font-bold text-green-600 dark:text-green-400">
              88%
            </h4>

            <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700 dark:bg-green-500/20 dark:text-green-400">
              +12%
            </span>

          </div>

        </div>

        {/* CARD 2 */}

        <div className="rounded-xl border border-red-100 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/10">

          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Reupload Reduction
          </p>

          <div className="mt-2 flex items-end justify-between">

            <h4 className="text-2xl font-bold text-red-600 dark:text-red-400">
              -38%
            </h4>

            <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700 dark:bg-red-500/20 dark:text-red-400">
              Improved
            </span>

          </div>

        </div>

        {/* CARD 3 */}

        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-500/20 dark:bg-blue-500/10">

          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Average Audit Closure
          </p>

          <div className="mt-2 flex items-end justify-between">

            <h4 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              4.2 Days
            </h4>

            <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
              Faster
            </span>

          </div>

        </div>

      </div>

      {/* ===================================== */}
      {/* CHART */}
      {/* ===================================== */}

      <div className="max-w-full overflow-x-auto custom-scrollbar">

        <div className="min-w-[1000px] xl:min-w-full">

          <Chart
            options={options}
            series={series}
            type="area"
            height={350}
          />

        </div>

      </div>

      {/* ===================================== */}
      {/* FOOTER INSIGHTS */}
      {/* ===================================== */}

      <div className="mt-6 grid grid-cols-1 gap-4 border-t border-gray-200 pt-5 dark:border-gray-800 sm:grid-cols-3">

        {/* INSIGHT 1 */}

        <div>

          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Best Performing State
          </p>

          <h4 className="mt-2 text-lg font-semibold text-gray-800 dark:text-white/90">
            Maharashtra
          </h4>

          <p className="mt-1 text-sm text-gray-500">
            Highest compliance closure ratio this quarter
          </p>

        </div>

        {/* INSIGHT 2 */}

        <div>

          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Highest Risk Area
          </p>

          <h4 className="mt-2 text-lg font-semibold text-gray-800 dark:text-white/90">
            PF Documentation
          </h4>

          <p className="mt-1 text-sm text-gray-500">
            Maximum reupload observations identified
          </p>

        </div>

        {/* INSIGHT 3 */}

        <div>

          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Audit Trend
          </p>

          <h4 className="mt-2 text-lg font-semibold text-gray-800 dark:text-white/90">
            Positive Growth
          </h4>

          <p className="mt-1 text-sm text-gray-500">
            Compliance performance improving month over month
          </p>

        </div>

      </div>

    </div>
  );
}