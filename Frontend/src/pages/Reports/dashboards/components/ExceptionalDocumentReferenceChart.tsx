import React from "react";
import ReactApexChart from "react-apexcharts";
import { Card } from "antd";

const ExceptionalDocumentReferenceChart: React.FC = () => {
  const series = [28, 22, 18, 12, 8, 6, 4, 2];

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "pie",
      toolbar: {
        show: false,
      },
    },

    labels: [
      "PF Remittance",
      "ESIC Receipt",
      "PT Return",
      "Shop Act",
      "LWF Receipt",
      "Salary Register",
      "Bonus Register",
      "Others",
    ],

    legend: {
      position: "bottom",
      horizontalAlign: "center",
      fontSize: "13px",
      itemMargin: {
        horizontal: 12,
        vertical: 6,
      },
    },

    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(0)}%`,
      style: {
        fontSize: "12px",
        fontWeight: 600,
      },
      dropShadow: {
        enabled: false,
      },
    },

    stroke: {
      width: 2,
      colors: ["#fff"],
    },

    tooltip: {
      y: {
        formatter: (val: number) => `${val} Documents`,
      },
    },

    plotOptions: {
      pie: {
        expandOnClick: true,
        offsetY: 10,
      },
    },

    responsive: [
      {
        breakpoint: 768,
        options: {
          chart: {
            height: 300,
          },
          legend: {
            position: "bottom",
          },
        },
      },
    ],
  };

  return (
<Card
  size="small"
  title="Documents Referenced for Exceptional Clearance"
  style={{
    height: 370,
  }}
>
  <ReactApexChart
    options={options}
    series={series}
    type="pie"
    height={300}
  />
</Card>
  );
};

export default ExceptionalDocumentReferenceChart;