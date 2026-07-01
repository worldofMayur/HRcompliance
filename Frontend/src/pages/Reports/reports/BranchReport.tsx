import { useState } from "react";
import { message } from "antd";

import api from "../../../utils/api";
import ReportFilters from "../components/ReportFilters";

export default function BranchReport() {
  const [principalEmployer, setPrincipalEmployer] = useState("");

  const [state, setState] = useState<string[]>([]);
  const [branch, setBranch] = useState<string[]>([]);
  const [vendor, setVendor] = useState<string[]>([]);
  const [natureOfService, setNatureOfService] = useState<string[]>([]);

  const [periodicity, setPeriodicity] = useState("");
  const [auditMonth, setAuditMonth] = useState("");

  const [loading, setLoading] = useState(false);
  const [statesOptions] = useState<any[]>([]);
  const [branchesOptions] = useState<any[]>([]);
  const [vendorsOptions] = useState<any[]>([]);
  const [servicesOptions] = useState<any[]>([]);

  const generateReport = async () => {
    setLoading(true);

    try {
      const response = await api.post(
        "/api/vendor/reports/branch-wise/",
        {
          states: state.includes("all") ? [] : state,
          branches: branch.includes("all") ? [] : branch,
          vendors: vendor,
          services: natureOfService,
        },
        {
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], {
        type:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      let filename = "BranchWiseVendorMapping.xlsx";

      const disposition =
        response.headers["content-disposition"];

      if (disposition) {
        const match = disposition.match(
          /filename="?([^"]+)"?/
        );

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

      message.success(
        "Branch Wise Vendor Mapping downloaded successfully."
      );

    } catch (error: any) {

      console.error(error);

      if (error.response?.status === 404) {
        message.warning(
          "No records found for the selected filters."
        );
      } else {
        message.error(
          "Failed to download report."
        );
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