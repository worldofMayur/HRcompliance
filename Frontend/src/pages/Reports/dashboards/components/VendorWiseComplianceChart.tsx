import React from "react";
import ReactApexChart from "react-apexcharts";
import { Table } from "antd";

interface Props {
  data: any[];
}

export default function VendorWiseComplianceChart({ data }: Props) {
  const chartOptions: ApexCharts.ApexOptions = {
    chart: { type: "bar", height: 350, toolbar: { show: false } },
    plotOptions: { bar: { horizontal: false, columnWidth: "60%" } },
    dataLabels: { enabled: false },
    colors: ["#1677ff", "#52c41a", "#ff4d4f", "#faad14"],
    xaxis: {
      categories: data.map((v) => v.vendor__short_name || v.vendor__name),
    },
    yaxis: { title: { text: "Count" } },
    legend: { position: "top" },
  };

  const series = [
    { name: "CC Issued", data: data.map((v) => v.cc_issued) },
    { name: "Complied", data: data.map((v) => v.complied) },
    { name: "Non Complied", data: data.map((v) => v.non_complied) },
    { name: "Exceptional", data: data.map((v) => v.exceptional) },
  ];

  const columns = [
    { title: "Vendor", dataIndex: "vendor__name", key: "vendor" },
    { title: "Total", dataIndex: "total", key: "total" },
    { title: "CC Issued", dataIndex: "cc_issued", key: "cc" },
    { title: "Complied", dataIndex: "complied", key: "complied" },
    { title: "Non Complied", dataIndex: "non_complied", key: "non" },
    { title: "Exceptional", dataIndex: "exceptional", key: "exc" },
  ];

  return (
    <>
      <ReactApexChart options={chartOptions} series={series} type="bar" height={320} />
      <Table columns={columns} dataSource={data} rowKey="vendor__name" pagination={false} size="small" />
    </>
  );
}