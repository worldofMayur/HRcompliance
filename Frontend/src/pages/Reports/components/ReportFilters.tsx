import { Button, Select } from "antd";
import { SearchOutlined } from "@ant-design/icons";

const { Option } = Select;

interface Props {
  reportType: "branch" | "compliance" | "exception";

  principalEmployer: string;
  setPrincipalEmployer: (value: string) => void;

  state: string;
  setState: (value: string) => void;

  branch: string;
  setBranch: (value: string) => void;

  vendor: string;
  setVendor: (value: string) => void;

  periodicity: string;
  setPeriodicity: (value: string) => void;

  auditMonth: string;
  setAuditMonth: (value: string) => void;

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

  periodicity,
  setPeriodicity,

  auditMonth,
  setAuditMonth,

  onGenerate,
}: Props) {
  return (
    <div className="rounded-xl border bg-white p-6 dark:bg-gray-900">

      <h2 className="mb-6 text-xl font-semibold">
        Report Filters
      </h2>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

        {(reportType === "branch" || reportType === "exception") && (
          <div>
            <label className="mb-2 block text-sm font-medium">
              Principal Employer
            </label>

            <Select
              className="w-full"
              placeholder="Select Principal Employer"
              value={principalEmployer || undefined}
              onChange={setPrincipalEmployer}
            >
              <Option value="1">Sample PE</Option>
            </Select>
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium">
            State
          </label>

          <Select
            className="w-full"
            placeholder="Select State"
            value={state || undefined}
            onChange={setState}
          >
            <Option value="1">Maharashtra</Option>
          </Select>
        </div>

        {(reportType === "branch" ||
          reportType === "exception") && (
          <div>
            <label className="mb-2 block text-sm font-medium">
              Branch
            </label>

            <Select
              className="w-full"
              placeholder="Select Branch"
              value={branch || undefined}
              onChange={setBranch}
            >
              <Option value="1">Mumbai</Option>
            </Select>
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium">
            Vendor
          </label>

          <Select
            className="w-full"
            placeholder="Select Vendor"
            value={vendor || undefined}
            onChange={setVendor}
          >
            <Option value="1">Vendor A</Option>
          </Select>
        </div>

        {(reportType === "compliance") && (
          <div>
            <label className="mb-2 block text-sm font-medium">
              Audit Periodicity
            </label>

            <Select
              className="w-full"
              placeholder="Select Periodicity"
              value={periodicity || undefined}
              onChange={setPeriodicity}
            >
              <Option value="Monthly">Monthly</Option>
              <Option value="Quarterly">Quarterly</Option>
              <Option value="Half Yearly">
                Half Yearly
              </Option>
              <Option value="Yearly">Yearly</Option>
            </Select>
          </div>
        )}

        {(reportType === "compliance" ||
          reportType === "exception") && (
          <div>
            <label className="mb-2 block text-sm font-medium">
              Audit Month
            </label>

            <Select
              className="w-full"
              placeholder="Select Audit Month"
              value={auditMonth || undefined}
              onChange={setAuditMonth}
            >
              <Option value="January">January</Option>
              <Option value="February">February</Option>
              <Option value="March">March</Option>
              <Option value="April">April</Option>
              <Option value="May">May</Option>
              <Option value="June">June</Option>
              <Option value="July">July</Option>
              <Option value="August">August</Option>
              <Option value="September">September</Option>
              <Option value="October">October</Option>
              <Option value="November">November</Option>
              <Option value="December">December</Option>
            </Select>
          </div>
        )}
      </div>

      <div className="mt-8">
        <Button
          type="primary"
          icon={<SearchOutlined />}
          size="large"
          onClick={onGenerate}
        >
          Generate Report
        </Button>
      </div>
    </div>
  );
}