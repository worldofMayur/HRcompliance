import {
  Card,
  Typography,
  Space,
  Row,
  Col,
  message,
  Modal,
  Table,
  Tag,
  Input,
  Select,
  Button,
} from "antd";
import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { useEffect, useState, useMemo } from "react";
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

interface MissingDocumentDetail {
  vendor: string;
  state: string;
  branch: string;
  audit_period: string;
  frequency: string;
  expected_documents: number;
  submitted_documents: number;
  missing_documents: number;
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

  const [trendYear, setTrendYear] = useState(currentYear);
  const [trendYears, setTrendYears] = useState<number[]>([]);

  const [ccYear, setCcYear] = useState(currentYear);
  const [ccYears, setCcYears] = useState<number[]>([]);

  const [ccStates, setCcStates] = useState<string[]>([]);
  const [ccBranches, setCcBranches] = useState<string[]>([]);
  const [ccVendors, setCcVendors] = useState<string[]>([]);
  const [ccAuditPeriods, setCcAuditPeriods] = useState<string[]>([]);

  const [ccStateOptions, setCcStateOptions] = useState<DropdownOption[]>([]);
  const [ccBranchOptions, setCcBranchOptions] = useState<DropdownOption[]>([]);
  const [ccVendorOptions, setCcVendorOptions] = useState<DropdownOption[]>([]);
  const [ccAuditPeriodOptions, setCcAuditPeriodOptions] =
    useState<DropdownOption[]>([]);

  // Month support
  const [ccMonthOptions, setCcMonthOptions] = useState<DropdownOption[]>([]);
  const [monthToAuditPeriod, setMonthToAuditPeriod] =
    useState<Record<string, string>>({});

  const [ccTrend, setCcTrend] = useState<any[]>([]);

  // Missing Documents Modal
  const [missingModalOpen, setMissingModalOpen] = useState(false);
  const [missingLoading, setMissingLoading] = useState(false);
  const [missingData, setMissingData] = useState<MissingDocumentDetail[]>([]);

  // Modal filters
  const [missingSearch, setMissingSearch] = useState("");
  const [missingStateFilter, setMissingStateFilter] = useState<string[]>([]);
  const [missingBranchFilter, setMissingBranchFilter] = useState<string[]>([]);
  const [missingVendorFilter, setMissingVendorFilter] = useState<string[]>([]);
  const [missingPeriodFilter, setMissingPeriodFilter] = useState<string[]>([]);
  const [missingFrequencyFilter, setMissingFrequencyFilter] = useState<string[]>([]);

  // ---------- Unique options for modal filters ----------
  const missingStateOptions = useMemo(() => {
    return Array.from(
      new Set(missingData.map((d) => d.state).filter(Boolean))
    )
      .sort()
      .map((s) => ({ label: s, value: s }));
  }, [missingData]);

  const missingBranchOptions = useMemo(() => {
    return Array.from(
      new Set(missingData.map((d) => d.branch).filter(Boolean))
    )
      .sort()
      .map((s) => ({ label: s, value: s }));
  }, [missingData]);

  const missingVendorOptions = useMemo(() => {
    return Array.from(
      new Set(missingData.map((d) => d.vendor).filter(Boolean))
    )
      .sort()
      .map((s) => ({ label: s, value: s }));
  }, [missingData]);

  const missingPeriodOptions = useMemo(() => {
    return Array.from(
      new Set(missingData.map((d) => d.audit_period).filter(Boolean))
    )
      .sort()
      .map((s) => ({ label: s, value: s }));
  }, [missingData]);

  const missingFrequencyOptions = useMemo(() => {
    return Array.from(
      new Set(missingData.map((d) => d.frequency).filter(Boolean))
    )
      .sort()
      .map((s) => ({ label: s, value: s }));
  }, [missingData]);

