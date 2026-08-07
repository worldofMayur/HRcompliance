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

export default function CompliancePieChart({ data }: Props) {
  const chartData = [
    { name: "CC Issued", value: data.ccIssued ?? 0 },
    { name: "Exceptional CC", value: data.exceptionalCC ?? 0 },
    { name: "Under Audit", value: data.underAudit ?? 0 },
    { name: "Document Not Submitted", value: data.documentNotSubmitted ?? 0 },
  ];

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div style={{ position: "relative", width: "100%", height: 380 }}>
      <ResponsiveContainer width="100%" height={380}>
        <PieChart margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="46%"
            innerRadius={72}
            outerRadius={105}
            paddingAngle={4}
            cornerRadius={8}
            label={({ percent }) =>
              percent && percent > 0.07
                ? `${(percent * 100).toFixed(1)}%`
                : ""
            }
            labelLine={false}
          >
            {chartData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index]}
                stroke="#fff"
                strokeWidth={2}
              />
            ))}
          </Pie>

          <Tooltip
            formatter={(value: number, name: string) => [
              `${value} (${((value / (total || 1)) * 100).toFixed(1)}%)`,
              name,
            ]}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            }}
          />

          <Legend
            verticalAlign="bottom"
            align="center"
            iconType="circle"
            iconSize={10}
            wrapperStyle={{ paddingTop: 8 }}
            formatter={(value, entry: any) => {
              const count = entry.payload.value;
              const percent = total
                ? ((count / total) * 100).toFixed(1)
                : "0.0";

              return (
                <span style={{ color: "#374151", fontSize: 13 }}>
                  {value}{" "}
                  <span style={{ color: "#6b7280" }}>({percent}%)</span>
                </span>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Centered total overlay — positioned to match cy="46%" of the donut */}
      <div
        style={{
          position: "absolute",
          top: "46%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            fontSize: 30,
            fontWeight: 700,
            color: "#111827",
            lineHeight: 1.1,
          }}
        >
          {total}
        </div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "#6B7280",
          }}
        >
          Total
        </div>
      </div>
    </div>
  );
}