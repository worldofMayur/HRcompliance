import { Card, Statistic, Row, Col } from "antd";
import {
  ApartmentOutlined,
  BankOutlined,
  TeamOutlined,
  UsergroupAddOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import axios from "../../../utils/api";

import StateSummaryTable from "../dashboards/components/StateSummaryTable"

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

export default function BranchVendorDashboard() {
  const [loading, setLoading] = useState(true);

  const [kpi, setKpi] = useState<KPIResponse>({
    total_states: 0,
    total_branches: 0,
    total_vendor_mappings: 0,
    unique_vendors: 0,
  });

  const [summary, setSummary] = useState<StateSummary[]>([]);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);

      const [kpiRes, summaryRes] = await Promise.all([
        axios.get("/api/vendor/dashboard/branch/kpi/"),
        axios.get("/api/vendor/dashboard/branch/state-summary/"),
      ]);

      setKpi(kpiRes.data);
      setSummary(summaryRes.data);
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

      {/* State Summary Table */}
      <div className="mt-6">
        <Card title="State Wise Vendor Summary" loading={loading}>
          <StateSummaryTable
            data={summary}
            loading={loading}
          />
        </Card>
      </div>
    </>
  );
}