import React from "react";
import ReactApexChart from "react-apexcharts";

interface ServiceDistribution {
  service: string;
  vendors: number;
}

interface Props {
  data: ServiceDistribution[];
  onSliceClick?: (service: string) => void;
}

export default function ServiceDistributionChart({ data, onSliceClick }: Props) {
  const totalVendors = data.reduce((sum, item) => sum + item.vendors, 0);

  const options = {
    chart: {
      type: "donut",
      toolbar: { show: false },
      events: {
        dataPointSelection: (event: any, chartContext: any, config: any) => {
          const selectedService = data[config.dataPointIndex]?.service;
          if (selectedService && onSliceClick) onSliceClick(selectedService);
        },
      },
    },

    labels: data.map((item) => item.service),

    legend: {
      position: "right" as const,
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
      style: { fontSize: "15px", fontWeight: "bold" },
    },

    plotOptions: {
      pie: {
        donut: {
          size: "72%",
          labels: {
            show: true,
            name: { fontSize: "15px" },
            total: {
              show: true,
              label: "Total Vendors",
              fontSize: "15px",
              color: "#666",
              formatter: () => totalVendors.toLocaleString(),
            },
            value: {
              show: true,
              fontSize: "28px",
              fontWeight: "bold",
              color: "#1677ff",
            },
          },
        },
      },
    },

    tooltip: {
      y: { formatter: (val: number) => `${val} Vendors` },
    },
  };

  const series = data.map((item) => item.vendors);

  return (
    <ReactApexChart
      options={options}
      series={series}
      type="donut"
      height={340}
    />
  );
}