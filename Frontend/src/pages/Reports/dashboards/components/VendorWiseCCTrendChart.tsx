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
      height: 430,
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
      animations: {
        enabled: true,
        easing: "easeinout",
        speed: 800,
      },
    },

    colors: [
    "#22C55E", // CC Issued
    "#F59E0B", // Exceptional CC
    ],

    stroke: {
      curve: "smooth",
      width: 4,
    },

    markers: {
      size: 6,
      strokeWidth: 2,
      hover: {
        size: 8,
      },
    },

    xaxis: {
      categories: data.map((item) => item.audit_period),

      title: {
        text: "Month",
        style: {
          fontSize: "13px",
          fontWeight: 600,
        },
      },

      labels: {
        rotate: -45,
        style: {
          fontSize: "12px",
        },
      },
    },

    yaxis: {
      min: 0,

      forceNiceScale: true,

      title: {
        text: "Number of CCs",
        style: {
          fontSize: "13px",
          fontWeight: 600,
        },
      },

      labels: {
        formatter(value) {
          return value.toFixed(0);
        },
      },
    },

    legend: {
      position: "top",
      horizontalAlign: "center",
      fontSize: "13px",
      markers: {
        radius: 12,
      },
    },

    tooltip: {
      shared: true,
      intersect: false,

      y: {
        formatter(value: number, { seriesIndex }) {
          if (seriesIndex === 0) {
            return `${value} CC Issued`;
          }

          return `${value} Exceptional CC`;
        },
      },
    },

    grid: {
      borderColor: "#e5e7eb",
      strokeDashArray: 4,
    },

    dataLabels: {
      enabled: false,
    },

    noData: {
      text: "No CC data available",
      align: "center",
      verticalAlign: "middle",
    },
  };

  const series = [
    {
      name: "CC Issued",
      data: data.map((item) => item.ccIssued),
    },
    {
      name: "Exceptional CC",
      data: data.map((item) => item.exceptionalCC),
    },
  ];

  return (
    <ReactApexChart
      options={options}
      series={series}
      type="line"
      height={430}
    />
  );
}