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
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        borderRadius: 6,
        columnWidth: "45%",
      },
    },
    dataLabels: {
      enabled: true,
    },
    xaxis: {
      categories: data.map((d) => d.month),
      title: {
        text: "Months",
      },
    },
    yaxis: {
      title: {
        text: "Unique Vendors",
      },
      min: 0,
    },
    tooltip: {
      y: {
        formatter: (val) => `${val} Vendors`,
      },
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
      height={320}
    />
  );
}