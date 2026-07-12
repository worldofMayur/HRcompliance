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
      height: 320,

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
        dataPointSelection: (_event, chartContext) => {
          // Prevent slice staying selected
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

        customScale: 1.05,

        offsetY: -8,

        dataLabels: {
          offset: -2,
        },
      },
    },

    dataLabels: {
      enabled: true,

      formatter: (val: number) => `${val.toFixed(1)}%`,

      style: {
        fontSize: "15px",
        fontWeight: "bold",
        colors: ["#fff"],
      },

      dropShadow: {
        enabled: false,
      },
    },

    legend: {
      position: "bottom",

      horizontalAlign: "center",

      floating: false,

      fontSize: "13px",

      fontWeight: 500,

      itemMargin: {
        horizontal: 12,
        vertical: 6,
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

        return `${seriesName} • ${value} (${percent}%)`;
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
          chart: {
            height: 300,
          },

          legend: {
            position: "bottom",
          },

          plotOptions: {
            pie: {
              customScale: 1,
            },
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
      height={300}
    />
  );
}