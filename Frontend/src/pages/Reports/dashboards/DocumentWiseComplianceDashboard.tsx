import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Table } from "antd";

const data = [
  {
    month: "Jan",
    remittance_day: 12,
    before_15: 18,
    after_15: 4,
  },
  {
    month: "Feb",
    remittance_day: 14,
    before_15: 20,
    after_15: 2,
  },
  {
    month: "Mar",
    remittance_day: 17,
    before_15: 14,
    after_15: 8,
  },
];

export default function DocumentWiseComplianceDashboard() {
  return (
    <div className="space-y-6">

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">
          PF & ESIC Remittance Trend
        </h2>

        <ResponsiveContainer width="100%" height={380}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="month" />

            <YAxis
              domain={[1, 31]}
              label={{
                value: "Remittance Day",
                angle: -90,
                position: "insideLeft",
              }}
            />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="remittance_day"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <Table
        rowKey="month"
        pagination={false}
        dataSource={data}
        columns={[
          {
            title: "Audit Month",
            dataIndex: "month",
          },
          {
            title: "Before 15th",
            dataIndex: "before_15",
          },
          {
            title: "After 15th",
            dataIndex: "after_15",
          },
        ]}
      />
    </div>
  );
}