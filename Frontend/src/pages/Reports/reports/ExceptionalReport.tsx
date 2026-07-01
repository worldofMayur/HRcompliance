import { useState } from "react";

import ReportFilters from "../components/ReportFilters";

import { message } from "antd";
import api from "../../../utils/api";

export default function ExceptionalReport() {

  const [principalEmployer, setPrincipalEmployer] = useState("");
  const [state, setState] = useState<string[]>([]);
  const [branch, setBranch] = useState<string[]>([]);
  const [vendor, setVendor] = useState<string[]>([]);
  const [periodicity, setPeriodicity] = useState("");
  const [auditMonth, setAuditMonth] = useState("");

  const [loading, setLoading] = useState(false);

const generateReport = async () => {
  setLoading(true);

  try {
    const payload = {
      states: state,
      branches: branch,
      vendors: vendor,
      audit_period: auditMonth,
    };

    const response = await api.post(
      "/api/vendor/reports/exceptional-approval/",
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

    link.href = url;
    link.download = "ExceptionalApprovalReport.xlsx";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);

    message.success("Report downloaded successfully.");
  } catch (error) {
    console.error(error);
    message.error("Failed to download report.");
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

  periodicity={periodicity}
  setPeriodicity={setPeriodicity}

  auditMonth={auditMonth}
  setAuditMonth={setAuditMonth}

  loading={loading}

  statesOptions={statesOptions}
  branchesOptions={branchesOptions}
  vendorsOptions={vendorsOptions}
  servicesOptions={[]}

  onGenerate={generateReport}
/>

  </div>
);
}