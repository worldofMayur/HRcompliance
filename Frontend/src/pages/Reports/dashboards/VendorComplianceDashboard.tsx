import { Card, Typography, Space, Row, Col, message } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import axios from "../../../utils/api";

import ComplianceSummaryCards from "./components/ComplianceSummaryCards";
import ComplianceMonthlyTrendChart from "./components/ComplianceMonthlyTrendChart";
import CompliancePieChart from "./components/CompliancePieChart";
import GenderDistributionChart from "./components/GenderDistributionChart";
import MultiSelectCheckbox from "../../../components/MultiSelectCheckbox";
import VendorWiseCCTrendChart from "./components/VendorWiseCCTrendChart";

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

interface GenderDistribution {
  male: number;
  female: number;
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

  const [genderData, setGenderData] = useState<GenderDistribution>({
    male: 0,
    female: 0,
  });

  const [genderStates, setGenderStates] = useState<string[]>([]);
  const [genderBranches, setGenderBranches] = useState<string[]>([]);
  const [genderVendors, setGenderVendors] = useState<string[]>([]);
  const [natureServices, setNatureServices] = useState<string[]>([]);
  const [genderAuditPeriods, setGenderAuditPeriods] = useState<string[]>([]);

  const [genderAuditPeriodOptions, setGenderAuditPeriodOptions] =
    useState<DropdownOption[]>([]);
  const [genderStateOptions, setGenderStateOptions] =
    useState<DropdownOption[]>([]);
  const [genderBranchOptions, setGenderBranchOptions] =
    useState<DropdownOption[]>([]);
  const [genderVendorOptions, setGenderVendorOptions] =
    useState<DropdownOption[]>([]);
  const [natureServiceOptions, setNatureServiceOptions] =
    useState<DropdownOption[]>([]);

  const currentYear = new Date().getFullYear();

  const [trendYear, setTrendYear] =
    useState(currentYear);

  const [trendYears, setTrendYears] =
    useState<number[]>([]);

  const [ccYear, setCcYear] = useState(currentYear);
  const [ccYears, setCcYears] = useState<number[]>([]);

  const [ccStates, setCcStates] = useState<string[]>([]);
  const [ccBranches, setCcBranches] = useState<string[]>([]);
  const [ccVendors, setCcVendors] = useState<string[]>([]);

  const [ccStateOptions, setCcStateOptions] =
    useState<DropdownOption[]>([]);

  const [ccBranchOptions, setCcBranchOptions] =
    useState<DropdownOption[]>([]);

  const [ccVendorOptions, setCcVendorOptions] =
    useState<DropdownOption[]>([]);

  const [ccTrend, setCcTrend] = useState<any[]>([]);

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

  const fetchGenderChart = async () => {
    try {
      const params = new URLSearchParams();

      genderStates.forEach((x) => params.append("states", x));
      genderBranches.forEach((x) => params.append("branches", x));
      genderVendors.forEach((x) => params.append("vendors", x));
      natureServices.forEach((x) =>
        params.append("nature_of_services", x)
      );
      genderAuditPeriods.forEach((x) =>
        params.append("audit_periods", x)
      );

      const res = await axios.get(
        "/api/vendor/dashboard/compliance/gender-distribution/",
        {
          params,
        }
      );

      setGenderData(res.data);
    } catch (err) {
      console.error("Gender Distribution:", err);
    }
  };

  useEffect(() => {
    loadFilters();
  }, [states, branches, vendors]);

  useEffect(() => {
    fetchDashboard();
  }, [
    states,
    branches,
    vendors,
    auditPeriods,
    trendYear,
  ]);

  useEffect(() => {
    loadGenderFilters();
  }, [genderStates, genderBranches, genderVendors]);

  useEffect(() => {
    fetchGenderChart();
  }, [
    genderStates,
    genderBranches,
    genderVendors,
    natureServices,
    genderAuditPeriods,
  ]);

  useEffect(() => {
    loadCCYears();
  }, []);

  useEffect(() => {
    loadTrendYears();
  }, []);

useEffect(() => {
  loadCCFilters();
}, [ccStates, ccBranches]);

useEffect(() => {
  fetchCCTrend();
}, [
  ccYear,
  ccStates,
  ccBranches,
  ccVendors,
]);

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
      params.append(
        "year",
        String(trendYear)
      );

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

