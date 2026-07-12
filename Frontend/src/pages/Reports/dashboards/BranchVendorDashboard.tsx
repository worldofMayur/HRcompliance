import { Card, Typography, Space, Button } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import axios from "../../../utils/api";

import StateSummaryTable from "./components/StateSummaryTable";
import MonthlyTrendChart from "./components/MonthlyTrendChart";
import ServiceDistributionChart from "./components/ServiceDistributionChart";
import AllBranchesVendorTable from "./components/AllBranchesVendorTable";

const { Text } = Typography;

export default function BranchVendorDashboard() {
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const [summary, setSummary] = useState<any[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);
  const [serviceDistribution, setServiceDistribution] = useState<any[]>([]);
  const [allBranchesVendors, setAllBranchesVendors] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);

      const [
        summaryRes,
        trendRes,
        serviceRes,
        allBranchesRes,
      ] = await Promise.all([
        axios.get("/api/vendor/dashboard/branch/state-summary/"),
        axios.get("/api/vendor/dashboard/branch/monthly-trend/"),
        axios.get("/api/vendor/dashboard/branch/service-distribution/"),
        axios.get("/api/vendor/dashboard/branch/all-branches-vendors/"),
      ]);

      setSummary(summaryRes.data);
      setMonthlyTrend(trendRes.data);
      setServiceDistribution(serviceRes.data);
      setAllBranchesVendors(allBranchesRes.data);

      setLastUpdated(new Date());

    } catch (err) {
      console.error("Dashboard Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => fetchDashboard();

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={handleRefresh}
          loading={loading}
        >
          Refresh Dashboard
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">

        {/* State Summary */}
        <Card
          style={{ height: 390 }}
          title={
            <Space>
              <span>📊</span>
              <span>State Wise Vendor Summary</span>
            </Space>
          }
        >
          <StateSummaryTable
            data={summary}
            loading={loading}
          />
        </Card>

        {/* Monthly Trend */}
        <Card
          style={{ height: 390 }}
          title={
            <Space>
              <span>📈</span>
              <span>Pan India Unique Vendor Count</span>
            </Space>
          }
        >
          <MonthlyTrendChart
            data={monthlyTrend}
          />
        </Card>

        {/* Vendors Working in All Branches */}
        <Card
          style={{ height: 390 }}
          title={
            <Space>
              <span>🌐</span>
              <span>Vendors Working in All Branches</span>
            </Space>
          }
        >
          <AllBranchesVendorTable
            data={allBranchesVendors}
            loading={loading}
          />
        </Card>

        {/* Nature of Service */}
        <Card
          style={{ height: 390 }}
          title={
            <Space>
              <span>🧩</span>
              <span>Nature of Service Distribution</span>
            </Space>
          }
        >
          <ServiceDistributionChart
            data={serviceDistribution}
          />
        </Card>

      </div>

      <div className="text-center mt-6 text-gray-500 text-sm">
        Updated: {lastUpdated.toLocaleString("en-IN")}
      </div>
    </>
  );
}