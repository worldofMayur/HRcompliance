import { useState } from "react";

import ReportFilters from "../components/ReportFilters";
import ReportTable from "../components/ReportTable";

import { REPORT_COLUMNS } from "../data/reportConfig";

export default function ComplianceReport() {
  const [principalEmployer, setPrincipalEmployer] = useState("");
  const [state, setState] = useState("");
  const [branch, setBranch] = useState("");
  const [vendor, setVendor] = useState("");
  const [periodicity, setPeriodicity] = useState("");
  const [auditMonth, setAuditMonth] = useState("");

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);

  const generateReport = async () => {
    setLoading(true);

    try {

      console.log({
        vendor,
        state,
        periodicity,
        auditMonth,
      });

      setTimeout(() => {

        setData([
          {
            state: "Maharashtra",
            branch: "Mumbai",
            vendor: "ABC Security",
            audit_month: "June",
            status: "Completed",
            clearance_date: "25-Jun-2026",
          },
        ]);

        setLoading(false);

      }, 800);

    } catch (error) {

      console.error(error);

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
    />

    <div className="flex-1 min-h-0 overflow-hidden">

      <ReportTable
        columns={REPORT_COLUMNS.compliance}
        data={data}
        loading={loading}
      />

    </div>

  </div>
);
}