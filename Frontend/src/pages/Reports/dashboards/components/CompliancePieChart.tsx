import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

interface Props {
  data: Record<string, number>;
}

const SEGMENTS = [
  { key: "ccIssued", name: "CC Issued", color: "#22C55E" },
  { key: "exceptionalCC", name: "Exceptional CC", color: "#F59E0B" },
  { key: "underAudit", name: "Under Audit", color: "#3B82F6" },
  { key: "documentNotSubmitted", name: "Document Not Submitted", color: "#EF4444" },
];

export default function CompliancePieChart({ data }: Props) {
  const chartData = SEGMENTS.map((s) => ({
    name: s.name,
    value: data[s.key] ?? 0,
    color: s.color,
  }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div style={{ width: "100%" }}>
      {/* Chart area contains ONLY the pie — no Legend inside, so cy is predictable */}
      <div style={{ position: "relative", width: "100%", height: 300 }}>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={72}
              outerRadius={105}
              paddingAngle={4}
              cornerRadius={8}
              label={({ percent }) =>
                percent && percent > 0.07 ? `${(percent * 100).toFixed(1)}%` : ""
              }
              labelLine={false}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={2} />
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
          </PieChart>
        </ResponsiveContainer>

        {/* Now 50%/50% in CSS matches 50%/50% in the Pie exactly */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          <div style={{ fontSize: 30, fontWeight: 700, color: "#111827", lineHeight: 1.1 }}>
            {total}
          </div>
          <div style={{ fontSize: 14, fontWeight: 500, color: "#6B7280" }}>Total</div>
        </div>
      </div>

      {/* Custom legend, rendered OUTSIDE the chart container so it can't shrink the pie */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 16,
          paddingTop: 8,
        }}
      >
        {chartData.map((entry) => {
          const percent = total ? ((entry.value / total) * 100).toFixed(1) : "0.0";
          return (
            <div key={entry.name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor: entry.color,
                  display: "inline-block",
                }}
              />
              <span style={{ fontSize: 13, color: "#374151" }}>
                {entry.name} <span style={{ color: "#6b7280" }}>({percent}%)</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}