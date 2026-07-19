import React, { useEffect, useState } from "react";
import { Card, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import axios from "axios";
import { API_BASE } from "../../../config/api"; // Update path if different

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

const ExceptionalStateSummaryTable: React.FC = () => {
  const [data, setData] = useState<ExceptionalStateData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${API_BASE}/api/vendor/dashboard/exceptional/`,
        {
          withCredentials: true,
        }
      );

      const formatted = response.data.map(
        (item: any, index: number): ExceptionalStateData => ({
          key: index.toString(),
          state: item.state,
          branch_count: item.branch_count,
          vendor_count: item.vendor_count,
          jan: item.jan,
          feb: item.feb,
          mar: item.mar,
          apr: item.apr,
          may: item.may,
          jun: item.jun,
          jul: item.jul,
          aug: item.aug,
          sep: item.sep,
          oct: item.oct,
          nov: item.nov,
          dec: item.dec,
        })
      );

      setData(formatted);
    } catch (error) {
      console.error("Failed to load Exceptional Dashboard", error);
    } finally {
      setLoading(false);
    }
  };

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
        loading={loading}
        pagination={false}
        bordered
        size="small"
        sticky
        tableLayout="fixed"
        scroll={{ x: "max-content", y: 360 }}
      />
    </Card>
  );
};

export default ExceptionalStateSummaryTable;