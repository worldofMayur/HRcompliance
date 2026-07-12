import React from "react";
import ReactApexChart from "react-apexcharts";

interface TrendItem {
  month: string;
  unique_vendors: number;
}

interface Props {
  data: TrendItem[];
}

export default function MonthlyTrendChart({ data }: Props) {
  const options = {
    chart: {
      type: "bar",
      toolbar: { show: false },
      height: 320,
    },
    plotOptions: {
      bar: {
        borderRadius: 6,
        columnWidth: "45%",
        dataLabels: {
          position: "top",
        },
      },
    },
    colors: ["#1677ff"],
    dataLabels: {
      enabled: true,
      offsetY: -20,
      style: {
        fontSize: "13px",
        fontWeight: "bold",
        colors: ["#333"],
      },
      formatter: (val: number) => val.toString(),
    },
    xaxis: {
      categories: data.map((d) => d.month),
      title: {
        text: "Months",
        style: { fontSize: "13px" },
      },
      axisBorder: { show: false },
    },
    yaxis: {
      title: {
        text: "Unique Vendors",
        style: { fontSize: "13px" },
      },
      min: 0,
      labels: {
        formatter: (val: number) => val.toString(),
      },
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val} Unique Vendors`,
      },
    },
    grid: {
      borderColor: "#f0f0f0",
    },
  };

  const series = [
    {
      name: "Unique Vendors",
      data: data.map((d) => d.unique_vendors),
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