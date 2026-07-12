import { Card, Col, Row, Statistic } from "antd";

interface Props {
  data?: {
    ccIssued: number;
    underReview: number;
    reupload: number;
    exceptional: number;
    complied: number;
    nonComplied: number;
  };
}

export default function ComplianceSummaryCards({ data }: Props) {
  const summary = data || {
    ccIssued: 0,
    underReview: 0,
    reupload: 0,
    exceptional: 0,
    complied: 0,
    nonComplied: 0,
  };

  return (
    <Row gutter={[16, 16]}>
      <Col span={8}>
        <Card>
          <Statistic title="CC Issued" value={summary.ccIssued} />
        </Card>
      </Col>

      <Col span={8}>
        <Card>
          <Statistic title="Under Review" value={summary.underReview} />
        </Card>
      </Col>

      <Col span={8}>
        <Card>
          <Statistic title="Reupload" value={summary.reupload} />
        </Card>
      </Col>

      <Col span={8}>
        <Card>
          <Statistic title="Exceptional" value={summary.exceptional} />
        </Card>
      </Col>

      <Col span={8}>
        <Card>
          <Statistic title="Complied" value={summary.complied} />
        </Card>
      </Col>

      <Col span={8}>
        <Card>
          <Statistic title="Non Complied" value={summary.nonComplied} />
        </Card>
      </Col>
    </Row>
  );
}