import React, { useEffect, useState } from "react";
import { Card } from "antd";
import axios from "axios";
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

const API_BASE = import.meta.env.VITE_API_URL;

const TopExceptionalVendorsChart: React.FC = () => {

  const [data, setData] = useState<
    { vendor: string; count: number }[]
  >([]);

  const [loading, setLoading] = useState(false);

useEffect(() => {
  setLoading(true);

  axios.get(
      `${API_BASE}/api/vendor/dashboard/exceptional/top-vendors/`,
      {
          headers: {
              Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
      }
  )
    .then((res) => {
      setData(res.data);
    })
    .catch((err) => {
      console.error(err);
    })
    .finally(() => {
      setLoading(false);
    });
}, []);

  return (
    <Card
    loading={loading}
      title="Top 10 Vendors with Exceptional Clearance (Last 12 Months)"
      size="small"
      style={{ height: 380 }}
      bodyStyle={{
        height: 390,
        padding: "12px 20px",
      }}
    >
      {data.length === 0 ? (
          <div
              style={{
                  height: "100%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  color: "#888",
              }}
          >
              No exceptional clearance records found.
          </div>
      ) : (
          <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 30,
            right: 30,
            left: 35,
            bottom: 85,
          }}
        >
          <CartesianGrid
            stroke="#e8e8e8"
            strokeDasharray="4 4"
            vertical={false}
          />

          <XAxis
            dataKey="vendor"
            interval={0}
            angle={-35}
            textAnchor="end"
            height={80}
            tick={{
              fontSize: 11,
              fill: "#555",
            }}
            label={{
              value: "Vendor Name",
              position: "insideBottom",
              offset: -5,
              style: {
                fill: "#555",
                fontSize: 13,
                fontWeight: 600,
              },
            }}
          />

          <YAxis
            allowDecimals={false}
            width={70}
            tick={{
              fontSize: 12,
              fill: "#555",
            }}
            label={{
              value: "Exceptional Clearances",
              angle: -90,
              position: "insideLeft",
              offset: -20,
              style: {
                fill: "#555",
                fontSize: 13,
                fontWeight: 600,
                textAnchor: "middle",
              },
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
            barSize={42}
            animationDuration={800}
          >
            <LabelList
              dataKey="count"
              position="top"
              style={{
                fill: "#1677ff",
                fontSize: 12,
                fontWeight: 600,
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      )}
    </Card>
  );
};

export default TopExceptionalVendorsChart;