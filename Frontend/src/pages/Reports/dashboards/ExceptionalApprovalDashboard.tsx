import { Row, Col } from "antd";

import ExceptionalStateSummaryTable from "./components/ExceptionalStateSummaryTable";
import TopExceptionalVendorsChart from "./components/TopExceptionalVendorsChart";
import ExceptionalDocumentReferenceChart from "./components/ExceptionalDocumentReferenceChart";

export default function ExceptionalApprovalDashboard() {
  return (
    <div className="space-y-6">

      {/* Full Width Table */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <ExceptionalStateSummaryTable />
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <TopExceptionalVendorsChart />
        </Col>

        <Col xs={24} lg={12}>
          <ExceptionalDocumentReferenceChart />
        </Col>
      </Row>

    </div>
  );
}