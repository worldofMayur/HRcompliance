import { useState, useEffect } from "react";
import { message } from "antd";

import api from "../../../utils/api";
import ReportFilters from "../components/ReportFilters";

  // Dropdown Options
interface DropdownOption {
  id: string;
  name: string;
}

export default function BranchReport() {
  const [principalEmployer, setPrincipalEmployer] = useState("");

  const [state, setState] = useState<string[]>([]);
  const [branch, setBranch] = useState<string[]>([]);
  const [vendor, setVendor] = useState<string[]>([]);
  const [natureOfService, setNatureOfService] = useState<string[]>([]);

  const [periodicity, setPeriodicity] = useState("");
  const [auditMonth, setAuditMonth] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);

  const [statesOptions, setStatesOptions] = useState<DropdownOption[]>([]);
  const [branchesOptions, setBranchesOptions] = useState<DropdownOption[]>([]);
  const [vendorsOptions, setVendorsOptions] = useState<DropdownOption[]>([]);
  const [servicesOptions, setServicesOptions] = useState<DropdownOption[]>([]);

  // Load initial data
useEffect(() => {
  loadStates();
}, []);

useEffect(() => {
  setBranch([]);
  setVendor([]);
  setNatureOfService([]);

  setBranchesOptions([]);
  setVendorsOptions([]);
  setServicesOptions([]);

  if (state.length > 0) {
    loadBranches();
  }
}, [state]);

useEffect(() => {
  setVendor([]);
  setNatureOfService([]);
  setVendorsOptions([]);
  setServicesOptions([]);

  if (state.length > 0 && branch.length > 0) {
    loadVendors();
  }
}, [state, branch]);

useEffect(() => {
  setNatureOfService([]);
  setServicesOptions([]);

  if (
    state.length > 0 &&
    branch.length > 0 &&
    vendor.length > 0
  ) {
    loadServices();
  }
}, [state, branch, vendor]);

  const loadStates = async () => {
    try {
      const res = await api.get("/api/vendor/reports/states/");
      // Add "All States" option
      setStatesOptions(res.data);
    } catch (error) {
      console.error("Failed to load states", error);
      message.error("Failed to load states");
    }
  };

  const loadBranches = async () => {
    try {
      const res = await api.get(
        "/api/vendor/reports/branches/",
        {
          params: {
            states: state,
          },
        }
      );

      setBranchesOptions(res.data);

    } catch (error) {
      console.error("Failed to load branches", error);
    }
  };

  const loadVendors = async () => {
    try {
      const res = await api.get(
        "/api/vendor/reports/vendors/",
        {
          params: {
            states: state,
            branches: branch,
          },
        }
      );

      setVendorsOptions(res.data);

    } catch (error) {
      console.error("Failed to load vendors", error);
    }
  };

  const loadServices = async () => {
    try {
      const res = await api.get(
        "/api/vendor/reports/services/",
        {
          params: {
            states: state,
            branches: branch,
            vendors: vendor,
          },
        }
      );

      setServicesOptions(res.data);

    } catch (error) {
      console.error("Failed to load services", error);
    }
  };

  const generateReport = async () => {
    setLoading(true);

    try {
      const payload = {
        states: state.includes("all") ? [] : state,
        branches: branch.includes("all") ? [] : branch,
        vendors: vendor.includes("all") ? [] : vendor,
        services: natureOfService.includes("all") ? [] : natureOfService,
      };

      const response = await api.post(
        "/api/vendor/reports/branch-wise/",
        payload,
        { responseType: "blob" }
      );

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      let filename = "BranchWiseVendorMapping.xlsx";
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
      console.error("Failed to generate branch report", error);
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
        reportType="branch"
        principalEmployer={principalEmployer}
        setPrincipalEmployer={setPrincipalEmployer}
        state={state}
        setState={setState}
        branch={branch}
        setBranch={setBranch}
        vendor={vendor}
        setVendor={setVendor}
        natureOfService={natureOfService}
        setNatureOfService={setNatureOfService}
        periodicity={periodicity}
        setPeriodicity={setPeriodicity}
        auditMonth={auditMonth}
        setAuditMonth={setAuditMonth}
        loading={loading}
        statesOptions={statesOptions}
        branchesOptions={branchesOptions}
        vendorsOptions={vendorsOptions}
        servicesOptions={servicesOptions}
        onGenerate={generateReport}
      />
    </div>
  );
}