import React from "react";
import ReactApexChart from "react-apexcharts";

interface TrendItem {
  audit_period: string;
  ccIssued: number;
  exceptionalCC: number;
}

interface Props {
  data: TrendItem[];
}

export default function VendorWiseCCTrendChart({
  data,
}: Props) {
  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "line",
      height: 420,
      zoom: {
        enabled: false,
      },
      toolbar: {
        show: false,
      },
    },

    stroke: {
      curve: "smooth",
      width: 4,
    },

    colors: [
      "#1677ff",
      "#52c41a",
    ],

    markers: {
      size: 6,
      strokeWidth: 2,
      hover: {
        size: 8,
      },
    },

    xaxis: {
      categories: data.map(
        (item) => item.audit_period
      ),

      title: {
        text: "Audit Period",
      },
    },

    yaxis: {
      title: {
        text: "CC Issued Count",
      },
      min: 0,
      forceNiceScale: true,
    },

    legend: {
      position: "top",
    },

    tooltip: {
      shared: true,
      intersect: false,
    },

    grid: {
      borderColor: "#f1f5f9",
      strokeDashArray: 5,
    },

    dataLabels: {
      enabled: false,
    },
  };

  const series = [
    {
      name: "CC Issued",
      data: data.map(
        (item) => item.ccIssued
      ),
    },
    {
      name: "Exceptional CC",
      data: data.map(
        (item) => item.exceptionalCC
      ),
    },
  ];

  return (
    <ReactApexChart
      options={options}
      series={series}
      type="line"
      height={420}
    />
  );
}