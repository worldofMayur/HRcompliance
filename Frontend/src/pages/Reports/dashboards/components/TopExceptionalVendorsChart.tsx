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
  Cell,
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

const colors = [
  "#1677ff",
  "#4096ff",
  "#69b1ff",
  "#91caff",
  "#1677ff",
  "#4096ff",
  "#69b1ff",
  "#91caff",
  "#1677ff",
  "#4096ff",
];

const TopExceptionalVendorsChart: React.FC = () => {
  return (
    <Card
      title="Top 10 Vendors with Exceptional Clearance (Last 12 Months)"
      size="small"
      style={{ height: 370 }}
      bodyStyle={{ height: 310 }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 20,
            left: 10,
            bottom: 55,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
            dataKey="vendor"
            angle={-35}
            textAnchor="end"
            interval={0}
            height={70}
            tick={{ fontSize: 11 }}
          />

          <YAxis
            allowDecimals={false}
            label={{
              value: "Exceptional Clearance Count",
              angle: -90,
              position: "insideLeft",
            }}
          />

          <Tooltip
            formatter={(value: number) => [
              `${value} Clearances`,
              "Count",
            ]}
          />

          <Bar
            dataKey="count"
            radius={[8, 8, 0, 0]}
          >
            {data.map((_, index) => (
              <Cell
                key={index}
                fill={colors[index % colors.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default TopExceptionalVendorsChart;