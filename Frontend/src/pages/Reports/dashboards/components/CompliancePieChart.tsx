import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

interface Props {
  data: Record<string, number>;
}

const COLORS = [
  "#1677ff",
  "#722ed1",
  "#fa8c16",
  "#f5222d",
];

export default function CompliancePieChart({
  data,
}: Props) {
  const chartData = [
    {
      name: "CC Issued",
      value: data.ccIssued ?? 0,
    },
    {
      name: "Exceptional CC",
      value: data.exceptionalCC ?? 0,
    },
    {
      name: "Under Audit",
      value: data.underAudit ?? 0,
    },
    {
      name: "Document Not Submitted",
      value: data.documentNotSubmitted ?? 0,
    },
  ];

  const total = chartData.reduce(
    (sum, item) => sum + item.value,
    0
  );

  return (
    <ResponsiveContainer
      width="100%"
      height={360}
    >
      <PieChart>

        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="45%"
          innerRadius={70}
          outerRadius={105}
          paddingAngle={3}
          cornerRadius={6}
          label={({ percent }) =>
            percent && percent > 0
              ? `${(percent * 100).toFixed(1)}%`
              : ""
          }
        >
          {chartData.map((_, index) => (
            <Cell
              key={index}
              fill={COLORS[index]}
            />
          ))}
        </Pie>

        <Tooltip
          formatter={(value: number) => [
            `${value} Records (${(
              (value / total) *
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
              (count / total) *
              100
            ).toFixed(1)}%)`;
          }}
        />

        <text
          x="50%"
          y="43%"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={28}
          fontWeight={700}
          fill="#1f2937"
        >
          {total}
        </text>

        <text
          x="50%"
          y="51%"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={13}
          fill="#6b7280"
        >
          Total
        </text>

      </PieChart>
    </ResponsiveContainer>
  );
}