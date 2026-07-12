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
  const totalVendors = data.reduce((sum, item) => sum + item.vendors, 0);

  const options = {
    chart: {
      type: "pie",
      toolbar: { show: false },
    },

    labels: data.map((item) => item.service),

    legend: {
      position: "bottom" as const,
      fontSize: "14px",
      fontWeight: 500,
      formatter: (seriesName: string, opts: any) => {
        const value = data[opts.seriesIndex]?.vendors || 0;
        const percentage = totalVendors > 0 ? ((value / totalVendors) * 100).toFixed(1) : "0";
        return `${seriesName} — ${value} (${percentage}%)`;
      },
    },

    dataLabels: {
      enabled: true,
      style: { fontSize: "16px", fontWeight: "bold" },
      dropShadow: { enabled: true },
    },

    tooltip: {
      y: { formatter: (val: number) => `${val} Vendors` },
    },

    plotOptions: {
      pie: {
        expandOnClick: true,
      },
    },
  };

  const series = data.map((item) => item.vendors);

  return (
    <ReactApexChart
      options={options}
      series={series}
      type="pie"
      height={340}
    />
  );
}