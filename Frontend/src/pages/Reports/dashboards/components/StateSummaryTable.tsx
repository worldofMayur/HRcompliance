import { Table, Typography } from "antd";
import type { TableProps } from "antd";

const { Text } = Typography;

interface StateSummary {
  branch__state: string;
  branch_count: number;
  total_vendor_mappings: number;
  unique_vendors: number;
}

interface Props {
  data: StateSummary[];
  loading: boolean;
}

export default function StateSummaryTable({ data, loading }: Props) {
  const columns: TableProps<StateSummary>["columns"] = [
    {
      title: "State",
      dataIndex: "branch__state",
      key: "state",
      align: "left",
      sorter: (a, b) => a.branch__state.localeCompare(b.branch__state),
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: "Branches",
      dataIndex: "branch_count",
      key: "branches",
      align: "right",
      sorter: (a, b) => a.branch_count - b.branch_count,
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: "Vendor Mappings",
      dataIndex: "total_vendor_mappings",
      key: "mappings",
      align: "right",
      sorter: (a, b) => a.total_vendor_mappings - b.total_vendor_mappings,
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: "Unique Vendors",
      dataIndex: "unique_vendors",
      key: "unique_vendors",
      align: "right",
      defaultSortOrder: "descend",
      sorter: (a, b) => a.unique_vendors - b.unique_vendors,
      render: (value: number) => <Text strong>{value.toLocaleString()}</Text>,
    },
  ];

  return (
    <Table
      size="small"
      rowKey="branch__state"
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={false}
      scroll={{ y: data.length > 8 ? 280 : undefined }}
      rowClassName="hover:bg-gray-50 transition-colors"
    />
  );
}