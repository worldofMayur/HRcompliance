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
  onRowClick?: (state: string) => void;
}

export default function StateSummaryTable({ data, loading, onRowClick }: Props) {
  console.log("Table Data:", data);

  const columns: TableProps<StateSummary>["columns"] = [
    {
      title: "State",
      dataIndex: "branch__state",
      key: "state",
      align: "left" as const,
      sorter: (a, b) => a.branch__state.localeCompare(b.branch__state),
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: "Branches",
      dataIndex: "branch_count",
      key: "branches",
      align: "right" as const,
      sorter: (a, b) => a.branch_count - b.branch_count,
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: "Vendor Mappings",
      dataIndex: "total_vendor_mappings",
      key: "mappings",
      align: "right" as const,
      sorter: (a, b) => a.total_vendor_mappings - b.total_vendor_mappings,
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: "Unique Vendors",
      dataIndex: "unique_vendors",
      key: "unique_vendors",
      align: "right" as const,
      defaultSortOrder: "descend" as const,
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
      scroll={{ y: data.length > 8 ? 280 : undefined }} // Smart scroll
      onRow={(record) => ({
        onClick: () => onRowClick?.(record.branch__state),
        style: { cursor: onRowClick ? "pointer" : "default" },
      })}
      rowClassName="hover:bg-gray-50 transition-colors"
    />
  );
}