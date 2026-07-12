import { Table } from "antd";
import type { TableProps } from "antd";

interface VendorAllBranches {
  state: string;
  vendor_name: string;
  nature_of_services: string;
  total_branches: number;
}

interface Props {
  data: VendorAllBranches[];
  loading: boolean;
}

export default function AllBranchesVendorTable({ data, loading }: Props) {
  const columns: TableProps<VendorAllBranches>["columns"] = [
    {
      title: "State",
      dataIndex: "state",
      key: "state",
      align: "left",
    },
    {
      title: "Total Branches",           // 2nd Column as requested
      dataIndex: "total_branches",
      key: "total_branches",
      align: "center",
      sorter: (a, b) => a.total_branches - b.total_branches,
      defaultSortOrder: "descend",
      render: (value: number) => <strong>{value}</strong>,
    },
    {
      title: "Vendor Name",
      dataIndex: "vendor_name",
      key: "vendor_name",
    },
    {
      title: "Nature of Services",
      dataIndex: "nature_of_services",
      key: "nature_of_services",
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      loading={loading}
      rowKey="vendor_name"
      pagination={false}
      scroll={{ y: 320 }}
      size="small"
    />
  );
}