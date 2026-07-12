import React from "react";
import ReactApexChart from "react-apexcharts";

interface ServiceDistribution {
  service: string;
  vendors: number;
}

interface Props {
  data: ServiceDistribution[];
}

export default function ServiceDistributionChart({ data }: Props) {
  const totalVendors = data.reduce(
    (sum, item) => sum + item.vendors,
    0
  );

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "pie",
      toolbar: {
        show: false,
      },
      animations: {
        enabled: true,
      },
      selection: {
        enabled: false,
      },
      events: {
        dataPointSelection: (event, chartContext) => {
          // Remove selection immediately
          chartContext.toggleDataPointSelection(-1);
        },
      },
    },

    labels: data.map((item) => item.service),

    colors: [
      "#1677ff",
      "#52c41a",
      "#faad14",
      "#f5222d",
      "#722ed1",
      "#13c2c2",
      "#eb2f96",
      "#fa8c16",
      "#2f54eb",
      "#a0d911",
    ],

    stroke: {
      width: 2,
      colors: ["#ffffff"],
    },

    states: {
      active: {
        allowMultipleDataPointsSelection: false,
        filter: {
          type: "none",
        },
      },
      hover: {
        filter: {
          type: "lighten",
          value: 0.08,
        },
      },
    },

    plotOptions: {
      pie: {
        expandOnClick: false,

        offsetY: 0,

        dataLabels: {
          offset: 0,
        },
      },
    },

    dataLabels: {
      enabled: true,

      formatter: (val: number) => `${val.toFixed(1)}%`,

      style: {
        fontSize: "14px",
        fontWeight: "bold",
        colors: ["#fff"],
      },

      dropShadow: {
        enabled: false,
      },
    },

    legend: {
    position: "right",

    horizontalAlign: "center",

    fontSize: "13px",

    fontWeight: 500,

    itemMargin: {
        horizontal: 8,
        vertical: 4,
    },

      formatter: (seriesName, opts) => {
        const value =
          data[opts.seriesIndex]?.vendors || 0;

        const percent =
          totalVendors > 0
            ? (
                (value / totalVendors) *
                100
              ).toFixed(1)
            : "0";

        return `${seriesName} • ${value} Vendors (${percent}%)`;
      },
    },

    tooltip: {
      theme: "light",

      y: {
        formatter: (val: number) => {
          const percent =
            totalVendors > 0
              ? (
                  (val / totalVendors) *
                  100
                ).toFixed(1)
              : "0";

          return `${val} Vendors (${percent}%)`;
        },
      },
    },

    responsive: [
      {
        breakpoint: 768,

        options: {
          legend: {
            position: "bottom",
          },
        },
      },
    ],
  };

  const series = data.map((item) => item.vendors);

  return (
    <ReactApexChart
      options={options}
      series={series}
      type="pie"
      height={280}
    />
  );
}