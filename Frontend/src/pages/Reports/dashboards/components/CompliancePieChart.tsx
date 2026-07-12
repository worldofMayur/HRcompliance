import React from "react";
import ReactApexChart from "react-apexcharts";

interface Props {
  data: Record<string, number>;
}

export default function CompliancePieChart({ data }: Props) {
  const labels = Object.keys(data);
  const values = Object.values(data);

  const options: ApexCharts.ApexOptions = {
    chart: { type: "pie", height: 350 },
    labels,
    colors: ["#52c41a", "#ff4d4f", "#faad14", "#1677ff", "#eb2f96"],
    legend: { position: "bottom" },
    responsive: [{ breakpoint: 480, options: { chart: { width: 300 } } }],
  };

  return (
    <ReactApexChart
      options={options}
      series={values}
      type="pie"
      height={320}
    />
  );
}