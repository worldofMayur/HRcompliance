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
    <Row gutter={[8, 8]}>
      <Col span={4}>
        <Card size="small" styles={{ body: { padding: "12px 16px" } }}>
          <Statistic
            title="CC Issued"
            value={summary.ccIssued}
            valueStyle={{ fontSize: 20, fontWeight: 600 }}
          />
        </Card>
      </Col>

      <Col span={4}>
        <Card size="small" styles={{ body: { padding: "12px 16px" } }}>
          <Statistic
            title="Under Review"
            value={summary.underReview}
            valueStyle={{ fontSize: 20, fontWeight: 600 }}
          />
        </Card>
      </Col>

      <Col span={4}>
        <Card size="small" styles={{ body: { padding: "12px 16px" } }}>
          <Statistic
            title="Reupload"
            value={summary.reupload}
            valueStyle={{ fontSize: 20, fontWeight: 600 }}
          />
        </Card>
      </Col>

      <Col span={4}>
        <Card size="small" styles={{ body: { padding: "12px 16px" } }}>
          <Statistic
            title="Exceptional"
            value={summary.exceptional}
            valueStyle={{ fontSize: 20, fontWeight: 600 }}
          />
        </Card>
      </Col>

      <Col span={4}>
        <Card size="small" styles={{ body: { padding: "12px 16px" } }}>
          <Statistic
            title="Complied"
            value={summary.complied}
            valueStyle={{ fontSize: 20, fontWeight: 600 }}
          />
        </Card>
      </Col>

      <Col span={4}>
        <Card size="small" styles={{ body: { padding: "12px 16px" } }}>
          <Statistic
            title="Non Complied"
            value={summary.nonComplied}
            valueStyle={{ fontSize: 20, fontWeight: 600 }}
          />
        </Card>
      </Col>
    </Row>
  );
}