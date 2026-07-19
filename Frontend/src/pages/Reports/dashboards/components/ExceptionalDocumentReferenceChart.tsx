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

const COLORS = ["#1677ff", "#52c41a", "#faad14", "#ff4d4f", "#722ed1", "#13c2c2"];

const ExceptionalDocumentReferenceChart: React.FC = () => {
  const [data, setData] = useState<DocumentReferenceData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChartData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("access");
      if (!token) {
        setError("No token found. Please login again.");
        return;
      }

      const response = await axios.get(
        `${API_BASE}/api/vendor/dashboard/document-reference/`,
        {
          headers: { Authorization: `Bearer ${token}` },
          // Add current PE context if needed
          params: {
            // pe_id can be omitted if the view uses request.user
          },
        }
      );

      setData(response.data);
    } catch (err: any) {
      console.error("Failed to load document reference chart:", err);
      
      if (err.response?.status === 401) {
        setError("Session expired. Please refresh the page or login again.");
        // Optional: trigger token refresh logic here
        localStorage.removeItem("access"); // force re-login
      } else {
        setError("Failed to load data");
      }
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
      bodyStyle={{ height: 320, padding: "12px 16px" }}
    >
      {loading ? (
        <div style={{ height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <Spin size="large" />
        </div>
      ) : error ? (
        <Empty description={error} />
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
              label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
            >
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => [`${value} Documents`, "Count"]} />
            <Legend
              verticalAlign="bottom"
              align="center"
              iconType="circle"
              formatter={(value) => <span style={{ fontSize: 12 }}>{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
};

export default ExceptionalDocumentReferenceChart;