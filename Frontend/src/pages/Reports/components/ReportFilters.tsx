import { Button, Select } from "antd";
import { SearchOutlined } from "@ant-design/icons";

const { Option } = Select;

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
          <h2 className="text-lg font-semibold">
            Report Filters
          </h2>

          <p className="text-xs text-gray-500">
            Select the required filters.
          </p>
        </div>

      </div>

      <div className="space-y-4">

        {/* State */}

        <div>

          <label className="mb-1 block text-sm font-semibold">
            State
          </label>

          <Select
            mode="multiple"
            allowClear
            showSearch
            maxTagCount="responsive"
            optionFilterProp="children"
            className="w-full"
            placeholder="All States"
            value={state}
            onChange={setState}
          >
            <Option value="all">
              All States
            </Option>

            {/* Replace with API data later */}
            <Option value="1">
              Maharashtra
            </Option>

          </Select>

        </div>

        {/* Branch */}

        {(reportType === "branch" ||
          reportType === "exception") && (

          <div>

            <label className="mb-1 block text-sm font-semibold">
              Branch
            </label>

            <Select
              mode="multiple"
              allowClear
              showSearch
              maxTagCount="responsive"
              optionFilterProp="children"
              className="w-full"
              placeholder="All Branches"
              value={branch}
              onChange={setBranch}
            >
              <Option value="all">
                All Branches
              </Option>

              {/* Replace with API data later */}
              <Option value="1">
                Mumbai
              </Option>

            </Select>

          </div>

        )}

        {/* Vendor */}

        <div>

          <label className="mb-1 block text-sm font-semibold">
            Vendor
          </label>

          <Select
            mode="multiple"
            allowClear
            showSearch
            maxTagCount="responsive"
            optionFilterProp="children"
            className="w-full"
            placeholder="All Vendors"
            value={vendor}
            onChange={setVendor}
          >
            {/* Replace with API data later */}
            <Option value="1">
              Vendor A
            </Option>

          </Select>

        </div>

        {/* Nature of Service */}

        {reportType === "branch" && (

          <div>

            <label className="mb-1 block text-sm font-semibold">
              Nature of Service
            </label>

            <Select
              mode="multiple"
              allowClear
              showSearch
              maxTagCount="responsive"
              optionFilterProp="children"
              className="w-full"
              placeholder="All Services"
              value={natureOfService}
              onChange={setNatureOfService}
            >
              <Option value="Security">
                Security
              </Option>

              <Option value="Housekeeping">
                Housekeeping
              </Option>

              <Option value="Maintenance">
                Maintenance
              </Option>

              <Option value="Cafeteria">
                Cafeteria
              </Option>

              <Option value="Manpower">
                Manpower
              </Option>

            </Select>

          </div>

        )}

        {/* Compliance Report */}

        {reportType === "compliance" && (

          <div>

            <label className="mb-1 block text-sm font-semibold">
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
              <Option value="Half Yearly">Half Yearly</Option>
              <Option value="Yearly">Yearly</Option>
            </Select>

          </div>

        )}

        {(reportType === "compliance" ||
          reportType === "exception") && (

          <div>

            <label className="mb-1 block text-sm font-semibold">
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