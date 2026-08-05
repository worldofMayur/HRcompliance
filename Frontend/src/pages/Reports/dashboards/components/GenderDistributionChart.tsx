import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

interface Props {
  data: {
    male: number;
    female: number;
  };
}

const COLORS = [
  "#3B82F6", // Male - Blue
  "#EC4899", // Female - Pink
];

export default function GenderDistributionChart({
  data,
}: Props) {

  const chartData = [
    {
      name: "Male",
      value: data.male ?? 0,
    },
    {
      name: "Female",
      value: data.female ?? 0,
    },
  ];

  const totalEmployees =
    chartData.reduce(
      (sum, item) => sum + item.value,
      0
    ) || 1;

  return (
    <ResponsiveContainer width="100%" height={320}>
      <PieChart>

        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="45%"
          innerRadius={70}
          outerRadius={100}
          paddingAngle={4}
          cornerRadius={8}
          label={({ percent }) =>
            `${((percent ?? 0) * 100).toFixed(1)}%`
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
            `${value} Employees (${(
              (value / totalEmployees) *
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
              (count / totalEmployees) *
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
          fill="#1F2937"
        >
          {totalEmployees}
        </text>

        <text
          x="50%"
          y="52%"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={13}
          fill="#6B7280"
        >
          Employees
        </text>

      </PieChart>
    </ResponsiveContainer>
  );
}