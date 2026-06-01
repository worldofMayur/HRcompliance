import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Table, Upload, Input, Button, message, Select } from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import CCEmailInput from "./CCEmailInput";
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
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const docRef = useRef(null);

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

  // ✅ ONLY SET DEFAULT IF EMPTY
  if (!selectedPeriod && options.length) {
    setSelectedPeriod(options[options.length - 1]);
  }

}, [mappingStartDate, mappingEndDate, frequencyBase]);

useEffect(() => {
  if (selectedPE) {
    loadStates(selectedPE);
  }
}, [selectedPE]);

useEffect(() => {
  if (selectedPE && selectedState) {
    loadBranches(selectedPE, selectedState);
  }
}, [selectedState]);

useEffect(() => {
  if (selectedPE && selectedBranch) {
    loadMappingMeta(selectedPE, selectedBranch);
  }
}, [selectedBranch]);

useEffect(() => {
  if (selectedPE && selectedBranch && selectedPeriod) {
    loadDocuments(selectedPE, selectedBranch);
  }
}, [selectedPeriod]);

useEffect(() => {
  if (selectedPE && selectedBranch) {
    loadMappingMeta(selectedPE, selectedBranch);
  }
}, [selectedBranch]);


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

    const refreshAll = async () => {
    if (selectedPE) {
      await loadStates(selectedPE);
    }
    if (selectedPE && selectedState) {
      await loadBranches(selectedPE, selectedState);
    }
    if (selectedPE && selectedBranch) {
      await loadDocuments(selectedPE, selectedBranch);
    }
  };

  const loadMappingMeta = async (peId: string, branchId: string) => {
  try {
    const res = await axios.get(
      `http://127.0.0.1:8000/api/vendor/mapping-meta/?pe_id=${peId}&branch_id=${branchId}`,
      authHeader
    );

    const data = res.data;

    setMappingStartDate(data.start_date ? new Date(data.start_date) : null);
    setMappingEndDate(data.end_date ? new Date(data.end_date) : null);
    setFrequencyBase(data.frequency || "");

  } catch (err) {
    console.error(err);
  }
};

const loadDocuments = async (peId: string, branchId: string) => {
  if (!peId || !branchId) return;

  // ✅ Reset only table (NOT mapping meta)
  setTableData([]);
  setDocuments([]);

  try {
    const res = await axios.get(
      `http://127.0.0.1:8000/api/vendor/mapped-documents/?pe_id=${peId}&branch_id=${branchId}&period=${selectedPeriod}`,
      authHeader
    );

    const data = res.data || [];
    console.log("CALLING API WITH PERIOD:", selectedPeriod);

    // ✅ ONLY set documents
    setDocuments(data);

    // ❌ DO NOT TOUCH THESE (VERY IMPORTANT)
    // setFrequencyBase(...)
    // setMappingStartDate(...)
    // setMappingEndDate(...)

    // ✅ BUILD TABLE ROWS
    const rows: DocumentRow[] = data.map((doc: DocumentType) => ({
      key: `doc-${doc.id}`,
      document_id: doc.id,
      document_name: doc.name,
      audit_period: doc.audit_period,
      fileList: [],
    }));

    setTableData(rows);

    // ✅ AUTO SCROLL
    setTimeout(() => {
      docRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 300);

  } catch (error) {
    console.error(error);
    message.error("Failed to load documents");

    // ✅ Reset only table (NOT mapping meta)
    setDocuments([]);
    setTableData([]);
  }
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
    end >= mappingStartDate
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
        isAdditional: true
      }
    ]);
  };

  /* ================= TABLE COLUMNS ================= */

