import { Card, Typography, Space, Row, Col, message } from "antd";
import { useEffect, useState } from "react";
import axios from "../../../utils/api";

import ComplianceSummaryCards from "./components/ComplianceSummaryCards";
import ComplianceMonthlyTrendChart from "./components/ComplianceMonthlyTrendChart";
import CompliancePieChart from "./components/CompliancePieChart";
import MultiSelectCheckbox from "../../../components/MultiSelectCheckbox";

const { Text } = Typography;

interface ComplianceSummary {
  ccIssued: number;
  exceptionalCC: number;
  underAudit: number;
  documentNotSubmitted: number;
}

interface MonthlyTrend {
  month: string;
  ccIssued: number;
  exceptionalCC: number;
  underAudit: number;
  documentNotSubmitted: number;
}

interface DropdownOption {
  id: string;
  name: string;
}

export default function VendorComplianceDashboard() {
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const [summary, setSummary] = useState<ComplianceSummary>({
    ccIssued: 0,
    exceptionalCC: 0,
    underAudit: 0,
    documentNotSubmitted: 0,
  });

  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrend[]>([]);
  const [distribution, setDistribution] = useState<Record<string, number>>({});

  const [states, setStates] = useState<string[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [vendors, setVendors] = useState<string[]>([]);
  const [auditPeriods, setAuditPeriods] = useState<string[]>([]);

  const [stateOptions, setStateOptions] = useState<DropdownOption[]>([]);
  const [branchOptions, setBranchOptions] = useState<DropdownOption[]>([]);
  const [vendorOptions, setVendorOptions] = useState<DropdownOption[]>([]);
  const [auditPeriodOptions, setAuditPeriodOptions] = useState<DropdownOption[]>([]);

  const loadFilters = async () => {
    try {
      const params = new URLSearchParams();

      states.forEach((x) => params.append("states", x));
      branches.forEach((x) => params.append("branches", x));
      vendors.forEach((x) => params.append("vendors", x));

      const res = await axios.get(
        "/api/vendor/dashboard/compliance/filters/",
        {
          params,
        }
      );

      setStateOptions(res.data.states || []);
      setBranchOptions(res.data.branches || []);
      setVendorOptions(res.data.vendors || []);
      setAuditPeriodOptions(res.data.audit_periods || []);
    } catch (err) {
      console.error(err);
      message.error("Failed to load filters.");
    }
  };

  useEffect(() => {
    loadFilters();
  }, [states, branches, vendors]);

  useEffect(() => {
    fetchDashboard();
  }, [states, branches, vendors, auditPeriods]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboard();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      states.forEach((x) => params.append("states", x));
      branches.forEach((x) => params.append("branches", x));
      vendors.forEach((x) => params.append("vendors", x));
      auditPeriods.forEach((x) => params.append("audit_periods", x));

      const [summaryRes, monthlyTrendRes, distRes] = await Promise.all([
        axios.get("/api/vendor/dashboard/compliance/summary-v2/", {
          params,
        }),
        axios.get("/api/vendor/dashboard/compliance/monthly-trend-v2/", {
          params,
        }),
        axios.get("/api/vendor/dashboard/compliance/distribution-v2/", {
          params,
        }),
      ]);

      setSummary(summaryRes.data);
      setMonthlyTrend(monthlyTrendRes.data);
      setDistribution(distRes.data.distribution || {});

      setLastUpdated(new Date());
    } catch (err) {
      console.error("Compliance Dashboard Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Filters */}
      <Card
        className="mb-5"
        title="Dashboard Filters"
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={6}>
            <label className="mb-1 block font-medium">State</label>
            <MultiSelectCheckbox
              options={stateOptions}
              value={states}
              onChange={(value) => {
                setStates(value);
                setBranches([]);
                setVendors([]);
                setAuditPeriods([]);
              }}
              placeholder="Select State"
              allLabel="All States"
            />
          </Col>

          <Col xs={24} md={6}>
            <label className="mb-1 block font-medium">Branch</label>
            <MultiSelectCheckbox
              options={branchOptions}
              value={branches}
              onChange={(value) => {
                setBranches(value);
                setVendors([]);
                setAuditPeriods([]);
              }}
              placeholder="Select Branch"
              allLabel="All Branches"
            />
          </Col>

          <Col xs={24} md={6}>
            <label className="mb-1 block font-medium">Vendor</label>
            <MultiSelectCheckbox
              options={vendorOptions}
              value={vendors}
              onChange={(value) => {
                setVendors(value);
                setAuditPeriods([]);
              }}
              placeholder="Select Vendor"
              allLabel="All Vendors"
            />
          </Col>

          <Col xs={24} md={6}>
            <label className="mb-1 block font-medium">Audit Period</label>
            <MultiSelectCheckbox
              options={auditPeriodOptions}
              value={auditPeriods}
              onChange={setAuditPeriods}
              placeholder="Select Audit Period"
              allLabel="All Audit Periods"
            />
          </Col>
        </Row>
      </Card>

      <div className="grid grid-cols-1 gap-6">
        {/* Summary Cards */}
        <Card
          loading={loading}
          title={
            <Space>
              <span>📊</span>
              <span>Vendor Compliance Summary</span>
            </Space>
          }
        >
          <ComplianceSummaryCards data={summary} />
        </Card>

        <Row gutter={[16, 16]}>
          {/* Monthly Trend */}
          <Col xs={24} xl={12}>
            <Card
              style={{ height: "100%" }}
              loading={loading}
              title={
                <Space>
                  <span>📈</span>
                  <span>Monthly Compliance Trend</span>
                </Space>
              }
              extra={
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Audit Period
                </Text>
              }
            >
              <ComplianceMonthlyTrendChart data={monthlyTrend} />
            </Card>
          </Col>

          {/* Compliance Status Distribution */}
          <Col xs={24} xl={12}>
            <Card
              style={{ height: "100%" }}
              loading={loading}
              title={
                <Space>
                  <span>🧩</span>
                  <span>Compliance Status Distribution</span>
                </Space>
              }
            >
              <CompliancePieChart data={distribution} />
            </Card>

            <div className="mb-5 flex items-center justify-between rounded-lg border bg-white px-5 py-3 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500"></span>
                </span>

                <Text strong className="text-green-700">
                  Live Dashboard
                </Text>

                <Text type="secondary">
                  <div className="flex items-center gap-2">
                    {loading && (
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                    )}

                    <Text type="secondary">
                      Auto Refresh every 5 minutes
                    </Text>
                  </div>
                </Text>
              </div>

              <Text type="secondary">
                Last Updated :
                {" "}
                {lastUpdated.toLocaleString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </div>
          </Col>
        </Row>
      </div>

    </>
  );
}