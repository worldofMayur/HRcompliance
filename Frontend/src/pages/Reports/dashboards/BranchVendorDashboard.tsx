import { Card, Statistic, Row, Col } from "antd";
import {
  ApartmentOutlined,
  BankOutlined,
  TeamOutlined,
  UsergroupAddOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import axios from "../../../utils/api";

interface KPIResponse {
  total_states: number;
  total_branches: number;
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

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        "/api/vendor/dashboard/branch/kpi/"
      );

      setKpi(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
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
  );
}