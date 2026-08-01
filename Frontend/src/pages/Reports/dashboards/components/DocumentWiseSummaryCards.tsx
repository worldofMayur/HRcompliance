import {
  FileDoneOutlined,
  EyeOutlined,
  UploadOutlined,
  StarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";

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

  const cards = [
    {
      title: "CC ISSUED",
      value: summary.ccIssued,
      bg: "bg-blue-50",
      icon: <FileDoneOutlined className="text-blue-500 text-sm" />,
    },
    {
      title: "UNDER REVIEW",
      value: summary.underReview,
      bg: "bg-cyan-50",
      icon: <EyeOutlined className="text-cyan-500 text-sm" />,
    },
    {
      title: "REUPLOAD",
      value: summary.reupload,
      bg: "bg-orange-50",
      icon: <UploadOutlined className="text-orange-500 text-sm" />,
    },
    {
      title: "EXCEPTIONAL",
      value: summary.exceptional,
      bg: "bg-purple-50",
      icon: <StarOutlined className="text-purple-500 text-sm" />,
    },
    {
      title: "COMPLIED",
      value: summary.complied,
      bg: "bg-emerald-50",
      icon: <CheckCircleOutlined className="text-emerald-500 text-sm" />,
    },
    {
      title: "NON COMPLIED",
      value: summary.nonComplied,
      bg: "bg-rose-50",
      icon: <CloseCircleOutlined className="text-rose-500 text-sm" />,
    },
  ];

  return (
    <div className="grid grid-cols-6 gap-3">
      {cards.map((card) => (
        <div
          key={card.title}
          className={`relative rounded-xl ${card.bg} px-3 py-2.5`}
        >
          <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
            {card.title}
          </div>

          <div className="mt-1 text-xl font-semibold text-gray-900">
            {card.value}
          </div>

          <div className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm">
            {card.icon}
          </div>
        </div>
      ))}
    </div>
  );
}