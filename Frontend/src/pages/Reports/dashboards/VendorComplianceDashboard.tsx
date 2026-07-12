import { Card, Typography, Space, Button, Row, Col } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import axios from "../../../utils/api";

import ComplianceSummaryCards from "./components/ComplianceSummaryCards";
import ComplianceMonthlyTrendChart from "./components/ComplianceMonthlyTrendChart";
import VendorWiseComplianceChart from "./components/VendorWiseComplianceChart";
import CompliancePieChart from "./components/CompliancePieChart";

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

interface VendorWiseData {
  vendor__name: string;
  vendor__short_name: string;
  total: number;
  cc_issued: number;
  complied: number;
  non_complied: number;
  exceptional: number;
  under_review: number;
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
  const [vendorWise, setVendorWise] = useState<VendorWiseData[]>([]);
  const [distribution, setDistribution] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);

      const [summaryRes, monthlyTrendRes, vendorRes, distRes] = await Promise.all([
        axios.get("/api/vendor/dashboard/compliance/summary/"),
        axios.get("/api/vendor/dashboard/compliance/monthly-trend/"),
        axios.get("/api/vendor/dashboard/compliance/vendor-wise/"),
        axios.get("/api/vendor/dashboard/compliance/status-distribution/"),
      ]);

      setSummary(summaryRes.data);
      setMonthlyTrend(monthlyTrendRes.data);
      setVendorWise(vendorRes.data);
      setDistribution(distRes.data.distribution || {});

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

      <div className="grid grid-cols-1 gap-6">
        {/* Summary Cards */}
        <Card
          loading={loading}
          title={
            <Space>
              <span>📊</span>
              <span>Vendor Compliance Summary</span>
            </Space>
          }
        >
          <ComplianceSummaryCards data={summary} />
        </Card>

        <Row gutter={[16, 16]}>
          {/* Monthly Trend */}
          <Col xs={24} xl={12}>
            <Card
              style={{ height: "100%" }}
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
              <ComplianceMonthlyTrendChart data={monthlyTrend} />
            </Card>
          </Col>

          {/* Compliance Status Distribution */}
          <Col xs={24} xl={12}>
            <Card
              style={{ height: "100%" }}
              loading={loading}
              title={
                <Space>
                  <span>🧩</span>
                  <span>Compliance Status Distribution</span>
                </Space>
              }
            >
              <CompliancePieChart data={distribution} />
            </Card>
          </Col>
        </Row>

        {/* Vendor Wise Compliance */}
        <Card
          loading={loading}
          title={
            <Space>
              <span>🏢</span>
              <span>Vendor Wise Compliance</span>
            </Space>
          }
        >
          <VendorWiseComplianceChart data={vendorWise} />
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