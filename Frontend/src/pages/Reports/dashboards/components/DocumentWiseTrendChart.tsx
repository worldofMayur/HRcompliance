import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";

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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  const row = payload[0].payload;

  return (
    <div className="min-w-[240px] rounded-xl border border-gray-200 bg-white p-4 shadow-xl">
      <div className="mb-3 border-b pb-2">
        <h4 className="font-semibold text-gray-800">
          {label}
        </h4>
      </div>

      <div className="space-y-4">

        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-blue-600" />
            <span className="font-semibold text-blue-700">
              PF
            </span>
          </div>

          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Average Day</span>
              <span className="font-semibold">{row.pf}</span>
            </div>

            <div className="flex justify-between">
              <span>Before 15th</span>
              <span className="font-semibold text-green-600">
                {row.pf_before_15}
              </span>
            </div>

            <div className="flex justify-between">
              <span>After 15th</span>
              <span className="font-semibold text-red-600">
                {row.pf_after_15}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t pt-3">

          <div className="mb-2 flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-600" />
            <span className="font-semibold text-green-700">
              ESIC
            </span>
          </div>

          <div className="space-y-1 text-sm">

            <div className="flex justify-between">
              <span>Average Day</span>
              <span className="font-semibold">{row.esic}</span>
            </div>

            <div className="flex justify-between">
              <span>Before 15th</span>
              <span className="font-semibold text-green-600">
                {row.esic_before_15}
              </span>
            </div>

            <div className="flex justify-between">
              <span>After 15th</span>
              <span className="font-semibold text-red-600">
                {row.esic_after_15}
              </span>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default function DocumentWiseTrendChart({
  data,
}: Props) {

  return (
    <ResponsiveContainer
      width="100%"
      height={450}
    >
      <LineChart
        data={data}
        margin={{
          top: 20,
          right: 35,
          left: 20,
          bottom: 10,
        }}
      >

        <CartesianGrid
          strokeDasharray="4 4"
          vertical={false}
        />

        <XAxis
          dataKey="month"
          tick={{
            fontSize: 13,
          }}
        />

        <YAxis
          domain={[1, 31]}
          tick={{
            fontSize: 13,
          }}
          label={{
            value: "Average Remittance Day",
            angle: -90,
            position: "insideLeft",
          }}
        />

        <Tooltip
          content={<CustomTooltip />}
        />

        <Legend
          verticalAlign="top"
          align="right"
          wrapperStyle={{
            paddingBottom: 20,
          }}
        />

        <ReferenceLine
          y={15}
          stroke="#ef4444"
          strokeDasharray="6 6"
          label={{
            value: "15th Day",
            fill: "#ef4444",
            fontSize: 12,
          }}
        />

        <Line
          type="monotone"
          dataKey="pf"
          name="PF"
          stroke="#2563eb"
          strokeWidth={4}
          dot={{
            r: 5,
          }}
          activeDot={{
            r: 8,
          }}
          animationDuration={1200}
        />

        <Line
          type="monotone"
          dataKey="esic"
          name="ESIC"
          stroke="#10b981"
          strokeWidth={4}
          dot={{
            r: 5,
          }}
          activeDot={{
            r: 8,
          }}
          animationDuration={1200}
        />

      </LineChart>
    </ResponsiveContainer>
  );
}