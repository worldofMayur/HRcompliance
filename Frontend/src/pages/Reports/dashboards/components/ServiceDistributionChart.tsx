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
          if (selectedService && onSliceClick) {
            onSliceClick(selectedService);
          }
        },
      },
    },

    labels: data.map((item) => item.service),

    legend: {
      position: "right" as const,
      fontSize: "13px",
      formatter: (seriesName: string, opts: any) => {
        const value = data[opts.seriesIndex]?.vendors || 0;
        const percentage = totalVendors > 0 
          ? ((value / totalVendors) * 100).toFixed(1) 
          : "0";
        return `${seriesName} — ${value} (${percentage}%)`;
      },
    },

    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(1)}%`,
    },

    tooltip: {
      y: {
        formatter: (value: number) => `${value} Vendors`,
      },
    },

    plotOptions: {
      pie: {
        donut: {
          size: "68%",
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: "14px",
            },
            total: {
              show: true,
              showAlways: true,
              label: "Total Vendors",
              fontSize: "14px",
              color: "#666",
              formatter: () => totalVendors.toLocaleString(),
            },
            value: {
              show: true,
              fontSize: "22px",
              fontWeight: "bold",
              color: "#1677ff",
            },
          },
        },
      },
    },

    responsive: [
      {
        breakpoint: 768,
        options: {
          legend: {
            position: "bottom" as const,
          },
        },
      },
    ],
  };

  const series = data.map((item) => item.vendors);

  return (
    <div className="flex justify-center">
      <ReactApexChart
        options={options}
        series={series}
        type="donut"
        height={320}
      />
    </div>
  );
}