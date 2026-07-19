import React, { useEffect, useState } from "react";
import { Card, Spin, Empty } from "antd";
import axios from "axios";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

const API_BASE = import.meta.env.VITE_API_URL;

interface DocumentReferenceData {
  document_id: number;
  document_name: string;
  count: number;
}

const COLORS = [
  "#1677ff",
  "#52c41a",
  "#faad14",
  "#ff4d4f",
  "#722ed1",
  "#13c2c2",
  "#2f54eb",
  "#bfbfbf",
  "#fa541c",
  "#389e0d",
  "#9254de",
  "#f759ab",
];

const ExceptionalDocumentReferenceChart: React.FC = () => {
  const [data, setData] = useState<DocumentReferenceData[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchChartData = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("access");

      const response = await axios.get(
        `${API_BASE}/api/vendor/dashboard/document-reference/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setData(response.data);
    } catch (error) {
      console.error("Failed to load document reference chart:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChartData();
  }, []);

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
      {loading ? (
        <div
          style={{
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Spin size="large" />
        </div>
      ) : data.length === 0 ? (
        <Empty description="No Data Available" />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="document_name"
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
              formatter={(value) => (
                <span style={{ fontSize: 12 }}>{value}</span>
              )}
              wrapperStyle={{
                paddingTop: 15,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
};

export default ExceptionalDocumentReferenceChart;