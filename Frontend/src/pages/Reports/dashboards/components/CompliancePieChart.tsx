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
  "#22C55E", // CC Issued
  "#F59E0B", // Exceptional CC
  "#3B82F6", // Under Audit
  "#EF4444", // Document Not Submitted
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

  const total =
    chartData.reduce(
      (sum, item) => sum + item.value,
      0
    ) || 1;

  return (
    <ResponsiveContainer
      width="100%"
      height={320}
    >
      <PieChart>

        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="42%"
          innerRadius={70}
          outerRadius={105}
          paddingAngle={5}
          cornerRadius={10}
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
          iconType="circle"
          iconSize={10}
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
          fontSize={34}
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
          fontSize={14}
          fontWeight={500}
          fill="#6b7280"
        >
          Total
        </text>

      </PieChart>
    </ResponsiveContainer>
  );
}