  // ---------- Filtered data ----------
  const filteredMissingData = useMemo(() => {
    const search = missingSearch.trim().toLowerCase();

    return missingData.filter((row) => {
      const matchesSearch =
        !search ||
        row.vendor?.toLowerCase().includes(search) ||
        row.state?.toLowerCase().includes(search) ||
        row.branch?.toLowerCase().includes(search) ||
        row.audit_period?.toLowerCase().includes(search) ||
        row.frequency?.toLowerCase().includes(search);

      const matchesState =
        missingStateFilter.length === 0 ||
        missingStateFilter.includes(row.state);

      const matchesBranch =
        missingBranchFilter.length === 0 ||
        missingBranchFilter.includes(row.branch);

      const matchesVendor =
        missingVendorFilter.length === 0 ||
        missingVendorFilter.includes(row.vendor);

      const matchesPeriod =
        missingPeriodFilter.length === 0 ||
        missingPeriodFilter.includes(row.audit_period);

      const matchesFrequency =
        missingFrequencyFilter.length === 0 ||
        missingFrequencyFilter.includes(row.frequency);

      return (
        matchesSearch &&
        matchesState &&
        matchesBranch &&
        matchesVendor &&
        matchesPeriod &&
        matchesFrequency
      );
    });
  }, [
    missingData,
    missingSearch,
    missingStateFilter,
    missingBranchFilter,
    missingVendorFilter,
    missingPeriodFilter,
    missingFrequencyFilter,
  ]);

  const resetMissingFilters = () => {
    setMissingSearch("");
    setMissingStateFilter([]);
    setMissingBranchFilter([]);
    setMissingVendorFilter([]);
    setMissingPeriodFilter([]);
    setMissingFrequencyFilter([]);
  };

  // -------------------- Data loading --------------------

