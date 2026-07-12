import { Table } from "antd";

interface Props {
  data: any[];
  loading: boolean;
}

export default function AllBranchesVendorTable({ data, loading }: Props) {
  const columns = [
    { title: "State", dataIndex: "state", key: "state", align: "left" as const },
    { 
      title: "Total Branches Count", 
      dataIndex: "total_branches", 
      key: "total_branches", 
      align: "center" as const 
    },
    { title: "Vendor Name", dataIndex: "vendor_name", key: "vendor_name" },
    { title: "Nature of Services", dataIndex: "nature_of_services", key: "nature_of_services" },
  ];

  return (
    <Table
      rowKey={(record) => `${record.state}-${record.vendor_name}`}
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={false}
      scroll={{ y: 250 }}
      size="small"
    />
  );
}