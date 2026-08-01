import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileDoneOutlined,
} from "@ant-design/icons";

interface TrendData {
  month: string;
  pf: number;
  esic: number;
  pf_before_15: number;
  pf_after_15: number;
  esic_before_15: number;
  esic_after_15: number;
}

interface Props {
  data: TrendData[];
}

export default function DocumentWiseSummaryCards({
  data,
}: Props) {

  const totalPFBefore15 = data.reduce(
    (sum, item) => sum + item.pf_before_15,
    0
  );

  const totalPFAfter15 = data.reduce(
    (sum, item) => sum + item.pf_after_15,
    0
  );

  const totalESICBefore15 = data.reduce(
    (sum, item) => sum + item.esic_before_15,
    0
  );

  const totalESICAfter15 = data.reduce(
    (sum, item) => sum + item.esic_after_15,
    0
  );

  const avgPF =
    data.filter((x) => x.pf > 0).length > 0
      ? (
          data.reduce((sum, item) => sum + item.pf, 0) /
          data.filter((x) => x.pf > 0).length
        ).toFixed(1)
      : "0";

  const avgESIC =
    data.filter((x) => x.esic > 0).length > 0
      ? (
          data.reduce((sum, item) => sum + item.esic, 0) /
          data.filter((x) => x.esic > 0).length
        ).toFixed(1)
      : "0";

  const cards = [
    {
      title: "Average PF Day",
      value: avgPF,
      icon: <CalendarOutlined className="text-blue-600 text-2xl" />,
      bg: "bg-blue-50",
    },
    {
      title: "Average ESIC Day",
      value: avgESIC,
      icon: <FileDoneOutlined className="text-green-600 text-2xl" />,
      bg: "bg-green-50",
    },
    {
      title: "PF Before 15th",
      value: totalPFBefore15,
      icon: <CheckCircleOutlined className="text-emerald-600 text-2xl" />,
      bg: "bg-emerald-50",
    },
    {
      title: "PF After 15th",
      value: totalPFAfter15,
      icon: <ClockCircleOutlined className="text-orange-600 text-2xl" />,
      bg: "bg-orange-50",
    },
    {
      title: "ESIC Before 15th",
      value: totalESICBefore15,
      icon: <CheckCircleOutlined className="text-cyan-600 text-2xl" />,
      bg: "bg-cyan-50",
    },
    {
      title: "ESIC After 15th",
      value: totalESICAfter15,
      icon: <ClockCircleOutlined className="text-red-600 text-2xl" />,
      bg: "bg-red-50",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.title}
          className={`rounded-xl border ${card.bg} p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                {card.title}
              </p>

              <h2 className="mt-2 text-3xl font-bold text-gray-900">
                {card.value}
              </h2>
            </div>

            <div>{card.icon}</div>
          </div>
        </div>
      ))}
    </div>
  );
}