import { Button, Card, Row, Col } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import ComplianceSummaryCards from "./components/ComplianceSummaryCards";

export default function VendorComplianceDashboard() {
  return (
    <div className="space-y-6">

      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button
          type="primary"
          icon={<ReloadOutlined />}
        >
          Refresh Dashboard
        </Button>
      </div>

      {/* Top Row */}
      <Row gutter={[24, 24]}>
        <Col xs={24} xl={12}>
        <Card
        title="Vendor Compliance Summary"
        bordered
        >
        <ComplianceSummaryCards />
        </Card>
        </Col>

        <Col xs={24} xl={12}>
          <Card
            title="Monthly Compliance Trend"
            bordered
          >
            Coming Soon...
          </Card>
        </Col>
      </Row>

      {/* Bottom Row */}
      <Row gutter={[24, 24]}>
        <Col xs={24} xl={12}>
          <Card
            title="Vendor Wise Compliance"
            bordered
          >
            Coming Soon...
          </Card>
        </Col>

        <Col xs={24} xl={12}>
          <Card
            title="Compliance Status Distribution"
            bordered
          >
            Coming Soon...
          </Card>
        </Col>
      </Row>

    </div>
  );
}