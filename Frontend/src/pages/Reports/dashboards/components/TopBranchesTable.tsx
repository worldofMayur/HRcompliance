import { Table } from "antd";

const columns = [
  {
    title: "Rank",
    render: (_: any, __: any, index: number) => index + 1,
    width: 70,
  },
  {
    title: "Branch",
    dataIndex: "branch__branch_name",
  },
  {
    title: "State",
    dataIndex: "branch__state",
  },
  {
    title: "Unique Vendors",
    dataIndex: "unique_vendors",
    align: "right" as const,
  },
];

interface Props {
  data: any[];
  loading: boolean;
}

export default function TopBranchesTable({
  data,
  loading,
}: Props) {
  return (
    <Table
      rowKey="branch__branch_name"
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={false}
      size="small"
      scroll={{ y: 300 }}
    />
  );
}