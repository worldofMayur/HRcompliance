import React from "react";
import ReactApexChart from "react-apexcharts";

interface Props {
  data: Record<string, number>;
}

export default function CompliancePieChart({
  data,
}: Props) {
  const labels = [
    "CC Issued",
    "Exceptional CC",
    "Under Audit",
    "Document Not Submitted",
  ];

  const values = [
    data.ccIssued ?? 0,
    data.exceptionalCC ?? 0,
    data.underAudit ?? 0,
    data.documentNotSubmitted ?? 0,
  ];

  const total = values.reduce((sum, value) => sum + value, 0);

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "donut",
      height: 420,
      toolbar: {
        show: false,
      },
    },

    labels,

    colors: [
      "#1677ff",
      "#722ed1",
      "#fa8c16",
      "#f5222d",
    ],

    plotOptions: {
      pie: {
        expandOnClick: true,
        donut: {
          size: "68%",

          labels: {
            show: true,

            name: {
              show: true,
              fontSize: "16px",
              fontWeight: 600,
            },

            value: {
              show: true,
              fontSize: "24px",
              fontWeight: 700,
            },

            total: {
              show: true,
              showAlways: true,
              label: "Total",

              formatter: () => {
                return total.toString();
              },
            },
          },
        },
      },
    },

    legend: {
      position: "bottom",
      fontSize: "14px",
      fontWeight: 600,
      itemMargin: {
        horizontal: 14,
        vertical: 8,
      },
      markers: {
        width: 12,
        height: 12,
        radius: 12,
      },
    },

    dataLabels: {
      enabled: true,

      formatter: (val: number) => {
        if (val < 5) return "";

        return `${val.toFixed(1)}%`;
      },

      style: {
        fontSize: "14px",
        fontWeight: "bold",
        colors: ["#fff"],
      },

      dropShadow: {
        enabled: false,
      },
    },

    stroke: {
      colors: ["#fff"],
      width: 3,
    },

    tooltip: {
      y: {
        formatter: (value: number) => `${value} Vendors`,
      },
    },

    responsive: [
      {
        breakpoint: 768,
        options: {
          chart: {
            height: 340,
          },

          legend: {
            position: "bottom",
            fontSize: "12px",
          },
        },
      },
    ],
  };

  return (
    <ReactApexChart
      options={options}
      series={values}
      type="donut"
      height={400}
    />
  );
}