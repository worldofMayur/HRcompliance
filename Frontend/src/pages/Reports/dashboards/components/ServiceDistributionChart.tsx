import React from "react";
import ReactApexChart from "react-apexcharts";

interface ServiceDistribution {
  service: string;
  vendors: number;
}

interface Props {
  data: ServiceDistribution[];
  isPie?: boolean;
}

export default function ServiceDistributionChart({ data, isPie = true }: Props) {
  const totalVendors = data.reduce((sum, item) => sum + item.vendors, 0);

  const options = {
    chart: {
      type: isPie ? "pie" : "donut",
      toolbar: { show: false },
    },

    labels: data.map((item) => item.service),

    legend: {
      position: "bottom" as const,
      fontSize: "14px",
      formatter: (seriesName: string, opts: any) => {
        const value = data[opts.seriesIndex]?.vendors || 0;
        const percentage = totalVendors > 0 ? ((value / totalVendors) * 100).toFixed(1) : "0";
        return `${seriesName} — ${value} (${percentage}%)`;
      },
    },

    dataLabels: {
      enabled: true,
      style: { fontSize: "15px", fontWeight: "bold" },
      formatter: (val: number, opts: any) => {
        return `${val.toFixed(1)}%`;
      },
    },

    tooltip: {
      y: { formatter: (val: number) => `${val} Vendors` },
    },

    plotOptions: {
      pie: {
        expandOnClick: true,
      },
    },

    responsive: [
      {
        breakpoint: 768,
        options: { legend: { position: "bottom" } },
      },
    ],
  };

  const series = data.map((item) => item.vendors);

  return (
    <ReactApexChart
      options={options}
      series={series}
      type={isPie ? "pie" : "donut"}
      height={320}
    />
  );
}