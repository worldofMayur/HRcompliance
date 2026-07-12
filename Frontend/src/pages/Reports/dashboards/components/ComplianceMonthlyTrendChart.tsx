import React from "react";
import ReactApexChart from "react-apexcharts";

interface TrendItem {
  month: string;
  ccIssued: number;
  complied: number;
  nonComplied: number;
}

interface Props {
  data: TrendItem[];
}

export default function ComplianceMonthlyTrendChart({ data }: Props) {
  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "bar",
      toolbar: {
        show: false,
      },
      height: 320,
    },

    plotOptions: {
      bar: {
        borderRadius: 5,
        columnWidth: "55%",
      },
    },

    dataLabels: {
      enabled: false,
    },

    colors: [
      "#1677ff",
      "#52c41a",
      "#ff4d4f",
    ],

    xaxis: {
      categories: data.map((d) => d.month),
      title: {
        text: "Audit Period",
      },
    },

    yaxis: {
      title: {
        text: "Vendor Count",
      },
    },

    legend: {
      position: "top",
    },

    tooltip: {
      shared: true,
      intersect: false,
    },

    grid: {
      borderColor: "#f0f0f0",
    },
  };

  const series = [
    {
      name: "CC Issued",
      data: data.map((d) => d.ccIssued),
    },
    {
      name: "Complied",
      data: data.map((d) => d.complied),
    },
    {
      name: "Non Complied",
      data: data.map((d) => d.nonComplied),
    },
  ];

  return (
    <ReactApexChart
      options={options}
      series={series}
      type="bar"
      height={300}
    />
  );
}