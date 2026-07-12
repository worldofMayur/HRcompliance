import { Table, Typography } from "antd";
import type { TableProps } from "antd";

const { Text } = Typography;

interface TopBranch {
  branch_name: string;
  state: string;
  unique_vendors: number;
}

interface Props {
  data: TopBranch[];
  loading: boolean;
  onRowClick?: (branchName: string) => void;
}

const rankEmoji = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

export default function TopBranchesTable({ data, loading, onRowClick }: Props) {
  const columns: TableProps<TopBranch>["columns"] = [
    {
      title: "Rank",
      key: "rank",
      align: "center" as const,
      width: 80,
      render: (_: any, __: any, index: number) => (
        <Text style={{ fontSize: 18, fontWeight: 600 }}>
          {rankEmoji[index] || index + 1}
        </Text>
      ),
    },
    {
      title: "Branch",
      dataIndex: "branch_name",
      key: "branch",
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: "State",
      dataIndex: "state",
      key: "state",
    },
    {
      title: "Vendors",                    // Shortened label
      dataIndex: "unique_vendors",
      key: "unique_vendors",
      align: "right" as const,
      defaultSortOrder: "descend" as const,
      sorter: (a, b) => a.unique_vendors - b.unique_vendors,
      render: (value: number) => (
        <Text strong style={{ color: "#1677ff" }}>
          {value.toLocaleString()}
        </Text>
      ),
    },
  ];

  return (
    <Table
      rowKey="branch_name"
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={false}
      size="small"
      scroll={{ y: data.length > 8 ? 260 : undefined }}
      onRow={(record) => ({
        onClick: () => onRowClick?.(record.branch_name),
        style: { cursor: onRowClick ? "pointer" : "default" },
      })}
      rowClassName="hover:bg-gray-50 transition-colors"
    />
  );
}