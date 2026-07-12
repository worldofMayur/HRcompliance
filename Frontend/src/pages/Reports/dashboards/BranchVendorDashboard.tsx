import { Card, Typography, Space, Empty } from "antd";
import { useEffect, useState } from "react";
import axios from "../../../utils/api";

import StateSummaryTable from "./components/StateSummaryTable";
import MonthlyTrendChart from "./components/MonthlyTrendChart";
import TopBranchesTable from "./components/TopBranchesTable";
import ServiceDistributionChart from "./components/ServiceDistributionChart";

const { Text } = Typography;

interface KPIResponse {
  total_states: number;
  total_branches: number;
  total_vendor_mappings: number;
  unique_vendors: number;
}

interface StateSummary {
  branch__state: string;
  branch_count: number;
  total_vendor_mappings: number;
  unique_vendors: number;
}

interface MonthlyTrend {
  month: string;
  unique_vendors: number;
}

interface TopBranch {
  branch_name: string;
  state: string;
  unique_vendors: number;
}

interface ServiceDistribution {
  service: string;
  vendors: number;
}

export default function BranchVendorDashboard() {
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const [kpi, setKpi] = useState<KPIResponse>({
    total_states: 0,
    total_branches: 0,
    total_vendor_mappings: 0,
    unique_vendors: 0,
  });

  const [summary, setSummary] = useState<StateSummary[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrend[]>([]);
  const [topBranches, setTopBranches] = useState<TopBranch[]>([]);
  const [serviceDistribution, setServiceDistribution] = useState<ServiceDistribution[]>([]);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);

      const [
        kpiRes,
        summaryRes,
        trendRes,
        topBranchesRes,
        serviceRes,
      ] = await Promise.all([
        axios.get("/api/vendor/dashboard/branch/kpi/"),
        axios.get("/api/vendor/dashboard/branch/state-summary/"),
        axios.get("/api/vendor/dashboard/branch/monthly-trend/"),
        axios.get("/api/vendor/dashboard/branch/top-branches/"),
        axios.get("/api/vendor/dashboard/branch/service-distribution/"),
      ]);

      setKpi(kpiRes.data);
      setSummary(summaryRes.data);
      setMonthlyTrend(trendRes.data);
      setTopBranches(topBranchesRes.data);
      setServiceDistribution(serviceRes.data);
      setLastUpdated(new Date());

    } catch (err) {
      console.error("Dashboard Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle widget clicks (for future filtering)
  const handleStateClick = (state: string) => {
    console.log("Filter by State:", state);
    // TODO: Apply global filter
  };

  const handleBranchClick = (branchName: string) => {
    console.log("Filter by Branch:", branchName);
    // TODO: Apply global filter
  };

  const handleServiceClick = (service: string) => {
    console.log("Filter by Service:", service);
    // TODO: Apply global filter
  };

  const isEmpty = summary.length === 0 && topBranches.length === 0;

  return (
    <>
      <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2">

        {/* State Wise Summary */}
        <Card
          style={{ height: 380 }}
          title={
            <Space>
              <span>📊</span>
              <span>State Wise Vendor Summary</span>
            </Space>
          }
          loading={loading}
          extra={<Text type="secondary" style={{ fontSize: 12 }}>Active Mappings</Text>}
        >
          {isEmpty ? (
            <Empty description="No Vendor Mapping Data Available" />
          ) : (
            <StateSummaryTable
              data={summary}
              loading={loading}
              onRowClick={handleStateClick}
            />
          )}
        </Card>

        {/* Monthly Trend */}
        <Card
          style={{ height: 380 }}
          title={
            <Space>
              <span>📈</span>
              <span>Monthly Compliance Activity</span>
            </Space>
          }
          loading={loading}
          extra={
            <Text type="secondary" style={{ fontSize: 12 }}>
              Last 6 Months
            </Text>
          }
        >
          <MonthlyTrendChart data={monthlyTrend} />
        </Card>

        {/* Top Branches */}
        <Card
          style={{ height: 380 }}
          title={
            <Space>
              <span>🏢</span>
              <span>Top 10 Branches by Vendor Count</span>
            </Space>
          }
          loading={loading}
        >
          {isEmpty ? (
            <Empty description="No Vendor Mapping Data Available" />
          ) : (
            <TopBranchesTable
              data={topBranches}
              loading={loading}
              onRowClick={handleBranchClick}
            />
          )}
        </Card>

        {/* Service Distribution */}
        <Card
          style={{ height: 380 }}
          title={
            <Space>
              <span>🧩</span>
              <span>Nature of Service Distribution</span>
            </Space>
          }
          loading={loading}
        >
          {isEmpty ? (
            <Empty description="No Vendor Mapping Data Available" />
          ) : (
            <ServiceDistributionChart
              data={serviceDistribution}
              onSliceClick={handleServiceClick}
            />
          )}
        </Card>

      </div>

      {/* Global Footer */}
      <div className="text-center mt-6">
        <Text type="secondary" style={{ fontSize: 13 }}>
          Updated: {lastUpdated.toLocaleString("en-IN", { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
      </div>
    </>
  );
}