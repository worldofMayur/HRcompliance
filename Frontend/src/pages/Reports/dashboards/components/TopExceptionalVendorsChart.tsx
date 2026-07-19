import React from "react";
import { Card } from "antd";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  LabelList,
} from "recharts";

const data = [
  { vendor: "ABC Ltd", count: 15 },
  { vendor: "XYZ Services", count: 13 },
  { vendor: "Delta Corp", count: 12 },
  { vendor: "Sun Tech", count: 10 },
  { vendor: "Prime Solutions", count: 9 },
  { vendor: "Vision Pvt", count: 8 },
  { vendor: "Secure Co", count: 7 },
  { vendor: "Global HR", count: 6 },
  { vendor: "Quick Staff", count: 5 },
  { vendor: "Apex Group", count: 4 },
];

const TopExceptionalVendorsChart: React.FC = () => {
  return (
    <Card
      title="Top 10 Vendors with Exceptional Clearance (Last 12 Months)"
      size="small"
      style={{ height: 380 }}
      bodyStyle={{
        height: 320,
        padding: "12px 18px",
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 20,
            left: 30,
            bottom: 70,
          }}
        >
          <CartesianGrid
            stroke="#f0f0f0"
            strokeDasharray="3 3"
            vertical={false}
          />

          <XAxis
            dataKey="vendor"
            angle={-35}
            textAnchor="end"
            interval={0}
            height={65}
            tick={{
              fontSize: 11,
              fill: "#555",
            }}
          />

          <YAxis
            allowDecimals={false}
            width={40}
            tick={{
              fontSize: 12,
              fill: "#555",
            }}
          />

          <Tooltip
            cursor={{ fill: "#f5f5f5" }}
            formatter={(value: number) => [
              `${value} Clearances`,
              "Count",
            ]}
          />

          <Bar
            dataKey="count"
            fill="#1677ff"
            radius={[8, 8, 0, 0]}
            animationDuration={700}
          >
            <LabelList
              dataKey="count"
              position="top"
              style={{
                fontSize: 12,
                fontWeight: 600,
                fill: "#1677ff",
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default TopExceptionalVendorsChart;