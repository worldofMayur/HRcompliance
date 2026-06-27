import { useState } from "react";

import ReportFilters from "../components/ReportFilters";
import ReportTable from "../components/ReportTable";

import { REPORT_COLUMNS } from "../data/reportConfig";

export default function BranchReport() {
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

      // ===========================
      // Replace with Backend API
      // ===========================

      console.log({
        principalEmployer,
        state,
        branch,
        vendor,
      });

      setTimeout(() => {

        setData([
          {
            state: "Maharashtra",
            branch: "Mumbai",
            vendor: "ABC Security",
            service: "Security",
            agreement_from: "01-Jan-2025",
            agreement_to: "31-Dec-2025",
            contact_person: "Rahul",
            mobile: "9876543210",
            email: "abc@gmail.com",
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
    <div className="space-y-6">

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

        periodicity={periodicity}
        setPeriodicity={setPeriodicity}

        auditMonth={auditMonth}
        setAuditMonth={setAuditMonth}

        onGenerate={generateReport}

      />

      <ReportTable

        columns={REPORT_COLUMNS.branch}

        data={data}

        loading={loading}

      />

    </div>
  );

}