import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  LabelList,
} from "recharts";

interface TrendItem {
  month: string;
  unique_vendors: number;
}

interface Props {
  data: TrendItem[];
}

const COLORS = [
  "#2563eb",
  "#3b82f6",
  "#60a5fa",
  "#93c5fd",
  "#1d4ed8",
  "#2563eb",
  "#3b82f6",
  "#60a5fa",
  "#93c5fd",
  "#1d4ed8",
  "#2563eb",
  "#3b82f6",
];

export default function MonthlyTrendChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{
          top: 30,
          right: 20,
          left: 0,
          bottom: 10,
        }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="#f0f0f0"
        />

        <XAxis
          dataKey="month"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />

        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />

        <Tooltip
          cursor={{ fill: "#f5f5f5" }}
          formatter={(value: number) => [
            `${value} Unique Vendors`,
            "Count",
          ]}
        />

        <Bar
          dataKey="unique_vendors"
          radius={[8, 8, 0, 0]}
          maxBarSize={50}
        >
          <LabelList
            dataKey="unique_vendors"
            position="top"
            style={{
              fill: "#374151",
              fontWeight: 600,
              fontSize: 12,
            }}
          />

          {data.map((_, index) => (
            <Cell
              key={index}
              fill={COLORS[index % COLORS.length]}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}