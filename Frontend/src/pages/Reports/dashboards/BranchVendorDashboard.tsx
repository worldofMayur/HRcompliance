import { Card, Statistic, Row, Col } from "antd";
import {
  ApartmentOutlined,
  BankOutlined,
  TeamOutlined,
  UsergroupAddOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import axios from "../../../utils/api";

import StateSummaryTable from "./components/StateSummaryTable";
import MonthlyTrendChart from "./components/MonthlyTrendChart";
import TopBranchesTable from "./components/TopBranchesTable";
import ServiceDistributionChart from "./components/ServiceDistributionChart";

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
  branch__branch_name: string;
  branch__state: string;
  unique_vendors: number;
}

interface ServiceDistribution {
  service: string;
  vendors: number;
}

export default function BranchVendorDashboard() {
  const [loading, setLoading] = useState(true);

  const [kpi, setKpi] = useState<KPIResponse>({
    total_states: 0,
    total_branches: 0,
    total_vendor_mappings: 0,
    unique_vendors: 0,
  });

  const [summary, setSummary] = useState<StateSummary[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrend[]>([]);
  const [topBranches, setTopBranches] = useState<TopBranch[]>([]);
  const [serviceDistribution, setServiceDistribution] = useState<
    ServiceDistribution[]
  >([]);

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
    } catch (err) {
      console.error("Dashboard Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* KPI Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <Card loading={loading}>
            <Statistic
              title="States"
              value={kpi.total_states}
              prefix={<ApartmentOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} xl={6}>
          <Card loading={loading}>
            <Statistic
              title="Branches"
              value={kpi.total_branches}
              prefix={<BankOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} xl={6}>
          <Card loading={loading}>
            <Statistic
              title="Vendor Mappings"
              value={kpi.total_vendor_mappings}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} xl={6}>
          <Card loading={loading}>
            <Statistic
              title="Unique Vendors"
              value={kpi.unique_vendors}
              prefix={<UsergroupAddOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Dashboard Layout */}
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">

        {/* Top Left */}
        <Card
          title="State Wise Vendor Summary"
          loading={loading}
        >
          <StateSummaryTable
            data={summary}
            loading={loading}
          />
        </Card>

        {/* Top Right */}
        <Card
          title="Unique Active Vendors Trend (Last 6 Months)"
          loading={loading}
        >
          <MonthlyTrendChart
            data={monthlyTrend}
          />
        </Card>

        {/* Bottom Left */}
        <Card
          title="Top 10 Branches by Unique Vendor Count"
          loading={loading}
        >
          <TopBranchesTable
            data={topBranches}
            loading={loading}
          />
        </Card>

        {/* Bottom Right */}
        <Card
          title="Nature of Service Distribution"
          loading={loading}
        >
          <ServiceDistributionChart
            data={serviceDistribution}
          />
        </Card>

      </div>
    </>
  );
}