  const loadFilters = async () => {
    try {
      const params = new URLSearchParams();

      states.forEach((x) => params.append("states", x));
      branches.forEach((x) => params.append("branches", x));
      vendors.forEach((x) => params.append("vendors", x));

      const res = await axios.get(
        "/api/vendor/dashboard/compliance/filters/",
        { params }
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
        { params }
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
  }, [states, branches, vendors, auditPeriods, trendYear]);

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
  }, [ccVendors, ccAuditPeriods, ccStates, ccBranches]);

  useEffect(() => {
    fetchCCTrend();
  }, [ccYear, ccVendors, ccAuditPeriods, ccStates, ccBranches]);

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
      params.append("year", String(trendYear));

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
        { params }
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
      setTrendYears(res.data.years || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadCCFilters = async () => {
    try {
      const params = new URLSearchParams();

      ccVendors.forEach((x) => params.append("vendors", x));
      ccAuditPeriods.forEach((x) => params.append("audit_periods", x));
      ccStates.forEach((x) => params.append("states", x));
      ccBranches.forEach((x) => params.append("branches", x));

      const res = await axios.get(
        "/api/vendor/dashboard/vendor-wise-cc-filters/",
        { params }
      );

      setCcStateOptions(res.data.states || []);
      setCcBranchOptions(res.data.branches || []);
      setCcVendorOptions(res.data.vendors || []);
      setCcAuditPeriodOptions(res.data.audit_periods || []);

      // Month support
      setCcMonthOptions(res.data.months || []);
      setMonthToAuditPeriod(res.data.month_to_audit_period || {});
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMissingDocuments = async () => {
    try {
      setMissingLoading(true);
      resetMissingFilters(); // clear previous filters

      const params = new URLSearchParams();

      states.forEach((x) => params.append("states", x));
      branches.forEach((x) => params.append("branches", x));
      vendors.forEach((x) => params.append("vendors", x));
      auditPeriods.forEach((x) => params.append("audit_periods", x));

      const res = await axios.get(
        "/api/vendor/dashboard/document-not-submitted-details/",
        { params }
      );

      setMissingData(res.data || []);
      setMissingModalOpen(true);
    } catch (err) {
      console.error(err);
      message.error("Failed to load missing documents.");
    } finally {
      setMissingLoading(false);
    }
  };

  const fetchCCTrend = async () => {
    try {
      const params = new URLSearchParams();
      params.append("year", String(ccYear));

      // Map selected months → original audit periods
      const mappedAuditPeriods = Array.from(
        new Set(
          ccAuditPeriods.map(
            (month) => monthToAuditPeriod[month] || month
          )
        )
      );

      mappedAuditPeriods.forEach((period) =>
        params.append("audit_periods", period)
      );

      ccStates.forEach((x) => params.append("states", x));
      ccBranches.forEach((x) => params.append("branches", x));
      ccVendors.forEach((x) => params.append("vendors", x));

      const res = await axios.get(
        "/api/vendor/dashboard/vendor-wise-cc-trend/",
        { params }
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
          <ComplianceSummaryCards
            data={summary}
            onDocumentNotSubmittedClick={() => {
              if (summary.documentNotSubmitted > 0) {
                fetchMissingDocuments();
              }
            }}
          />
        </Card>

        <Row gutter={[16, 16]}>
          {/* Monthly Trend */}
          <Col xs={24} xl={17}>
            <Card
              style={{ height: "100%", minHeight: 470 }}
              loading={loading}
              title={
                <Space>
                  <span>📈</span>
                  <span>Monthly Compliance Trend</span>
                </Space>
              }
              extra={
                <select
                  className="rounded-md border border-gray-300 px-3 py-1 text-sm"
                  value={trendYear}
                  onChange={(e) => setTrendYear(Number(e.target.value))}
                >
                  {trendYears.map((year) => (
                    <option key={year} value={year}>
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
              style={{ height: "100%", minHeight: 470 }}
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

        {/* ================= Gender Distribution ================= */}
        <Row gutter={[16, 16]}>
          <Col xs={24} xl={12}>
            <Card
              title="Employee Gender Distribution"
              loading={loading}
              style={{ height: "100%" }}
            >
              <Row gutter={[16, 16]}>
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

              <div className="mt-6 flex justify-center">
                <GenderDistributionChart data={genderData} />
              </div>

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
              <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
                <div className="flex flex-1 flex-wrap gap-4">
                  {/* Vendor */}
                  <div className="min-w-[220px] flex-1">
                    <label className="mb-1 block font-medium">Vendor</label>
                    <MultiSelectCheckbox
                      options={ccVendorOptions}
                      value={ccVendors}
                      onChange={(value) => {
                        setCcVendors(value);
                        setCcAuditPeriods([]);
                        setCcStates([]);
                        setCcBranches([]);

                        if (ccYears.length > 0) {
                          setCcYear(ccYears[0]);
                        }
                      }}
                      placeholder="Select Vendor"
                      allLabel="All Vendors"
                    />
                  </div>

                  {/* Month */}
                  <div className="min-w-[220px] flex-1">
                    <label className="mb-1 block font-medium">Month</label>
                    <MultiSelectCheckbox
                      options={ccMonthOptions}
                      value={ccAuditPeriods}
                      onChange={(value) => {
                        setCcAuditPeriods(value);
                        setCcStates([]);
                        setCcBranches([]);

                        if (value.length > 0) {
                          const selected = value[value.length - 1];
                          const match = selected.match(/\d{4}/);
                          if (match) {
                            setCcYear(Number(match[0]));
                          }
                        } else if (ccYears.length > 0) {
                          setCcYear(ccYears[0]);
                        }
                      }}
                      placeholder="Select Month"
                      allLabel="All Months"
                    />
                  </div>

                  {/* State */}
                  <div className="min-w-[180px] flex-1">
                    <label className="mb-1 block font-medium">State</label>
                    <MultiSelectCheckbox
                      options={ccStateOptions}
                      value={ccStates}
                      onChange={(value) => {
                        setCcStates(value);
                        setCcBranches([]);
                      }}
                      placeholder="Select State"
                      allLabel="All States"
                    />
                  </div>

                  {/* Branch */}
                  <div className="min-w-[180px] flex-1">
                    <label className="mb-1 block font-medium">Branch</label>
                    <MultiSelectCheckbox
                      options={ccBranchOptions}
                      value={ccBranches}
                      onChange={setCcBranches}
                      placeholder="Select Branch"
                      allLabel="All Branches"
                    />
                  </div>
                </div>

                {/* Year */}
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

              <div className="mt-2">
                <VendorWiseCCTrendChart data={ccTrend} />
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      {/* ================= Missing Documents Modal ================= */}
      <Modal
        title="Document Not Submitted Details"
        open={missingModalOpen}
        footer={null}
        width={1280}
        destroyOnClose
        onCancel={() => {
          setMissingModalOpen(false);
          resetMissingFilters();
        }}
      >
        {/* Filters */}
        <div className="mb-4 space-y-3">
          {/* Search */}
          <Input
            allowClear
            placeholder="Search by Vendor, State, Branch, Audit Period or Frequency..."
            prefix={<SearchOutlined className="text-gray-400" />}
            value={missingSearch}
            onChange={(e) => setMissingSearch(e.target.value)}
            className="max-w-md"
          />

          {/* Dropdown filters */}
          <Row gutter={[12, 12]}>
            <Col xs={24} sm={12} md={8} lg={4}>
              <Select
                mode="multiple"
                allowClear
                showSearch
                placeholder="State"
                value={missingStateFilter}
                onChange={setMissingStateFilter}
                options={missingStateOptions}
                className="w-full"
                maxTagCount="responsive"
              />
            </Col>

            <Col xs={24} sm={12} md={8} lg={4}>
              <Select
                mode="multiple"
                allowClear
                showSearch
                placeholder="Branch"
                value={missingBranchFilter}
                onChange={setMissingBranchFilter}
                options={missingBranchOptions}
                className="w-full"
                maxTagCount="responsive"
              />
            </Col>

            <Col xs={24} sm={12} md={8} lg={5}>
              <Select
                mode="multiple"
                allowClear
                showSearch
                placeholder="Vendor"
                value={missingVendorFilter}
                onChange={setMissingVendorFilter}
                options={missingVendorOptions}
                className="w-full"
                maxTagCount="responsive"
              />
            </Col>

            <Col xs={24} sm={12} md={8} lg={5}>
              <Select
                mode="multiple"
                allowClear
                showSearch
                placeholder="Audit Period"
                value={missingPeriodFilter}
                onChange={setMissingPeriodFilter}
                options={missingPeriodOptions}
                className="w-full"
                maxTagCount="responsive"
              />
            </Col>

            <Col xs={24} sm={12} md={8} lg={4}>
              <Select
                mode="multiple"
                allowClear
                showSearch
                placeholder="Frequency"
                value={missingFrequencyFilter}
                onChange={setMissingFrequencyFilter}
                options={missingFrequencyOptions}
                className="w-full"
                maxTagCount="responsive"
              />
            </Col>

            <Col xs={24} sm={12} md={8} lg={2}>
              <Button
                onClick={resetMissingFilters}
                className="w-full"
              >
                Clear
              </Button>
            </Col>
          </Row>

          <div className="text-sm text-gray-500">
            Showing <strong>{filteredMissingData.length}</strong> of{" "}
            <strong>{missingData.length}</strong> records
          </div>
        </div>

        {/* Table */}
        <Table
          loading={missingLoading}
          rowKey={(row) =>
            `${row.vendor}-${row.branch}-${row.audit_period}-${row.frequency}`
          }
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            showTotal: (total) => `Total ${total} items`,
          }}
          scroll={{
            x: 1200,
            y: 480,
          }}
          columns={[
            {
              title: "Vendor",
              dataIndex: "vendor",
              width: 200,
              ellipsis: true,
            },
            {
              title: "State",
              dataIndex: "state",
              width: 120,
            },
            {
              title: "Branch",
              dataIndex: "branch",
              width: 140,
              ellipsis: true,
            },
            {
              title: "Audit Period",
              dataIndex: "audit_period",
              width: 140,
            },
            {
              title: "Frequency",
              dataIndex: "frequency",
              width: 110,
              render: (value) => <Tag color="blue">{value}</Tag>,
            },
            {
              title: "Expected",
              dataIndex: "expected_documents",
              align: "center",
              width: 100,
            },
            {
              title: "Submitted",
              dataIndex: "submitted_documents",
              align: "center",
              width: 100,
            },
            {
              title: "Missing",
              dataIndex: "missing_documents",
              align: "center",
              width: 100,
              render: (value) => <Tag color="red">{value}</Tag>,
            },
          ]}
          dataSource={filteredMissingData}
        />
      </Modal>
    </>
  );
}