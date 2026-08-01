import React from "react";
import ReactApexChart from "react-apexcharts";

interface TrendItem {
  month: string;
  ccIssued: number;
  exceptionalCC: number;
  underAudit: number;
  documentNotSubmitted: number;
}

interface Props {
  data: TrendItem[];
}

export default function ComplianceMonthlyTrendChart({
  data,
}: Props) {
  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "bar",
      height: 360,
      toolbar: {
        show: false,
      },
    },

    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "55%",
        borderRadius: 6,
      },
    },

    dataLabels: {
      enabled: false,
    },

    stroke: {
      show: true,
      width: 1,
      colors: ["transparent"],
    },

    colors: [
      "#1677ff",
      "#722ed1",
      "#fa8c16",
      "#f5222d",
    ],

    xaxis: {
      categories: data.map((d) => d.month),
      title: {
        text: "Audit Period",
      },
      labels: {
        rotate: -30,
      },
    },

    yaxis: {
      title: {
        text: "Count",
      },
      min: 0,
    },

    legend: {
      position: "top",
      horizontalAlign: "center",
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
      name: "Exceptional CC",
      data: data.map((d) => d.exceptionalCC),
    },
    {
      name: "Under Audit",
      data: data.map((d) => d.underAudit),
    },
    {
      name: "Document Not Submitted",
      data: data.map((d) => d.documentNotSubmitted),
    },
  ];

  return (
    <ReactApexChart
      options={options}
      series={series}
      type="bar"
      height={340}
    />
  );
}