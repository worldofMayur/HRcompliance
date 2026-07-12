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
      type: "donut",
      toolbar: {
        show: false,
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
    ],

    stroke: {
      width: 3,
      colors: ["#fff"],
    },

    states: {
      hover: {
        filter: {
          type: "lighten",
          value: 0.08,
        },
      },
      active: {
        filter: {
          type: "none",
        },
      },
    },

    plotOptions: {
      pie: {
        expandOnClick: false,

        donut: {
          size: "68%",

          labels: {
            show: true,

            total: {
              show: true,
              label: "Total",
              formatter: () => totalVendors.toString(),
            },

            value: {
              show: true,
              fontSize: "24px",
              fontWeight: 700,
            },
          },
        },
      },
    },

    dataLabels: {
      enabled: true,

      formatter: (val) => `${val.toFixed(1)}%`,

      style: {
        fontSize: "14px",
        fontWeight: 700,
      },
    },

    legend: {
      position: "bottom",

      fontSize: "13px",

      itemMargin: {
        horizontal: 8,
        vertical: 6,
      },

      formatter: (seriesName, opts) => {
        const value =
          data[opts.seriesIndex]?.vendors || 0;

        const percent =
          totalVendors === 0
            ? 0
            : ((value / totalVendors) * 100).toFixed(1);

        return `${seriesName} • ${value} (${percent}%)`;
      },
    },

    tooltip: {
      y: {
        formatter: (val) => {
          const percent =
            totalVendors === 0
              ? 0
              : ((val / totalVendors) * 100).toFixed(1);

          return `${val} Vendors (${percent}%)`;
        },
      },
    },
  };

  return (
    <ReactApexChart
      options={options}
      series={data.map((d) => d.vendors)}
      type="donut"
      height={315}
    />
  );
}