import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

interface ServiceDistribution {
  service: string;
  vendors: number;
}

interface Props {
  data: ServiceDistribution[];
}

const COLORS = [
  "#2563eb",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#f97316",
  "#6366f1",
  "#84cc16",
];

export default function ServiceDistributionChart({ data }: Props) {
  const totalVendors = data.reduce(
    (sum, item) => sum + item.vendors,
    0
  );

  const chartData = data.map((item) => ({
    name: item.service,
    value: item.vendors,
  }));

  return (
    <ResponsiveContainer width="100%" height={310}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="45%"
          innerRadius={65}
          outerRadius={95}
          paddingAngle={3}
          cornerRadius={6}
          label={({ percent }) =>
            `${((percent ?? 0) * 100).toFixed(1)}%`
          }
        >
          {chartData.map((_, index) => (
            <Cell
              key={index}
              fill={COLORS[index % COLORS.length]}
            />
          ))}
        </Pie>

        <Tooltip
          formatter={(value: number) => [
            `${value} Vendors (${(
              (value / totalVendors) *
              100
            ).toFixed(1)}%)`,
            "Count",
          ]}
        />

        <Legend
          verticalAlign="bottom"
          align="center"
          formatter={(value, entry: any) => {
            const count = entry.payload.value;

            return `${value} (${(
              (count / totalVendors) *
              100
            ).toFixed(1)}%)`;
          }}
        />

        <text
          x="50%"
          y="43%"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={26}
          fontWeight={700}
          fill="#1f2937"
        >
          {totalVendors}
        </text>

        <text
          x="50%"
          y="51%"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={13}
          fill="#6b7280"
        >
          Vendors
        </text>
      </PieChart>
    </ResponsiveContainer>
  );
}