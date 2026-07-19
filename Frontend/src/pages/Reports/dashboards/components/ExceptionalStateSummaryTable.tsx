import React from "react";
import { Card, Table } from "antd";
import type { ColumnsType } from "antd/es/table";

interface ExceptionalStateData {
  key: string;
  state: string;
  branch_count: number;
  vendor_count: number;
  jan: number;
  feb: number;
  mar: number;
  apr: number;
  may: number;
  jun: number;
  jul: number;
  aug: number;
  sep: number;
  oct: number;
  nov: number;
  dec: number;
}

const columns: ColumnsType<ExceptionalStateData> = [
  {
    title: "State",
    dataIndex: "state",
    key: "state",
    width: 130,
    ellipsis: true,
    onCell: () => ({
      style: {
        whiteSpace: "nowrap",
      },
    }),
  },
  {
    title: "Branches",
    dataIndex: "branch_count",
    key: "branch_count",
    width: 70,
    align: "center",
  },
  {
    title: "Vendors",
    dataIndex: "vendor_count",
    key: "vendor_count",
    width: 70,
    align: "center",
  },

  { title: "Jan", dataIndex: "jan", key: "jan", width: 55, align: "center" },
  { title: "Feb", dataIndex: "feb", key: "feb", width: 55, align: "center" },
  { title: "Mar", dataIndex: "mar", key: "mar", width: 55, align: "center" },
  { title: "Apr", dataIndex: "apr", key: "apr", width: 55, align: "center" },
  { title: "May", dataIndex: "may", key: "may", width: 55, align: "center" },
  { title: "Jun", dataIndex: "jun", key: "jun", width: 55, align: "center" },
  { title: "Jul", dataIndex: "jul", key: "jul", width: 55, align: "center" },
  { title: "Aug", dataIndex: "aug", key: "aug", width: 55, align: "center" },
  { title: "Sep", dataIndex: "sep", key: "sep", width: 55, align: "center" },
  { title: "Oct", dataIndex: "oct", key: "oct", width: 55, align: "center" },
  { title: "Nov", dataIndex: "nov", key: "nov", width: 55, align: "center" },
  { title: "Dec", dataIndex: "dec", key: "dec", width: 55, align: "center" },
];

const data: ExceptionalStateData[] = [
  {
    key: "1",
    state: "Maharashtra",
    branch_count: 12,
    vendor_count: 48,
    jan: 2,
    feb: 1,
    mar: 4,
    apr: 0,
    may: 3,
    jun: 2,
    jul: 1,
    aug: 0,
    sep: 2,
    oct: 1,
    nov: 3,
    dec: 2,
  },
  {
    key: "2",
    state: "Karnataka",
    branch_count: 8,
    vendor_count: 31,
    jan: 0,
    feb: 2,
    mar: 1,
    apr: 3,
    may: 1,
    jun: 0,
    jul: 2,
    aug: 1,
    sep: 0,
    oct: 1,
    nov: 2,
    dec: 1,
  },
  {
    key: "3",
    state: "Tamil Nadu",
    branch_count: 10,
    vendor_count: 26,
    jan: 1,
    feb: 1,
    mar: 0,
    apr: 2,
    may: 2,
    jun: 1,
    jul: 1,
    aug: 2,
    sep: 1,
    oct: 0,
    nov: 1,
    dec: 2,
  },
  {
    key: "4",
    state: "Delhi",
    branch_count: 5,
    vendor_count: 18,
    jan: 1,
    feb: 0,
    mar: 2,
    apr: 1,
    may: 0,
    jun: 1,
    jul: 2,
    aug: 0,
    sep: 1,
    oct: 1,
    nov: 0,
    dec: 1,
  },
];

const ExceptionalStateSummaryTable: React.FC = () => {
  return (
    <Card
      title="State-wise Exceptional Approval Summary"
      size="small"
      bodyStyle={{ padding: 0 }}
    >
    <Table
      rowKey="key"
      columns={columns}
      dataSource={data}
      pagination={false}
      bordered
      size="small"
      sticky
      tableLayout="fixed"
      scroll={{ y: 360 }}
    />
    </Card>
  );
};

export default ExceptionalStateSummaryTable;