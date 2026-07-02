import ReportFilters from "../components/ReportFilters";
import { message } from "antd";
import api from "../../../utils/api";
import { useState, useEffect } from "react";

interface DropdownOption {
  id: string;
  name: string;
}

export default function ComplianceReport() {
  const [principalEmployer, setPrincipalEmployer] = useState("");
  const [periodicity, setPeriodicity] = useState("");
  const [state, setState] = useState<string[]>([]);
  const [branch, setBranch] = useState<string[]>([]);
  const [vendor, setVendor] = useState<string[]>([]);
  const [auditMonth, setAuditMonth] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);

  const [statesOptions, setStatesOptions] = useState<DropdownOption[]>([]);
  const [branchesOptions, setBranchesOptions] = useState<DropdownOption[]>([]);
  const [vendorsOptions, setVendorsOptions] = useState<DropdownOption[]>([]);
  const [auditPeriodsOptions, setAuditPeriodsOptions] = useState<DropdownOption[]>([]);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    loadStates();
  }, []);

  useEffect(() => {
    setBranch([]);
    setVendor([]);
    setAuditMonth([]);

    setBranchesOptions([]);
    setVendorsOptions([]);
    setAuditPeriodsOptions([]);

    if (state.length > 0) {
      loadBranches();
    }
  }, [state]);

  useEffect(() => {
    setVendor([]);
    setAuditMonth([]);

    setVendorsOptions([]);
    setAuditPeriodsOptions([]);

    if (state.length > 0 && branch.length > 0) {
      loadVendors();
    }
  }, [state, branch]);

  useEffect(() => {
    setAuditMonth([]);
    setAuditPeriodsOptions([]);

    if (state.length > 0 && branch.length > 0 && vendor.length > 0) {
      loadAuditPeriods();
    }
  }, [state, branch, vendor]);

  const loadStates = async () => {
    try {
      const res = await api.get("/api/vendor/reports/states/");
      setStatesOptions(res.data);
    } catch (error) {
      console.error("Failed to load states", error);
      message.error("Failed to load states");
    }
  };

  const loadBranches = async () => {
    try {
      const res = await api.get("/api/vendor/reports/branches/", {
        params: {
          states: state,
        }
      });
      setBranchesOptions(res.data);
    } catch (error) {
      console.error("Failed to load branches", error);
      message.error("Failed to load branches");
    }
  };

  const loadVendors = async () => {
    try {
      const res = await api.get("/api/vendor/reports/vendors/", {
        params: {
          states: state,
          branches: branch,
        }
      });
      setVendorsOptions(res.data);
    } catch (error) {
      console.error("Failed to load vendors", error);
    }
  };

  const loadAuditPeriods = async () => {
    try {
      const res = await api.get("/api/vendor/reports/audit-periods/", {
        params: {
          states: state,
          branches: branch,
          vendors: vendor,
        },
      });
      setAuditPeriodsOptions(res.data);
    } catch (error) {
      console.error("Failed to load audit periods", error);
    }
  };

const generateReport = async () => {
  setLoading(true);

  try {
    const payload = {
      states: state.includes("all") ? [] : state,
      branches: branch.includes("all") ? [] : branch,
      vendors: vendor.includes("all") ? [] : vendor,
      periodicities: periodicity ? [periodicity] : [],
      audit_periods: auditMonth.includes("all") ? [] : auditMonth,
    };

    const response = await api.post(
      "/api/vendor/reports/compliance/",
      payload,
      {
        responseType: "blob",
      }
    );

    const blob = new Blob([response.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");

    let filename = "VendorComplianceStatus.xlsx";

    const disposition =
      response.headers["content-disposition"];

    if (disposition) {
      const match = disposition.match(/filename="?([^"]+)"?/);

      if (match && match[1]) {
        filename = match[1];
      }
    }

    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);

    message.success("Report downloaded successfully.");
  } catch (error: any) {
    console.error(error);

    if (error.response?.status === 404) {
      message.warning("No records found.");
    } else {
      message.error("Failed to download report.");
    }
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-hidden">
      <ReportFilters
        reportType="compliance"
        principalEmployer={principalEmployer}
        setPrincipalEmployer={setPrincipalEmployer}
        state={state}
        setState={setState}
        branch={branch}
        setBranch={setBranch}
        vendor={vendor}
        setVendor={setVendor}
        periodicity={periodicity}
        setPeriodicity={setPeriodicity}
        auditMonth={auditMonth}
        setAuditMonth={setAuditMonth}
        onGenerate={generateReport}
        loading={loading}
        statesOptions={statesOptions}
        branchesOptions={branchesOptions}
        vendorsOptions={vendorsOptions}
        auditPeriodsOptions={auditPeriodsOptions}
      />
    </div>
  );
}