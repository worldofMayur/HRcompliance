import React from "react";
import ReactApexChart from "react-apexcharts";
import { Card } from "antd";

const TopExceptionalVendorsChart: React.FC = () => {
  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "bar",
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        borderRadius: 6,
        columnWidth: "55%",
      },
    },
    dataLabels: {
      enabled: true,
    },
    xaxis: {
      categories: [
        "ABC Ltd",
        "XYZ Services",
        "Delta Corp",
        "Sun Tech",
        "Prime Solutions",
        "Vision Pvt",
        "Secure Co",
        "Global HR",
        "Quick Staff",
        "Apex Group",
      ],
      title: {
        text: "Vendor Name",
      },
      labels: {
        rotate: -45,
      },
    },
    yaxis: {
      title: {
        text: "Exceptional Clearance Count",
      },
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val} Clearances`,
      },
    },
  };

  const series = [
    {
      name: "Exceptional Clearances",
      data: [15, 13, 12, 10, 9, 8, 7, 6, 5, 4],
    },
  ];

  return (
    <Card
      title="📊 Top 10 Vendors with Exceptional Clearance (Last 12 Months)"
      style={{ marginBottom: 16 }}
    >
      <ReactApexChart
        options={options}
        series={series}
        type="bar"
        height={340}
      />
    </Card>
  );
};

export default TopExceptionalVendorsChart;