import { useEffect, useState } from "react";
import { Table, Select, Spin, Empty, message } from "antd";

import api from "../../../utils/api";

import DocumentWiseTrendChart from "./components/DocumentWiseTrendChart";
import DocumentWiseSummaryCards from "./components/DocumentWiseSummaryCards";

const { Option } = Select;

interface TrendData {
  month: string;
  pf: number;
  esic: number;
  pf_before_15: number;
  pf_after_15: number;
  esic_before_15: number;
  esic_after_15: number;
}

export default function DocumentWiseComplianceDashboard() {
  const currentYear = new Date().getFullYear();

  const [year, setYear] = useState(currentYear);
  const [years, setYears] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<TrendData[]>([]);

  const loadYears = async () => {
    try {
      const res = await api.get(
        "/api/vendor/dashboard/document-wise-years/"
      );

      setYears(res.data.years || []);

      if (
        res.data.years?.length &&
        !res.data.years.includes(currentYear)
      ) {
        setYear(res.data.years[0]);
      }
    } catch (error) {
      console.error(error);
      message.error("Failed to load years.");
    }
  };

  const loadTrend = async () => {
    setLoading(true);

    try {
      const res = await api.get(
        "/api/vendor/dashboard/document-wise-compliance-trend/",
        {
          params: {
            year,
          },
        }
      );

      setChartData(res.data.trend || []);
    } catch (error) {
      console.error(error);
      message.error("Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadYears();
  }, []);

  useEffect(() => {
    if (year) {
      loadTrend();
    }
  }, [year]);

  return (
    <div className="space-y-4">

      {/* Chart */}
      <div className="rounded-xl border bg-white p-4 shadow-sm">

        {/* Chart Header */}
        <div className="mb-4 flex items-center justify-between">

          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              PF & ESIC Remittance Trend
            </h2>

            <p className="text-xs text-gray-500">
              Monthly average remittance day comparison
            </p>
          </div>

          <div className="flex items-center gap-3">

            <span className="text-sm font-medium text-gray-600">
              Year
            </span>

            <Select
              value={year}
              style={{ width: 110 }}
              onChange={setYear}
            >
              {years.map((yr) => (
                <Option
                  key={yr}
                  value={yr}
                >
                  {yr}
                </Option>
              ))}
            </Select>

          </div>

        </div>

        {loading ? (
          <div className="flex h-[520px] items-center justify-center">
            <Spin
              size="large"
              tip="Loading Trend..."
            />
          </div>
        ) : chartData.length ? (
          <DocumentWiseTrendChart
            data={chartData}
          />
        ) : (
          <div className="flex h-[520px] items-center justify-center">
            <Empty
              description="No PF / ESIC remittance data found for the selected year."
            />
          </div>
        )}

      </div>

      {/* Table */}

      <div className="rounded-xl border bg-white p-4 shadow-sm">

        <Table
          rowKey="month"
          size="small"
          pagination={false}
          dataSource={chartData}
          scroll={{ x: 900 }}
          columns={[
            {
              title: "Month",
              dataIndex: "month",
            },
            {
              title: "PF Avg Day",
              dataIndex: "pf",
            },
            {
              title: "ESIC Avg Day",
              dataIndex: "esic",
            },
            {
              title: "PF Before 15",
              dataIndex: "pf_before_15",
            },
            {
              title: "PF After 15",
              dataIndex: "pf_after_15",
            },
            {
              title: "ESIC Before 15",
              dataIndex: "esic_before_15",
            },
            {
              title: "ESIC After 15",
              dataIndex: "esic_after_15",
            },
          ]}
        />

      </div>

    </div>
  );
}