  const loadGenderFilters = async () => {
    try {
      const params = new URLSearchParams();

      genderStates.forEach((x) => params.append("states", x));
      genderBranches.forEach((x) => params.append("branches", x));
      genderVendors.forEach((x) => params.append("vendors", x));

      const res = await axios.get(
        "/api/vendor/dashboard/compliance/gender-filters/",
        {
          params,
        }
      );

      setGenderStateOptions(res.data.states || []);
      setGenderBranchOptions(res.data.branches || []);
      setGenderVendorOptions(res.data.vendors || []);
      setNatureServiceOptions(res.data.services || []);
      setGenderAuditPeriodOptions(res.data.audit_periods || []);
    } catch (err) {
      console.error("Gender Filters:", err);
    }
  };

  const loadCCYears = async () => {
    try {
      const res = await axios.get(
        "/api/vendor/dashboard/vendor-wise-cc-years/"
      );

      setCcYears(res.data.years || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadTrendYears = async () => {
    try {

      const res = await axios.get(
        "/api/vendor/dashboard/compliance/monthly-trend-years/"
      );

      setTrendYears(
        res.data.years || []
      );

    } catch (err) {

      console.error(err);

    }
  };

const loadCCFilters = async () => {

  try {

    const params = new URLSearchParams();

    ccStates.forEach(x => params.append("states", x));
    ccBranches.forEach(x => params.append("branches", x));

    const res = await axios.get(
      "/api/vendor/dashboard/vendor-wise-cc-filters/",
      {
        params,
      }
    );

    setCcStateOptions(res.data.states || []);
    setCcBranchOptions(res.data.branches || []);
    setCcVendorOptions(res.data.vendors || []);

  } catch (err) {

    console.error(err);

  }

};


const fetchCCTrend = async () => {

  try {

    const params = new URLSearchParams();

    params.append("year", String(ccYear));

    ccStates.forEach(x => params.append("states", x));
    ccBranches.forEach(x => params.append("branches", x));
    ccVendors.forEach(x => params.append("vendors", x));

    const res = await axios.get(
      "/api/vendor/dashboard/vendor-wise-cc-trend/",
      {
        params,
      }
    );

    setCcTrend(res.data.trend || []);

  } catch (err) {

    console.error(err);

  }

};

  return (
    <>
      {/* Filters */}
      <Card className="mb-5" title="Dashboard Filters">
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
        <Card loading={loading}>
          <ComplianceSummaryCards data={summary} />
        </Card>

          <Row gutter={[16, 16]}>
            {/* Monthly Trend */}
            <Col xs={24} xl={17}>
            <Card
              style={{
                height: "100%",
                minHeight: 470,
              }}
              loading={loading}
              title={
                <Space>
                  <span>📈</span>
                  <span>Monthly Compliance Trend</span>
                </Space>
              }
              extra={
                <select
                  className="
                    rounded-md
                    border
                    border-gray-300
                    px-3
                    py-1
                    text-sm
                  "
                  value={trendYear}
                  onChange={(e) =>
                    setTrendYear(
                      Number(e.target.value)
                    )
                  }
                >
                  {trendYears.map((year) => (
                    <option
                      key={year}
                      value={year}
                    >
                      {year}
                    </option>
                  ))}
                </select>
              }
            >
              <ComplianceMonthlyTrendChart data={monthlyTrend} />
            </Card>
          </Col>

          {/* Compliance Status Distribution */}
          <Col xs={24} xl={7}>
          <Card
            style={{
              height: "100%",
              minHeight: 470,
            }}
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
          </Col>
        </Row>

        {/* ================= Gender Distribution (Updated Layout) ================= */}
        <Row gutter={[16, 16]}>
        {/* LEFT CARD */}
        <Col xs={24} xl={12}>
          <Card
            title="Employee Gender Distribution"
            loading={loading}
            style={{ height: "100%" }}
          >
            <Row gutter={[16, 16]}>
              {/* First row - 3 dropdowns */}
              <Col xs={24} md={8}>
                <label className="mb-1 block font-medium">State</label>
                <MultiSelectCheckbox
                  options={genderStateOptions}
                  value={genderStates}
                  onChange={(value) => {
                    setGenderStates(value);
                    setGenderBranches([]);
                    setGenderVendors([]);
                    setNatureServices([]);
                  }}
                  placeholder="Select State"
                  allLabel="All States"
                />
              </Col>

              <Col xs={24} md={8}>
                <label className="mb-1 block font-medium">Branch</label>
                <MultiSelectCheckbox
                  options={genderBranchOptions}
                  value={genderBranches}
                  onChange={(value) => {
                    setGenderBranches(value);
                    setGenderVendors([]);
                    setNatureServices([]);
                  }}
                  placeholder="Select Branch"
                  allLabel="All Branches"
                />
              </Col>

              <Col xs={24} md={8}>
                <label className="mb-1 block font-medium">Vendor</label>
                <MultiSelectCheckbox
                  options={genderVendorOptions}
                  value={genderVendors}
                  onChange={(value) => {
                    setGenderVendors(value);
                    setNatureServices([]);
                  }}
                  placeholder="Select Vendor"
                  allLabel="All Vendors"
                />
              </Col>

              {/* Second row - 2 dropdowns */}
              <Col xs={24} md={8}>
                <label className="mb-1 block font-medium">
                  Nature Of Services
                </label>
                <MultiSelectCheckbox
                  options={natureServiceOptions}
                  value={natureServices}
                  onChange={setNatureServices}
                  placeholder="Select Service"
                  allLabel="All Services"
                />
              </Col>

              <Col xs={24} md={8}>
                <label className="mb-1 block font-medium">
                  Audit Period
                </label>
                <MultiSelectCheckbox
                  options={genderAuditPeriodOptions}
                  value={genderAuditPeriods}
                  onChange={setGenderAuditPeriods}
                  placeholder="Select Audit Period"
                  allLabel="All Audit Periods"
                />
              </Col>
            </Row>

            {/* Donut Chart */}
            <div className="mt-6 flex justify-center">
              <GenderDistributionChart data={genderData} />
            </div>

            {/* Male & Female Count */}
            <div className="mt-4 flex justify-center gap-10">
              <div className="text-center">
                <div className="text-2xl font-semibold text-blue-600">
                  {genderData.male}
                </div>
                <div className="text-sm text-gray-500">Male</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-semibold text-pink-500">
                  {genderData.female}
                </div>
                <div className="text-sm text-gray-500">Female</div>
              </div>
            </div>
          </Card>
        </Col>
{/* RIGHT CARD - Vendor Wise CC Trend */}
<Col xs={24} xl={12}>
  <Card
    title="Vendor Wise CC Trend"
    loading={loading}
    style={{ height: "100%" }}
  >
    {/* Filters Row */}
    <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
      {/* Left side - Multi Selects */}
      <div className="flex flex-1 flex-wrap gap-4">
        <div className="min-w-[160px] flex-1">
          <label className="mb-1 block font-medium">State</label>
          <MultiSelectCheckbox
            options={ccStateOptions}
            value={ccStates}
            onChange={(value) => {
              setCcStates(value);
              setCcBranches([]);
              setCcVendors([]);
            }}
            placeholder="Select State"
            allLabel="All States"
          />
        </div>

        <div className="min-w-[160px] flex-1">
          <label className="mb-1 block font-medium">Branch</label>
          <MultiSelectCheckbox
            options={ccBranchOptions}
            value={ccBranches}
            onChange={(value) => {
              setCcBranches(value);
              setCcVendors([]);
            }}
            placeholder="Select Branch"
            allLabel="All Branches"
          />
        </div>

        <div className="min-w-[160px] flex-1">
          <label className="mb-1 block font-medium">Vendor</label>
          <MultiSelectCheckbox
            options={ccVendorOptions}
            value={ccVendors}
            onChange={setCcVendors}
            placeholder="Select Vendor"
            allLabel="All Vendors"
          />
        </div>
      </div>

      {/* Right side - Year (separated) */}
      <div className="w-28">
        <label className="mb-1 block font-medium">Year</label>
        <select
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          value={ccYear}
          onChange={(e) => setCcYear(Number(e.target.value))}
        >
          {ccYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
    </div>

    {/* Chart */}
    <div className="mt-2">
      <VendorWiseCCTrendChart data={ccTrend} />
    </div>
  </Card>
</Col>
        </Row>
      </div>
    </>
  );
}