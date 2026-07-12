import { Table } from "antd";

const columns = [
  {
    title: "State",
    dataIndex: "branch__state",
  },
  {
    title: "Branches",
    dataIndex: "branch_count",
  },
  {
    title: "Vendor Mappings",
    dataIndex: "total_vendor_mappings",
  },
  {
    title: "Unique Vendors",
    dataIndex: "unique_vendors",
  },
];

export default function StateSummaryTable({
  data,
  loading,
}: any) {
  return (
    <Table
      size="small"
      rowKey="branch__state"
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={false}
      scroll={{ y: 330 }}
    />
  );
}