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

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "pie",
      height: 360,
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

    legend: {
      position: "bottom",
      fontSize: "13px",
    },

    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(1)}%`,
    },

    tooltip: {
      y: {
        formatter: (value: number) => `${value} Records`,
      },
    },

    stroke: {
      colors: ["#ffffff"],
      width: 2,
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
        },
      },
    ],
  };

  return (
    <ReactApexChart
      options={options}
      series={values}
      type="pie"
      height={340}
    />
  );
}