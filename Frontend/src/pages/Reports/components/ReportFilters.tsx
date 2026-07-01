import { Button } from "antd";
import { SearchOutlined } from "@ant-design/icons";

import MultiSelectCheckbox from "../../../components/MultiSelectCheckbox";
interface Props {
  reportType: "branch" | "compliance" | "exception";

  principalEmployer: string;
  setPrincipalEmployer: (value: string) => void;

  state: string[];
  setState: (value: string[]) => void;

  branch: string[];
  setBranch: (value: string[]) => void;

  vendor: string[];
  setVendor: (value: string[]) => void;

  natureOfService: string[];
  setNatureOfService: (value: string[]) => void;

  periodicity: string;
  setPeriodicity: (value: string) => void;

  auditMonth: string;
  setAuditMonth: (value: string) => void;

  statesOptions: { id: string; name: string }[];
  branchesOptions: { id: string; name: string }[];
  vendorsOptions: { id: string; name: string }[];
  servicesOptions: { id: string; name: string }[];

  loading?: boolean;
  onGenerate: () => void;
}

export default function ReportFilters({
  reportType,
  principalEmployer,
  setPrincipalEmployer,
  state,
  setState,
  branch,
  setBranch,
  vendor,
  setVendor,
  natureOfService,
  setNatureOfService,
  periodicity,
  setPeriodicity,
  auditMonth,
  setAuditMonth,
  statesOptions,
  branchesOptions,
  vendorsOptions,
  servicesOptions,
  loading,
  onGenerate,
}: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-lg">
          🔍
        </div>
        <div>
          <h2 className="text-lg font-semibold">Report Filters</h2>
          <p className="text-xs text-gray-500">Select the required filters.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-semibold">State</label>
          <MultiSelectCheckbox
              options={statesOptions}
              value={state}
              onChange={setState}
              placeholder="Select States"
          />
        </div>

        {(reportType === "branch" || reportType === "exception") && (
          <div>
            <label className="mb-1 block text-sm font-semibold">Branch</label>
            <MultiSelectCheckbox
                options={branchesOptions}
                value={branch}
                onChange={setBranch}
                placeholder="Select Branches"
            />
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-semibold">Vendor</label>
          <MultiSelectCheckbox
              options={vendorsOptions}
              value={vendor}
              onChange={setVendor}
              placeholder="Select Vendors"
          />
        </div>

        {reportType === "branch" && (
          <div>
            <label className="mb-1 block text-sm font-semibold">
              Nature of Service
            </label>
            <MultiSelectCheckbox
                options={servicesOptions}
                value={natureOfService}
                onChange={setNatureOfService}
                placeholder="Select Services"
            />
          </div>
        )}

        {/* Compliance fields remain the same */}
        {reportType === "compliance" && (
          <div>
            <label className="mb-1 block text-sm font-semibold">
              Audit Periodicity
            </label>
            {/* Keep your original Select here */}
          </div>
        )}

        {(reportType === "compliance" || reportType === "exception") && (
          <div>
            <label className="mb-1 block text-sm font-semibold">
              Audit Month
            </label>
            {/* Keep your original Select here */}
          </div>
        )}
      </div>

      <div className="mt-6">
        <Button
          type="primary"
          size="large"
          block
          loading={loading}
          icon={<SearchOutlined />}
          onClick={onGenerate}
        >
          Download Report
        </Button>
      </div>
    </div>
  );
}