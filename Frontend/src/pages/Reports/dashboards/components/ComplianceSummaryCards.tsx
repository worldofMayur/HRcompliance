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
      color: "#1677ff",
      icon: <CheckCircleOutlined />,
    },
    {
      title: "Exceptional CC Issued",
      value: summary.exceptionalCC,
      color: "#722ed1",
      icon: <SafetyCertificateOutlined />,
    },
    {
      title: "Under Audit",
      value: summary.underAudit,
      color: "#fa8c16",
      icon: <ClockCircleOutlined />,
    },
    {
      title: "Document Not Submitted",
      value: summary.documentNotSubmitted,
      color: "#f5222d",
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