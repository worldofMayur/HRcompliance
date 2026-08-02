import {
  Card,
  Col,
  Row,
  Statistic,
} from "antd";

import {
  CheckCircleOutlined,
  SafetyCertificateOutlined,
  ClockCircleOutlined,
  FileExclamationOutlined,
} from "@ant-design/icons";

interface Props {
  data?: {
    ccIssued: number;
    exceptionalCC: number;
    underAudit: number;
    documentNotSubmitted: number;
  };
}

export default function ComplianceSummaryCards({
  data,
}: Props) {
  const summary = data || {
    ccIssued: 0,
    exceptionalCC: 0,
    underAudit: 0,
    documentNotSubmitted: 0,
  };

const cards = [
  {
    title: "CC Issued",
    value: summary.ccIssued,
    color: "#22C55E", // Green
    icon: <CheckCircleOutlined />,
  },
  {
    title: "Exceptional CC Issued",
    value: summary.exceptionalCC,
    color: "#F59E0B", // Amber
    icon: <SafetyCertificateOutlined />,
  },
  {
    title: "Under Audit",
    value: summary.underAudit,
    color: "#3B82F6", // Blue
    icon: <ClockCircleOutlined />,
  },
  {
    title: "Document Not Submitted",
    value: summary.documentNotSubmitted,
    color: "#EF4444", // Red
    icon: <FileExclamationOutlined />,
  },
];

  return (
    <Row gutter={[16, 16]}>
      {cards.map((card) => (
        <Col
          xs={24}
          sm={12}
          xl={6}
          key={card.title}
        >
          <Card
            hoverable
            size="small"
            styles={{
              body: {
                padding: 18,
              },
            }}
          >
            <Statistic
              title={card.title}
              value={card.value}
              prefix={card.icon}
              valueStyle={{
                color: card.color,
                fontSize: 28,
                fontWeight: 700,
              }}
            />
          </Card>
        </Col>
      ))}
    </Row>
  );
}