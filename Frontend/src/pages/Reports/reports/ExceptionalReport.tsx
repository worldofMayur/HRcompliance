import { useState, useEffect } from "react";
import { message } from "antd";

import api from "../../../utils/api";
import ReportFilters from "../components/ReportFilters";

export default function ExceptionalReport() {
  const [principalEmployer, setPrincipalEmployer] = useState("");

  const [state, setState] = useState<string[]>([]);
  const [branch, setBranch] = useState<string[]>([]);
  const [vendor, setVendor] = useState<string[]>([]);
  const [auditMonth, setAuditMonth] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);

  // Dropdown Options
  const [statesOptions, setStatesOptions] = useState<any[]>([]);
  const [branchesOptions, setBranchesOptions] = useState<any[]>([]);
  const [vendorsOptions, setVendorsOptions] = useState<any[]>([]);
  const [auditPeriodsOptions, setAuditPeriodsOptions] = useState<any[]>([]);

  // Load States - EXCEPTIONAL
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
      const res = await api.get("/api/vendor/reports/exception-states/");
      setStatesOptions(res.data);
    } catch (error) {
      console.error("Failed to load states", error);
      message.error("Failed to load states");
    }
  };

  const loadBranches = async () => {
    try {
      const res = await api.get("/api/vendor/reports/exception-branches/", {
        params: { states: state },
      });
      setBranchesOptions(res.data);
    } catch (error) {
      console.error("Failed to load branches", error);
    }
  };

  const loadVendors = async () => {
    try {
      const res = await api.get("/api/vendor/reports/exception-vendors/", {
        params: {
          states: state,
          branches: branch,
        },
      });
      setVendorsOptions(res.data);
    } catch (error) {
      console.error("Failed to load vendors", error);
    }
  };

  const loadAuditPeriods = async () => {
    try {
      const res = await api.get("/api/vendor/reports/exception/audit-periods/", {
        params: {
          states: state,
          branches: branch,
          vendors: vendor,
        },
      });
      setAuditPeriodsOptions(res.data);
    } catch (error) {
      console.error("Failed to load audit periods", error);
      message.error("Failed to load audit periods");
    }
  };

  const generateReport = async () => {
    setLoading(true);

    try {
      const payload = {
        states: state.includes("all") ? [] : state,
        branches: branch.includes("all") ? [] : branch,
        vendors: vendor.includes("all") ? [] : vendor,
        audit_periods: auditMonth.includes("all") ? [] : auditMonth,
      };

      const response = await api.post(
        "/api/vendor/reports/exceptional-approval/",
        payload,
        { responseType: "blob" }
      );

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      let filename = "ExceptionalApprovalReport.xlsx";
      const disposition = response.headers["content-disposition"];
      if (disposition) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
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
        message.warning("No records found for the selected filters.");
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
        reportType="exception"
        principalEmployer={principalEmployer}
        setPrincipalEmployer={setPrincipalEmployer}
        state={state}
        setState={setState}
        branch={branch}
        setBranch={setBranch}
        vendor={vendor}
        setVendor={setVendor}
        auditMonth={auditMonth}
        setAuditMonth={setAuditMonth}
        loading={loading}
        statesOptions={statesOptions}
        branchesOptions={branchesOptions}
        vendorsOptions={vendorsOptions}
        servicesOptions={[]}
        auditPeriodsOptions={auditPeriodsOptions}
        onGenerate={generateReport}
      />
    </div>
  );
}