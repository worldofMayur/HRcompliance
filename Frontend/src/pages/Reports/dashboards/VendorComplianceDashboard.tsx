import { Card, Typography, Space, Button } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import axios from "../../../utils/api";

import ComplianceSummaryCards from "./components/ComplianceSummaryCards";
import ComplianceMonthlyTrendChart from "./components/ComplianceMonthlyTrendChart";

const { Text } = Typography;

interface ComplianceSummary {
  ccIssued: number;
  underReview: number;
  reupload: number;
  exceptional: number;
  complied: number;
  nonComplied: number;
}

interface MonthlyTrend {
  month: string;
  ccIssued: number;
  complied: number;
  nonComplied: number;
}

export default function VendorComplianceDashboard() {
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const [summary, setSummary] = useState<ComplianceSummary>({
    ccIssued: 0,
    underReview: 0,
    reupload: 0,
    exceptional: 0,
    complied: 0,
    nonComplied: 0,
  });

  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrend[]>([]);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);

      const [
        summaryRes,
        monthlyTrendRes,
      ] = await Promise.all([
        axios.get("/api/vendor/dashboard/compliance/summary/"),
        axios.get("/api/vendor/dashboard/compliance/monthly-trend/"),
      ]);

      setSummary(summaryRes.data);
      setMonthlyTrend(monthlyTrendRes.data);

      setLastUpdated(new Date());
    } catch (err) {
      console.error("Compliance Dashboard Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Refresh Button */}
      <div className="flex justify-end mb-4">
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={fetchDashboard}
          loading={loading}
          size="middle"
        >
          Refresh Dashboard
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">

        {/* Vendor Compliance Summary */}
        <Card
          style={{ height: 390 }}
          loading={loading}
          title={
            <Space>
              <span>📊</span>
              <span>Vendor Compliance Summary</span>
            </Space>
          }
        >
          <ComplianceSummaryCards
            data={summary}
          />
        </Card>

        {/* Monthly Compliance Trend */}
        <Card
          style={{ height: 390 }}
          loading={loading}
          title={
            <Space>
              <span>📈</span>
              <span>Monthly Compliance Trend</span>
            </Space>
          }
          extra={
            <Text type="secondary" style={{ fontSize: 12 }}>
              Audit Period
            </Text>
          }
        >
          <ComplianceMonthlyTrendChart
            data={monthlyTrend}
          />
        </Card>

        {/* Vendor Wise Compliance */}
        <Card
          style={{ height: 390 }}
          loading={loading}
          title={
            <Space>
              <span>🏢</span>
              <span>Vendor Wise Compliance</span>
            </Space>
          }
        >
          Coming Soon...
        </Card>

        {/* Compliance Status Distribution */}
        <Card
          style={{ height: 390 }}
          loading={loading}
          title={
            <Space>
              <span>🧩</span>
              <span>Compliance Status Distribution</span>
            </Space>
          }
        >
          Coming Soon...
        </Card>

      </div>

      {/* Footer */}
      <div className="text-center mt-6">
        <Text type="secondary" style={{ fontSize: 13 }}>
          Updated:{" "}
          {lastUpdated.toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </div>
    </>
  );
}