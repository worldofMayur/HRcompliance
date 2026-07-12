import { Row, Col, Space } from "antd";

import ExceptionalStateSummaryTable from "./components/ExceptionalStateSummaryTable";
import TopExceptionalVendorsChart from "./components/TopExceptionalVendorsChart";
import ExceptionalDocumentReferenceChart from "./components/ExceptionalDocumentReferenceChart";

export default function ExceptionalApprovalDashboard() {
  return (
    <Row gutter={[16, 16]}>
<Col xs={24} xl={12}>
        <ExceptionalStateSummaryTable />
      </Col>

      <Col xs={24} xl={12}>
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <TopExceptionalVendorsChart />
          <ExceptionalDocumentReferenceChart />
        </Space>
      </Col>
    </Row>
  );
}