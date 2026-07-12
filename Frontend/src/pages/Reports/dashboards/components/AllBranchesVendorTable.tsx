import { Table } from "antd";
import type { TableProps } from "antd";

interface Props {
  data: any[];
  loading: boolean;
}

export default function AllBranchesVendorTable({ data, loading }: Props) {
  const columns = [
    { title: "State", dataIndex: "state", key: "state", align: "left" as const },
    { 
      title: "Total Branches", 
      dataIndex: "total_branches", 
      key: "total_branches", 
      align: "center" as const,
      sorter: (a: any, b: any) => a.total_branches - b.total_branches 
    },
    { title: "Vendor Name", dataIndex: "vendor_name", key: "vendor_name" },
    { title: "Nature of Services", dataIndex: "nature_of_services", key: "nature_of_services" },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={false}
      scroll={{ y: 280 }}           // Vertical Scrollbar
      size="small"
      rowKey="state"
    />
  );
}