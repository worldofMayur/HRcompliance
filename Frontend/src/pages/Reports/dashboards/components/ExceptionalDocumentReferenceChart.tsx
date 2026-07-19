import React from "react";
import { Card } from "antd";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

const data = [
  { name: "PF Remittance", value: 28 },
  { name: "ESIC Receipt", value: 22 },
  { name: "PT Return", value: 18 },
  { name: "Shop Act", value: 12 },
  { name: "LWF Receipt", value: 8 },
  { name: "Salary Register", value: 6 },
  { name: "Bonus Register", value: 4 },
  { name: "Others", value: 2 },
];

const COLORS = [
  "#1677ff",
  "#52c41a",
  "#faad14",
  "#ff4d4f",
  "#722ed1",
  "#13c2c2",
  "#2f54eb",
  "#bfbfbf",
];

const ExceptionalDocumentReferenceChart: React.FC = () => {
  return (
    <Card
      title="Documents Referenced for Exceptional Clearance"
      size="small"
      style={{ height: 380 }}
      bodyStyle={{
        height: 320,
        padding: "12px 16px",
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="42%"
            outerRadius={85}
            innerRadius={35}
            paddingAngle={3}
            cornerRadius={6}
            label={({ percent }) =>
              `${((percent ?? 0) * 100).toFixed(0)}%`
            }
          >
            {data.map((_, index) => (
              <Cell
                key={index}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>

          <Tooltip
            formatter={(value: number) => [
              `${value} Documents`,
              "Count",
            ]}
          />

          <Legend
            verticalAlign="bottom"
            align="center"
            iconType="circle"
            wrapperStyle={{
              fontSize: 12,
              paddingTop: 15,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default ExceptionalDocumentReferenceChart;