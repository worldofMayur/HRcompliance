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
      icon: <CalendarOutlined className="text-lg text-blue-600" />,
      bg: "bg-blue-50 border-blue-100",
    },
    {
      title: "Average ESIC Day",
      value: avgESIC,
      icon: <FileDoneOutlined className="text-lg text-green-600" />,
      bg: "bg-green-50 border-green-100",
    },
    {
      title: "PF Before 15th",
      value: totalPFBefore15,
      icon: <CheckCircleOutlined className="text-lg text-emerald-600" />,
      bg: "bg-emerald-50 border-emerald-100",
    },
    {
      title: "PF After 15th",
      value: totalPFAfter15,
      icon: <ClockCircleOutlined className="text-lg text-orange-600" />,
      bg: "bg-orange-50 border-orange-100",
    },
    {
      title: "ESIC Before 15th",
      value: totalESICBefore15,
      icon: <CheckCircleOutlined className="text-lg text-cyan-600" />,
      bg: "bg-cyan-50 border-cyan-100",
    },
    {
      title: "ESIC After 15th",
      value: totalESICAfter15,
      icon: <ClockCircleOutlined className="text-lg text-red-600" />,
      bg: "bg-red-50 border-red-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.title}
          className={`rounded-lg border ${card.bg} px-4 py-3 shadow-sm transition duration-200 hover:shadow-md`}
        >
          <div className="flex items-center justify-between">

            <div>

              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                {card.title}
              </p>

              <h2 className="mt-1 text-2xl font-bold text-gray-900">
                {card.value}
              </h2>

            </div>

            <div className="rounded-full bg-white p-2 shadow-sm">
              {card.icon}
            </div>

          </div>
        </div>
      ))}
    </div>
  );
}