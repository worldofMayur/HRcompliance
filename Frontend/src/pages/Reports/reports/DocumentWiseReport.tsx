import { useState, useEffect } from "react";
import { message } from "antd";

import api from "../../../utils/api";
import ReportFilters from "../components/ReportFilters";

interface DropdownOption {
  id: string;
  name: string;
}

export default function DocumentWiseReport() {
  const [principalEmployer, setPrincipalEmployer] = useState("");

  const [state, setState] = useState<string[]>([]);
  const [branch, setBranch] = useState<string[]>([]);
  const [vendor, setVendor] = useState<string[]>([]);
  const [documentName, setDocumentName] = useState<string[]>([]);
  const [auditMonth, setAuditMonth] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);

  const [statesOptions, setStatesOptions] = useState<DropdownOption[]>([]);
  const [branchesOptions, setBranchesOptions] = useState<DropdownOption[]>([]);
  const [vendorsOptions, setVendorsOptions] = useState<DropdownOption[]>([]);
  const [documentsOptions, setDocumentsOptions] = useState<DropdownOption[]>([]);
  const [auditPeriodsOptions, setAuditPeriodsOptions] = useState<DropdownOption[]>([]);

  // Load Initial Data
  useEffect(() => {
    loadStates();
  }, []);

  // Cascade Loading
  useEffect(() => {
    setBranch([]);
    setVendor([]);
    setDocumentName([]);
    setAuditMonth([]);

    setBranchesOptions([]);
    setVendorsOptions([]);
    setDocumentsOptions([]);
    setAuditPeriodsOptions([]);

    if (state.length > 0) loadBranches();
  }, [state]);

  useEffect(() => {
    setVendor([]);
    setDocumentName([]);
    setAuditMonth([]);

    setVendorsOptions([]);
    setDocumentsOptions([]);
    setAuditPeriodsOptions([]);

    if (state.length > 0 && branch.length > 0) loadVendors();
  }, [state, branch]);

  useEffect(() => {
    setDocumentName([]);
    setDocumentsOptions([]);

    if (state.length > 0 && branch.length > 0 && vendor.length > 0) {
      loadDocuments();
      loadAuditPeriods();
    }
  }, [state, branch, vendor]);

  const loadStates = async () => {
    try {
      const res = await api.get("/api/vendor/reports/states/");
      setStatesOptions(res.data);
    } catch (error) {
      console.error(error);
      message.error("Failed to load states");
    }
  };

  const loadBranches = async () => {
    try {
      const res = await api.get("/api/vendor/reports/branches/", {
        params: { states: state },
      });
      setBranchesOptions(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadVendors = async () => {
    try {
      const res = await api.get("/api/vendor/reports/vendors/", {
        params: { states: state, branches: branch },
      });
      setVendorsOptions(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadDocuments = async () => {
    try {
      const res = await api.get("/api/vendor/reports/documents/", {
        params: { states: state, branches: branch, vendors: vendor },
      });
      setDocumentsOptions(res.data);
    } catch (error) {
      console.error("Failed to load documents", error);
    }
  };

  const loadAuditPeriods = async () => {
    try {
      const res = await api.get("/api/vendor/reports/audit-periods/", {
        params: { states: state, branches: branch, vendors: vendor },
      });
      setAuditPeriodsOptions(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const generateReport = async () => {
    setLoading(true);

    try {
      const payload = {
        states: state.includes("all") ? [] : state,
        branches: branch.includes("all") ? [] : branch,
        vendors: vendor.includes("all") ? [] : vendor,
        documents: documentName.includes("all") ? [] : documentName,
        audit_periods: auditMonth.includes("all") ? [] : auditMonth,
      };

      const response = await api.post(
        "/api/vendor/reports/document-wise/",
        payload,
        { responseType: "blob" }
      );

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      let filename = "Document_Wise_Compliance_Status.xlsx";
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

      message.success("Document Wise Report downloaded successfully.");
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
        reportType="document"
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
        documentName={documentName}
        setDocumentName={setDocumentName}
        documentsOptions={documentsOptions}
        loading={loading}
        statesOptions={statesOptions}
        branchesOptions={branchesOptions}
        vendorsOptions={vendorsOptions}
        auditPeriodsOptions={auditPeriodsOptions}
        onGenerate={generateReport}
      />
    </div>
  );
}