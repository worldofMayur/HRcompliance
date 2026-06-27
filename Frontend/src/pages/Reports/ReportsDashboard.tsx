import { Card, Select } from "antd";
import { useState } from "react";

const { Option } = Select;

export default function ReportsDashboard() {
  const [report, setReport] = useState("");

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-2xl font-bold">
          Reports & Dashboard
        </h1>

        <p className="text-gray-500 mt-1">
          Dashboard will be developed later.
        </p>
      </div>

      <Card title="Select Report">

        <Select
          placeholder="Select Report"
          style={{ width: 350 }}
          value={report || undefined}
          onChange={setReport}
        >
          <Option value="branch">
            Branch Wise Vendor Mapping
          </Option>

          <Option value="compliance">
            Vendor Compliance Status
          </Option>

          <Option value="exception">
            Exceptional Approval Report
          </Option>
        </Select>

      </Card>

      {report === "branch" && (
        <Card title="Branch Wise Vendor Mapping">
          Coming Soon...
        </Card>
      )}

      {report === "compliance" && (
        <Card title="Vendor Compliance Status">
          Coming Soon...
        </Card>
      )}

      {report === "exception" && (
        <Card title="Exceptional Approval Report">
          Coming Soon...
        </Card>
      )}

    </div>
  );
}