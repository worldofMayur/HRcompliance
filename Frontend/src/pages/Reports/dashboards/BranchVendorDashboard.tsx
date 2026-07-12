import { Card, Typography, Space, Button, Empty } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import axios from "../../../utils/api";

import StateSummaryTable from "./components/StateSummaryTable";
import MonthlyTrendChart from "./components/MonthlyTrendChart";
import TopBranchesTable from "./components/TopBranchesTable";
import ServiceDistributionChart from "./components/ServiceDistributionChart";
import AllBranchesVendorTable from "./components/AllBranchesVendorTable";

const { Text } = Typography;

export default function BranchVendorDashboard() {
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const [summary, setSummary] = useState<any[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);
  const [topBranches, setTopBranches] = useState<any[]>([]);
  const [serviceDistribution, setServiceDistribution] = useState<any[]>([]);

  // New: Filter "All Branches" data for the dedicated table
  const [allBranchesVendors, setAllBranchesVendors] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);

      const [summaryRes, trendRes, topRes, serviceRes] = await Promise.all([
        axios.get("/api/vendor/dashboard/branch/state-summary/"),
        axios.get("/api/vendor/dashboard/branch/monthly-trend/"),
        axios.get("/api/vendor/dashboard/branch/top-branches/"),
        axios.get("/api/vendor/dashboard/branch/service-distribution/"),
      ]);

      const topData = topRes.data || [];

      // Extract "All Branches" entries for the new table
      const allBranchesData = topData
        .filter((item: any) => 
          item.branch_name?.toLowerCase().includes("all branches")
        )
        .map((item: any) => ({
          state: item.state,
          vendor_name: "All Vendors",           // You can improve this from backend later
          nature_of_services: "Multiple",       // Placeholder - update from real data if available
          total_branches: item.unique_vendors || 1,
        }));

      setSummary(summaryRes.data);
      setMonthlyTrend(trendRes.data);
      setTopBranches(topData);
      setServiceDistribution(serviceRes.data);
      setAllBranchesVendors(allBranchesData);
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
        <Button type="primary" icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
          Refresh Dashboard
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">

        <Card style={{ height: 390 }} title={<Space><span>📊</span>State Wise Vendor Summary</Space>}>
          <StateSummaryTable data={summary} loading={loading} />
        </Card>

        <Card style={{ height: 390 }} title={<Space><span>📈</span>Pan India Unique Vendor Count</Space>}>
          <MonthlyTrendChart data={monthlyTrend} />
        </Card>

        <Card 
            className="mt-6" 
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

        <Card style={{ height: 390 }} title={<Space><span>🧩</span>Nature of Service Distribution</Space>}>
          <ServiceDistributionChart data={serviceDistribution} />
        </Card>

      </div>

      {/* Vendors Working in All Branches */}


      <div className="text-center mt-6 text-gray-500 text-sm">
        Updated: {lastUpdated.toLocaleString("en-IN")}
      </div>
    </>
  );
}