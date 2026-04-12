import { useEffect, useState } from "react";
import axios from "axios";
import { Table, Upload, Input, Button, message, Select } from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import type { ColumnsType } from "antd/es/table";

const { TextArea } = Input;
const { Option } = Select;

interface PE {
  id: number;
  short_name: string;
}

interface StateType {
  id: number;
  name: string;
}

interface Branch {
  id: number;
  name: string;
}

interface DocumentType {
  id: number;
  name: string;
  audit_period?: string;
}

interface DocumentRow {
  key: string;
  document_id: number | null;
  document_name: string;
  audit_period?: string;
  fileList: UploadFile[];
  remark: string;
  isAdditional?: boolean;
}

export default function VendorCompliancePage() {

  const token = localStorage.getItem("access_token");

  const authHeader = {
    headers: { Authorization: `Bearer ${token}` },
  };

  /* ================= MASTER DATA ================= */

  const [peList, setPeList] = useState<PE[]>([]);
  const [states, setStates] = useState<StateType[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [documents, setDocuments] = useState<DocumentType[]>([]);

  /* ================= SELECTED ================= */

  const [selectedPE, setSelectedPE] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("");

  const [frequencyBase, setFrequencyBase] = useState("");

  /* ================= TABLE DATA ================= */

  const [tableData, setTableData] = useState<DocumentRow[]>([]);
  const [generalRemark, setGeneralRemark] = useState("");
  const [loading, setLoading] = useState(false);
  const [mappingStartDate, setMappingStartDate] = useState(null);
  const [mappingEndDate, setMappingEndDate] = useState(null);

  /* ================= LOAD INITIAL ================= */

  useEffect(() => {
    loadMappedPE();
  }, []);

useEffect(() => {
  const options = getPeriodOptions();
  if (options.length) {
    setSelectedPeriod(options[options.length - 1]); // latest
  }
}, [mappingStartDate, mappingEndDate, frequencyBase]);


  const loadMappedPE = async () => {
    const res = await axios.get(
      "http://127.0.0.1:8000/api/vendor/mapped-pe/",
      authHeader
    );
    setPeList(res.data);
  };

  const formatDate = (date) => {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleDateString("en-GB"); // dd/mm/yyyy
};

  const loadStates = async (peId: string) => {
    const res = await axios.get(
      `http://127.0.0.1:8000/api/vendor/mapped-states/?pe_id=${peId}`,
      authHeader
    );
    setStates(res.data);
  };

  const loadBranches = async (peId: string, state: string) => {
    const res = await axios.get(
      `http://127.0.0.1:8000/api/vendor/mapped-branches/?pe_id=${peId}&state=${state}`,
      authHeader
    );
    setBranches(res.data);
  };

  const loadDocuments = async (peId: string, branchId: string) => {

    const res = await axios.get(
      `http://127.0.0.1:8000/api/vendor/mapped-documents/?pe_id=${peId}&branch_id=${branchId}`,
      authHeader
    );

    setDocuments(res.data);

      if (res.data.length > 0) {
        const base = res.data[0].frequency || "";
        setFrequencyBase(base);

        // ✅ ADD THIS
        setMappingStartDate(new Date(res.data[0].start_date));
        setMappingEndDate(new Date(res.data[0].end_date));
      }

    const rows: DocumentRow[] = res.data.map((doc: DocumentType) => ({
      key: `doc-${doc.id}`,
      document_id: doc.id,
      document_name: doc.name,
      audit_period: doc.audit_period,
      fileList: [],
      remark: "",
    }));

    setTableData(rows);
  };

  /* ================= PERIOD OPTIONS ================= */
const getPeriodOptions = () => {

  if (!mappingStartDate || !mappingEndDate || !frequencyBase) return [];

  // Normalize dates (avoid time issues)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startBoundary = new Date(mappingStartDate);
  startBoundary.setHours(0, 0, 0, 0);

  const endBoundary = new Date(mappingEndDate);
  endBoundary.setHours(0, 0, 0, 0);

  const format = (start, end) => {
    const opt = { month: "short" };

    const startMonth = start.toLocaleString("default", opt);
    const endMonth = end.toLocaleString("default", opt);

    const year = start.getFullYear();

    // ✅ MONTHLY CASE
    if (
      start.getMonth() === end.getMonth() &&
      start.getFullYear() === end.getFullYear()
    ) {
      return `${startMonth} ${year}`;
    }

    // ✅ RANGE CASE
    return `${startMonth}–${endMonth} ${year}`;
  };

const isValidPeriod = (start, end) => {
  return (
    start <= mappingEndDate &&
    end >= mappingStartDate &&
    start <= today // ✅ allow current period
  );
};

  const periods: string[] = [];

  /* ================= MONTHLY ================= */
  if (frequencyBase === "MONTHLY") {

    const current = new Date(startBoundary);
    current.setDate(1);

    while (current <= endBoundary) {

      const start = new Date(current);
      const end = new Date(
        current.getFullYear(),
        current.getMonth() + 1,
        0
      );

      if (isValidPeriod(start, end)) {
        periods.push(format(start, end));
      }

      current.setMonth(current.getMonth() + 1);
    }
  }

  /* ================= QUARTERLY ================= */
  else if (frequencyBase === "QUARTERLY") {

    const current = new Date(startBoundary);
    const qStartMonth = Math.floor(current.getMonth() / 3) * 3;

    current.setMonth(qStartMonth);
    current.setDate(1);

    while (current <= endBoundary) {

      const start = new Date(current);
      const end = new Date(
        current.getFullYear(),
        current.getMonth() + 3,
        0
      );

      if (isValidPeriod(start, end)) {
        periods.push(format(start, end));
      }

      current.setMonth(current.getMonth() + 3);
    }
  }

  /* ================= HALF YEARLY ================= */
  else if (frequencyBase === "HALF_YEARLY" || frequencyBase === "BI_ANNUALLY") {

    const current = new Date(startBoundary);

    // Align to Jan or Jul
    const month = current.getMonth();
    current.setMonth(month < 6 ? 0 : 6);
    current.setDate(1);

    while (current <= endBoundary) {

      const start = new Date(current);

      const end =
        current.getMonth() === 0
          ? new Date(current.getFullYear(), 5, 30)   // Jan–Jun
          : new Date(current.getFullYear(), 11, 31); // Jul–Dec

      if (isValidPeriod(start, end)) {
        periods.push(format(start, end));
      }

      current.setMonth(current.getMonth() + 6);
    }
  }

  /* ================= ANNUALLY ================= */
  else if (frequencyBase === "ANNUALLY") {

    const current = new Date(startBoundary);

    current.setMonth(0);
    current.setDate(1);

    while (current <= endBoundary) {

      const start = new Date(current);
      const end = new Date(current.getFullYear(), 11, 31);

      if (isValidPeriod(start, end)) {
        periods.push(format(start, end));
      }

      current.setFullYear(current.getFullYear() + 1);
    }
  }

  // ✅ REMOVE DUPLICATES + SORT
  return Array.from(new Set(periods));
};
  /* ================= UPDATE ROW ================= */

  const updateRow = (key: string, updated: Partial<DocumentRow>) => {

    setTableData(prev =>
      prev.map(row =>
        row.key === key ? { ...row, ...updated } : row
      )
    );
  };

  /* ================= REMOVE ROW ================= */

  const removeRow = (key: string) => {
    setTableData(prev => prev.filter(row => row.key !== key));
  };

  /* ================= ADD ADDITIONAL DOC ================= */

  const addAdditionalDocument = () => {

    setTableData(prev => [
      ...prev,
      {
        key: `additional-${Date.now()}`,
        document_id: null,
        document_name: "Additional Document",
        audit_period: selectedPeriod,
        fileList: [],
        remark: "",
        isAdditional: true
      }
    ]);
  };

  /* ================= TABLE COLUMNS ================= */

const columns: ColumnsType<DocumentRow> = [

  {
    title: "Document Name",
    dataIndex: "document_name",
    width: "25%",
    align: "center",
  },

  {
    title: "Compliance Period",
    dataIndex: "audit_period",
    width: "20%",
    align: "center",
    render: () => (
      <span className="font-medium">{selectedPeriod}</span>
    )
  },

  {
    title: "Upload File",
    width: "25%",
    align: "center",
    render: (_, record) => (
      <Upload
        beforeUpload={() => false}
        fileList={record.fileList}
        maxCount={1}
        showUploadList={{ showRemoveIcon: true }}
        onChange={({ fileList }) =>
          updateRow(record.key, { fileList })
        }
      >
        <Button
          size="small"
          style={{
            borderRadius: 10,
            height: 30
          }}
        >
          Upload
        </Button>
      </Upload>
    ),
  },

  {
    title: "Remark",
    width: "25%",
    align: "center",
    render: (_, record) => (
      <Input
        size="small"
        value={record.remark}
        onChange={(e) =>
          updateRow(record.key, { remark: e.target.value })
        }
        className="rounded-xl text-center"
        style={{ height: 34 }}
      />
    ),
  },

  {
    title: "",
    width: "5%",
    align: "center",
    render: (_, record) =>
      record.isAdditional ? (
        <Button
          danger
          size="small"
          style={{ borderRadius: 10 }}
          onClick={() => removeRow(record.key)}
        >
          Remove
        </Button>
      ) : null,
  }

];

  /* ================= SUBMIT ================= */

  const handleSubmit = async () => {

    if (!selectedPE || !selectedState || !selectedBranch || !selectedPeriod) {
      message.error("Complete all selections.");
      return;
    }

    const hasFile = tableData.some(r => r.fileList.length > 0);

    if (!hasFile) {
      message.error("Upload at least one document.");
      return;
    }

    try {

      setLoading(true);

      const formData = new FormData();

      formData.append("pe_id", selectedPE);
      formData.append("branch_id", selectedBranch);
      formData.append("state_id", selectedState);
      formData.append("selected_period", selectedPeriod);
      formData.append("general_remark", generalRemark);

      tableData.forEach((row, index) => {

        if (row.fileList.length > 0) {

          formData.append(
            `document_${index}_file`,
            row.fileList[0].originFileObj as File
          );

          formData.append(
            `document_${index}_remark`,
            row.remark
          );

          if (row.document_id) {

            formData.append(
              `document_${index}_id`,
              row.document_id.toString()
            );
          }
        }
      });

      await axios.post(
        "http://127.0.0.1:8000/api/vendor/submit-compliance/",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      message.success("Compliance submitted successfully");

    } catch {

      message.error("Submission failed");

    } finally {

      setLoading(false);
    }
  };

  /* ================= UI ================= */

  return (

    <div className="space-y-6 w-full px-8">

      <div>
        <h1 className="text-2xl font-semibold text-gray-800">
          Submit Compliance Record
        </h1>

        <p className="text-sm text-gray-500">
          Upload compliance documents for the selected branch and period.
        </p>
      </div>


      {/* FILTERS */}

      <div className="bg-white p-6 rounded-xl shadow-sm border">

        <div className="grid md:grid-cols-4 gap-6">
              <p className="text-sm text-gray-500">PE Agreement Validity        </p>

          {/* PE */}

          {/* AGREEMENT DATE RANGE */}
{mappingStartDate && mappingEndDate && (
  <div className="md:col-span-4  rounded-lg px-4 py-3 flex items-center justify-between text-sm">

    <div className="flex items-center gap-6">

      <div>
        <span className="text-gray-500">Start:</span>
        <span className="ml-1 font-medium text-gray-800">
          {formatDate(mappingStartDate)}
        </span>
      </div>

      <div>
        <span className="text-gray-500">End:</span>
        <span className="ml-1 font-medium text-gray-800">
          {formatDate(mappingEndDate)}
        </span>
      </div>

    </div>

  </div>
)}

          <div className="flex flex-col">

            <label className="text-xs font-semibold text-gray-500 mb-1">
              Principal Employer
            </label>

            <select
              value={selectedPE}
              onChange={(e) => {

                setSelectedPE(e.target.value);
                setSelectedState("");
                setSelectedBranch("");
                setSelectedPeriod("");
                setTableData([]);

                loadStates(e.target.value);
              }}
              className="border rounded-xl px-3 py-2 text-sm"
            >
              <option value="">Select PE</option>

              {peList.map(pe => (
                <option key={pe.id} value={pe.id}>
                  {pe.short_name}
                </option>
              ))}

            </select>
          </div>


          {/* STATE */}

          <div className="flex flex-col">

            <label className="text-xs font-semibold text-gray-500 mb-1">
              State
            </label>

            <select
              disabled={!selectedPE}
              value={selectedState}
              onChange={(e) => {

                setSelectedState(e.target.value);
                setSelectedBranch("");
                setSelectedPeriod("");
                setTableData([]);

                loadBranches(selectedPE, e.target.value);
              }}
              className="border rounded-xl px-3 py-2 text-sm"
            >
              <option value="">Select State</option>

              {states.map(s => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}

            </select>
          </div>


          {/* BRANCH */}

          <div className="flex flex-col">

            <label className="text-xs font-semibold text-gray-500 mb-1">
              Branch
            </label>

            <select
              disabled={!selectedState}
              value={selectedBranch}
              onChange={(e) => {

                setSelectedBranch(e.target.value);

                loadDocuments(selectedPE, e.target.value);
              }}
              className="border rounded-xl px-3 py-2 text-sm"
            >
              <option value="">Select Branch</option>

              {branches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}

            </select>
          </div>


          {/* PERIOD */}

          <div className="flex flex-col">

            <label className="text-xs font-semibold text-gray-500 mb-1">
              Compliance Period
            </label>

<Select
  disabled={!selectedBranch}
  className="w-full custom-select"
  placeholder={`Select Period (${frequencyBase || "-"})`}
  value={selectedPeriod || undefined}
  onChange={(value) => setSelectedPeriod(value)}
  dropdownStyle={{
    borderRadius: 12,
    padding: 8,
  }}
  optionLabelProp="label"
>

  {getPeriodOptions().map((p, index, arr) => {
    const isLatest = index === arr.length - 1;

    return (
      <Option
        key={p}
        value={p}
        label={p}
      >
        <div className="flex justify-between items-center">

          {/* PERIOD TEXT */}
          <span className="font-medium text-gray-700">
            {p}
          </span>

          {/* CURRENT BADGE */}
          {isLatest && (
            <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
              Current
            </span>
          )}

        </div>
      </Option>
    );
  })}

</Select>

          </div>

        </div>

      </div>


      {/* DOCUMENT SECTION */}

      {selectedPeriod && (

        <div className="bg-white p-6 rounded-xl shadow-sm border">

          <div className="flex justify-between mb-4">

            <h2 className="text-lg font-semibold">
              Compliance Documents
            </h2>

            <Button
              type="primary"
              ghost
              onClick={addAdditionalDocument}
            >
              + Add Additional Document
            </Button>

          </div>


          <Table
            columns={columns}
            dataSource={tableData}
            pagination={false}
            bordered
            size="middle"
            scroll={{ x: true }}
            locale={{
              emptyText: "No documents available for this branch"
            }}
          />


          <div className="mt-8">

            <label className="block text-sm font-semibold mb-2">
              General Remarks
            </label>

            <TextArea
              rows={4}
              className="rounded-xl"
              value={generalRemark}
              onChange={(e) => setGeneralRemark(e.target.value)}
            />

          </div>

        </div>
      )}


      {/* SUBMIT BUTTON */}

      {selectedPeriod && (

        <div className="flex justify-end">

          <Button
            type="primary"
            size="large"
            loading={loading}
            onClick={handleSubmit}
          >
            Submit Compliance Record
          </Button>

        </div>

      )}

    </div>
  );
}