import { useState } from "react";

import ReportFilters from "../components/ReportFilters";
import ReportTable from "../components/ReportTable";

import { REPORT_COLUMNS } from "../data/reportConfig";

export default function ExceptionalReport() {

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
        principalEmployer,
        state,
        branch,
        vendor,
        auditMonth,
      });

      setTimeout(() => {

        setData([
          {
            state: "Maharashtra",
            branch: "Mumbai",
            vendor: "ABC Security",
            document: "Labour License",
            observation: "Expired",
            recommendation: "Renew Immediately",
            approval_status: "Pending",
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

      onGenerate={generateReport}
    />

    <div className="flex-1 min-h-0 overflow-hidden">

      <ReportTable
        columns={REPORT_COLUMNS.exception}
        data={data}
        loading={loading}
      />

    </div>

  </div>
);
}