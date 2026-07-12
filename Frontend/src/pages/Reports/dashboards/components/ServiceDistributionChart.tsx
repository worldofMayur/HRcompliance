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
  const options = {
    chart: {
      type: "donut",
      toolbar: {
        show: false,
      },
    },

    labels: data.map((item) => item.service),

    legend: {
      position: "right" as const,
      fontSize: "13px",
    },

    dataLabels: {
      enabled: true,
    },

    tooltip: {
      y: {
        formatter: (value: number) => `${value} Vendors`,
      },
    },

    plotOptions: {
      pie: {
        donut: {
          size: "65%",
          labels: {
            show: true,

            total: {
              show: true,
              label: "Total Vendors",

              formatter: () =>
                data
                  .reduce(
                    (sum, item) => sum + item.vendors,
                    0
                  )
                  .toString(),
            },
          },
        },
      },
    },

    responsive: [
      {
        breakpoint: 768,
        options: {
          legend: {
            position: "bottom" as const,
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
      type="donut"
      height={340}
    />
  );
}