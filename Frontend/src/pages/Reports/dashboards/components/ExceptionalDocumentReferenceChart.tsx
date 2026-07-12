import React from "react";
import ReactApexChart from "react-apexcharts";
import { Card } from "antd";

const ExceptionalDocumentReferenceChart: React.FC = () => {
  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "donut",
    },
    labels: [
      "PF Remittance Receipt",
      "ESIC Remittance Receipt",
      "PT Return",
      "Shop Act Return",
      "LWF Remittance",
      "Salary Register",
      "Bonus Register",
      "Others",
    ],
    legend: {
      position: "right",
      fontSize: "13px",
    },
    dataLabels: {
      enabled: true,
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val} Documents`,
      },
    },
    responsive: [
      {
        breakpoint: 768,
        options: {
          legend: {
            position: "bottom",
          },
        },
      },
    ],
  };

  const series = [28, 22, 18, 12, 8, 6, 4, 2];

  return (
    <Card title="📄 Documents Referenced for Exceptional Clearance">
      <ReactApexChart
        options={options}
        series={series}
        type="donut"
        height={340}
      />
    </Card>
  );
};

export default ExceptionalDocumentReferenceChart;