const columns: ColumnsType<DocumentRow> = [

  {
    title: "Document Name",
    dataIndex: "document_name",
    width: "35%",
    align: "center",
  },

  {
    title: "Upload File",
    width: "30%",
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
        <Button size="small" style={{ borderRadius: 10 }}>
          Upload
        </Button>
      </Upload>
    ),
  },

  {
    title: "",
    width: "10%",
    align: "center",
    render: (_, record) =>
      record.isAdditional ? (
        <Button danger size="small" onClick={() => removeRow(record.key)}>
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

  if (!generalRemark.trim()) {
    message.error("Please enter general remark.");
    return;
  }

  // ✅ CC EMAIL VALIDATION
  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const invalidEmails = (ccEmails || []).filter(e => !isValidEmail(e));

  if (invalidEmails.length > 0) {
    message.error("Invalid email(s) in CC field");
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

    // ✅ ADD CC EMAILS
    formData.append("cc_emails", JSON.stringify(ccEmails || []));

    let fileIndex = 0;

    tableData.forEach((row) => {
      if (row.fileList.length > 0) {

        formData.append(
          `document_${fileIndex}_file`,
          row.fileList[0].originFileObj as File
        );

        if (row.document_id) {
          formData.append(
            `document_${fileIndex}_id`,
            row.document_id.toString()
          );
        }

        fileIndex++;
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

    // ✅ REFRESH DROPDOWNS (ONLY ACTIVE DATA)
    await refreshAll();

    message.success({
      content: "Compliance submitted successfully",
      duration: 3,
    });

    // ✅ CLEAR ONLY FORM DATA (IMPORTANT)
    setTableData([]);
    setGeneralRemark("");
    setCcEmails([]);

  } catch (err: any) {

    console.error(err);

    const errorMsg =
      err?.response?.data?.error ||
      "Submission failed";

    message.error(errorMsg);

  } finally {
    setLoading(false);
  }
};

const uploadedCount = tableData.filter(r => r.fileList.length > 0).length;
const totalDocs = tableData.length;
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
                const peId = e.target.value;

                setSelectedPE(peId);
                setSelectedState("");
                setSelectedBranch("");
                setSelectedPeriod("");
                setTableData([]);
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
                const state = e.target.value;

                setSelectedState(state);
                setSelectedBranch("");
                setSelectedPeriod("");
                setTableData([]);
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
                const branchId = e.target.value;

                setSelectedBranch(branchId);
                setSelectedPeriod("");   // 🔥 RESET PERIOD
                setTableData([]);        // 🔥 RESET DATA
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
              Compliance Audit Period
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

    <div ref={docRef} className="bg-white p-6 rounded-xl shadow-sm border">

  <div className="flex justify-between items-center mb-4">

    {/* LEFT SIDE */}
    <div className="flex items-center gap-3">

      <h2 className="text-lg font-semibold text-gray-800 leading-none">
        Compliance Documents
      </h2>

      <span className="text-sm bg-blue-100 text-blue-600 px-3 py-1 rounded-full font-medium leading-none">
        {selectedPeriod}
      </span>

    </div>

    {/* RIGHT SIDE */}
    <div className="flex items-center gap-4">

      {/* ✅ UPLOAD PROGRESS */}
      <span className="text-sm font-medium text-gray-600">
        {totalDocs === 0
          ? "No documents"
          : `${uploadedCount}/${totalDocs} Uploaded`}
      </span>

      {/* ADD BUTTON */}
      <Button
        type="primary"
        ghost
        onClick={addAdditionalDocument}
      >
        + Add Additional Document
      </Button>

    </div>

  </div>


<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">

  {/* EMPTY STATE */}
{tableData.length === 0 && (
  <div className="col-span-full text-center py-10">

    <div className="text-gray-400 text-lg">
      ⚠ No compliance documents available
    </div>

    <p className="text-xs text-gray-400 mt-2">
      No documents are mapped for this branch
    </p>

  </div>
)}

  {tableData.map((record) => (

    <div
      key={record.key}
      className="border rounded-2xl p-4 bg-white shadow-sm hover:shadow-md transition h-32 flex flex-col justify-between"
    >

      {/* TOP: NAME + TAG */}
      <div className="flex items-center justify-between">
        <span className="font-semibold text-gray-800 truncate">
          {record.document_name}
        </span>

        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
          Required
        </span>
      </div>

      {/* MIDDLE: UPLOAD BUTTON */}
      <div className="flex items-center justify-between">

        <Upload
          beforeUpload={() => false}
          fileList={record.fileList}
          maxCount={1}
          showUploadList={false}   // cleaner UI
          onChange={({ fileList }) =>
            updateRow(record.key, { fileList })
          }
        >
          <Button
            size="small"
            className="rounded-lg bg-blue-600 text-white hover:bg-blue-700 border-none"
          >
            Upload
          </Button>
        </Upload>

        {/* REMOVE BUTTON */}
        {record.isAdditional && (
          <Button
            danger
            size="small"
            onClick={() => removeRow(record.key)}
          >
            Remove
          </Button>
        )}

      </div>

      {/* BOTTOM: FILE NAME */}
      <div className="text-xs truncate">

        {record.fileList.length > 0 ? (
          <span className="text-green-600 font-medium">
            ✔ Uploaded: {record.fileList[0].name}
          </span>
        ) : (
<span className="text-gray-400 italic">No file uploaded</span>
        )}

      </div>

    </div>

  ))}

</div>


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
          size="medium"
          loading={loading}
          disabled={
            !selectedPE ||
            !selectedState ||
            !selectedBranch ||
            !selectedPeriod ||
            tableData.every(r => r.fileList.length === 0) ||
            !generalRemark.trim()
          }
          onClick={handleSubmit}
        >
          Submit Compliance Record
        </Button>

        </div>

      )}

    </div>
  );
}