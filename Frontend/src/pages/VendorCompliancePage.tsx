import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Upload, Input, Button, message, Select } from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import { useLocation } from "react-router-dom";

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
  canReupload?: boolean;

}

export default function VendorCompliancePage() {

  const token = localStorage.getItem("access_token");
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const location = useLocation();
  const prefillData = location.state?.prefill;

  /* ================= STATE ================= */
  const [peList, setPeList] = useState<PE[]>([]);
  const [states, setStates] = useState<StateType[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [documents, setDocuments] = useState<DocumentType[]>([]);
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [tableData, setTableData] = useState<DocumentRow[]>([]);
  const [generalRemark, setGeneralRemark] = useState("");
  const [loading, setLoading] = useState(false);
  const [documentsLoading, setDocumentsLoading] = useState(false);

  const [selectedPE, setSelectedPE] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [frozenPeriods, setFrozenPeriods] = useState<string[]>([]);
  const [reuploadMode, setReuploadMode] = useState(false);
  const [failedEntries, setFailedEntries] = useState<any[]>([]);
  const [complianceId, setComplianceId] = useState<number | null>(null);

  const [mappingStartDate, setMappingStartDate] = useState<any>(null);
  const [mappingEndDate, setMappingEndDate] = useState<any>(null);
  const [frequencyBase, setFrequencyBase] = useState("");

  
  const docRef = useRef<any>(null);

  /* ================= FORMAT DATE ================= */
  const formatDate = (date: any) => {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleDateString("en-GB");
  };

  /* ================= PREFILL ================= */
    /* ================= PREFILL ================= */
  useEffect(() => {
    if (prefillData) {

      console.log("🔄 Notification Prefill:", prefillData);

      if (prefillData.pe_id) {
        setSelectedPE(String(prefillData.pe_id));
      }

      if (prefillData.state) {
        setSelectedState(prefillData.state);
      }

      if (prefillData.branch_id) {
        setSelectedBranch(String(prefillData.branch_id));
      }

      if (prefillData.selected_period) {
        setSelectedPeriod(prefillData.selected_period);
      }

      if (prefillData.entries) {
        setFailedEntries(prefillData.entries);
      }

      if (prefillData.compliance_id) {
        setComplianceId(prefillData.compliance_id);
      }

      if (prefillData.reupload_mode) {
        setReuploadMode(true);
      }
    }
  }, [prefillData]);

  /* ================= LOAD CHAIN ================= */
  useEffect(() => { 
    loadMappedPE(); 
  }, []);

  // Load States when PE changes
  useEffect(() => { 
    if (selectedPE) loadStates(selectedPE); 
  }, [selectedPE]);

  // Load Branches when PE + State changes
  useEffect(() => { 
    if (selectedPE && selectedState) {
      loadBranches(selectedPE, selectedState); 
    }
  }, [selectedPE, selectedState]);

  // Load Mapping Meta when PE + Branch changes
  useEffect(() => { 
    if (selectedPE && selectedBranch) {
      loadMappingMeta(selectedPE, selectedBranch); 
    }
  }, [selectedPE, selectedBranch]);

  // 🔥 Strong Reset when Branch is cleared
  useEffect(() => {
    if (!selectedBranch) {
      setSelectedPeriod("");
      setTableData([]);
      setDocuments([]);
    }
  }, [selectedBranch]);

  // 🔥 Load & Auto-select Period when mapping data is ready
  useEffect(() => {
    if (selectedBranch && mappingStartDate && mappingEndDate && frequencyBase) {
      const periods = getPeriodOptions();

      if (periods.length > 0) {
        // Auto-select the latest valid period
        const latestPeriod = periods[periods.length - 1];
        console.log("📅 Auto selected audit period:", latestPeriod);
        setSelectedPeriod(latestPeriod);
      } else {
        setSelectedPeriod("");
      }
    }
  }, [selectedBranch, mappingStartDate, mappingEndDate, frequencyBase]);

  // Load Documents when all required fields are selected
  useEffect(() => {
    if (selectedPE && selectedBranch && selectedPeriod) {
      console.log("📄 Loading documents for period:", selectedPeriod);
      loadDocuments(selectedPE, selectedBranch);
    }
  }, [selectedPE, selectedBranch, selectedPeriod]);
  const loadMappedPE = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/vendor/mapped-pe/", authHeader);
      setPeList(res.data);
    } catch (err) { console.error(err); }
  };

  const loadStates = async (peId: string) => {
    try {
      const res = await axios.get(`http://127.0.0.1:8000/api/vendor/mapped-states/?pe_id=${peId}`, authHeader);
      setStates(res.data);
    } catch (err) { console.error(err); }
  };

  const loadBranches = async (peId: string, state: string) => {
    try {
      const res = await axios.get(`http://127.0.0.1:8000/api/vendor/mapped-branches/?pe_id=${peId}&state=${state}`, authHeader);
      setBranches(res.data);
    } catch (err) { console.error(err); }
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

  const loadFrozenPeriods = async (
  branchId: string
) => {

  try {

    const res = await axios.get(
      `http://127.0.0.1:8000/api/vendor/frozen-periods/?branch_id=${branchId}`,
      authHeader
    );

    setFrozenPeriods(res.data || []);

  } catch (err) {
    console.error(err);
  }
};

  const loadDocuments = async (
  peId: string,
  branchId: string
) => {
  if (!peId || !branchId || !selectedPeriod) return;

  try {
    setDocumentsLoading(true);

    const res = await axios.get(
      `http://127.0.0.1:8000/api/vendor/mapped-documents/?pe_id=${peId}&branch_id=${branchId}&period=${encodeURIComponent(
        selectedPeriod
      )}`,
      authHeader
    );

    const data = res.data || [];

    console.log(
      "✅ Documents loaded:",
      data.length,
      data
    );

    setDocuments(data);

    console.log("❌ Failed Entries:", failedEntries);

    const failedDocNames = failedEntries.map(
      (e: any) =>
        String(
          e.audit_particular || ""
        )
          .trim()
          .toLowerCase()
    );

    console.log(
      "📄 Failed Document Names:",
      failedDocNames
    );

    const rows: DocumentRow[] = data.map(
      (doc: DocumentType) => ({

        key: `doc-${doc.id}`,

        document_id: doc.id,

        document_name: doc.name,

        audit_period: doc.audit_period,

        fileList: [],

        // ✅ IMPORTANT
        // ONLY failed docs reuploadable

      canReupload: Boolean(
        reuploadMode
          ? failedDocNames.some(
              (name: string) =>
                name.includes(
                  doc.name?.trim().toLowerCase()
                ) ||
                doc.name
                  ?.trim()
                  .toLowerCase()
                  .includes(name)
            )
          : true
      )
      })
    );

    console.log(
      "✅ Final Document Rows:",
      rows
    );

    setTableData(rows);
  } catch (error) {
    console.error("Failed to load documents:", error);

    message.error("Failed to load documents");
  } finally {
    setDocumentsLoading(false);
  }
};

  /* ================= PERIOD OPTIONS ================= */
const getPeriodOptions = () => {
  if (!mappingStartDate || !mappingEndDate || !frequencyBase) {
    return [];
  }

  const startBoundary = new Date(mappingStartDate);
  const endBoundary = new Date(mappingEndDate);
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const periods: string[] = [];

  const formatPeriod = (start: Date, end: Date): string => {
    const monthOpt: Intl.DateTimeFormatOptions = { month: "short" };
    const startMonth = start.toLocaleString("default", monthOpt);
    const endMonth = end.toLocaleString("default", monthOpt);
    const year = start.getFullYear();

    return start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()
      ? `${startMonth} ${year}`
      : `${startMonth}–${endMonth} ${year}`;
  };

  const isValidPeriod = (start: Date, end: Date): boolean => {
    return (
      start.getTime() <= endBoundary.getTime() &&
      end.getTime() >= startBoundary.getTime() &&
      start.getTime() <= today.getTime()   // Only show started periods
    );
  };

  const normalizedFrequency = String(frequencyBase).trim().toUpperCase();

  let current = new Date(startBoundary.getTime());

  if (normalizedFrequency === "MONTHLY") {
    current.setDate(1);
    while (current <= endBoundary) {
      const start = new Date(current);
      const end = new Date(current.getFullYear(), current.getMonth() + 1, 0);
      if (isValidPeriod(start, end)) periods.push(formatPeriod(start, end));
      current.setMonth(current.getMonth() + 1);
    }
  } 
  else if (normalizedFrequency === "QUARTERLY") {
    const qStartMonth = Math.floor(current.getMonth() / 3) * 3;
    current.setMonth(qStartMonth);
    current.setDate(1);

    while (current <= endBoundary) {
      const start = new Date(current);
      const end = new Date(current.getFullYear(), current.getMonth() + 3, 0);
      if (isValidPeriod(start, end)) periods.push(formatPeriod(start, end));
      current.setMonth(current.getMonth() + 3);
    }
  } 
  else if (normalizedFrequency === "HALF_YEARLY") {
    const halfStartMonth = current.getMonth() < 6 ? 0 : 6;
    current.setMonth(halfStartMonth);
    current.setDate(1);

    while (current <= endBoundary) {
      const start = new Date(current);
      const end = new Date(current.getFullYear(), current.getMonth() + 6, 0);
      if (isValidPeriod(start, end)) periods.push(formatPeriod(start, end));
      current.setMonth(current.getMonth() + 6);
    }
  } 
  else if (normalizedFrequency === "ANNUALLY") {
    current.setMonth(0);
    current.setDate(1);

    while (current <= endBoundary) {
      const start = new Date(current);
      const end = new Date(current.getFullYear(), 11, 31);
      if (isValidPeriod(start, end)) periods.push(formatPeriod(start, end));
      current.setFullYear(current.getFullYear() + 1);
    }
  }

  return Array.from(
  new Set(periods)
).filter(
  (p) => !frozenPeriods.includes(p)
);
};
  const updateRow = (key: string, updated: Partial<DocumentRow>) => {
    setTableData(prev => prev.map(row => row.key === key ? { ...row, ...updated } : row));
  };

  const removeRow = (key: string) => {
    setTableData(prev => prev.filter(row => row.key !== key));
  };

  const addAdditionalDocument = () => {
    setTableData(prev => [...prev, {
      key: `additional-${Date.now()}`,
      document_id: null,
      document_name: "Additional Document",
      audit_period: selectedPeriod,
      fileList: [],
      isAdditional: true
    }]);
  };

const handleSubmit = async () => {

  // ================= VALIDATIONS =================

  if (
    !selectedPE ||
    !selectedState ||
    !selectedBranch ||
    !selectedPeriod
  ) {
    message.error("Complete all selections.");
    return;
  }

  const hasFile = tableData.some(
    (r) => r.fileList.length > 0
  );

  if (!hasFile) {
    message.error("Upload at least one document.");
    return;
  }

  if (!generalRemark.trim()) {
    message.error("Please enter general remark.");
    return;
  }

  try {

    setLoading(true);

    // ================= FORM DATA =================

    const formData = new FormData();

    formData.append("pe_id", selectedPE);
    formData.append("branch_id", selectedBranch);
    formData.append("state_id", selectedState);
    formData.append("selected_period", selectedPeriod);
    formData.append("general_remark", generalRemark);

    formData.append(
      "cc_emails",
      JSON.stringify(ccEmails || [])
    );

    // ================= REUPLOAD MODE =================

    if (reuploadMode && complianceId) {

      formData.append(
        "compliance_id",
        String(complianceId)
      );

      formData.append(
        "reupload_mode",
        "true"
      );
    }

    // ================= FILES =================

    let fileIndex = 0;

    tableData.forEach((row) => {

      if (row.fileList.length > 0) {

        const file =
          row.fileList[0].originFileObj as File;

        formData.append(
          `document_${fileIndex}_file`,
          file
        );

        // Existing document mapping
        if (row.document_id) {

          formData.append(
            `document_${fileIndex}_id`,
            row.document_id.toString()
          );
        }

        // Document name
        formData.append(
          `document_${fileIndex}_name`,
          row.document_name
        );

        // Additional document flag
        formData.append(
          `document_${fileIndex}_is_additional`,
          String(row.isAdditional || false)
        );

        fileIndex++;
      }
    });

    // ================= API ENDPOINT =================

    const endpoint = reuploadMode
      ? "http://127.0.0.1:8000/api/vendor/reupload-compliance/"
      : "http://127.0.0.1:8000/api/vendor/submit-compliance/";

    // ================= API CALL =================

    const response = await axios.post(
      endpoint,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    console.log(
      "✅ Compliance submit response:",
      response.data
    );

    // ================= SUCCESS MESSAGE =================

    if (reuploadMode) {

      message.success(
        "Documents reuploaded successfully"
      );

    } else {

      message.success(
        "Compliance submitted successfully"
      );
    }

    // ================= RESET FORM =================

    setTableData([]);

    setGeneralRemark("");

    setCcEmails([]);

    // Optional cleanup
    setReuploadMode(false);

    setFailedEntries([]);

    setComplianceId(null);

  } catch (err: any) {

    console.error(
      "❌ Compliance submission failed:",
      err
    );

    const backendError =
      err?.response?.data?.error ||
      err?.response?.data?.message;

    message.error(
      backendError || "Submission failed"
    );

  } finally {

    setLoading(false);
  }
};

  const uploadedCount = tableData.filter(r => r.fileList.length > 0).length;
  const totalDocs = tableData.length;

  return (
    <div className="space-y-6 w-full px-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Submit Compliance Record</h1>
        <p className="text-sm text-gray-500">Upload compliance documents for the selected branch and period.</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="grid md:grid-cols-4 gap-6">
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-gray-500 mb-1">Principal Employer</label>
            <select value={selectedPE} onChange={(e) => setSelectedPE(e.target.value)} className="border rounded-xl px-3 py-2 text-sm">
              <option value="">Select PE</option>
              {peList.map(pe => <option key={pe.id} value={pe.id}>{pe.short_name}</option>)}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-gray-500 mb-1">State</label>
            <select 
              value={selectedState} 
              onChange={(e) => {
                const stateName = e.target.value;
                setSelectedState(stateName);
                setSelectedBranch("");
                setSelectedPeriod("");
                setTableData([]);
                setDocuments([]);
              }} 
              disabled={!selectedPE} 
              className="border rounded-xl px-3 py-2 text-sm"
            >
              <option value="">Select State</option>
              {states.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-gray-500 mb-1">Branch</label>
            <select
              value={selectedBranch}
              onChange={(e) => {
                const branchId = e.target.value;
                setSelectedBranch(branchId);
                setSelectedPeriod("");
                setTableData([]);
                setDocuments([]);

                if (selectedPE && branchId) {
                  loadMappingMeta(selectedPE, branchId);
                  loadFrozenPeriods(branchId);
                }
              }}
              disabled={!selectedState}
              className="border rounded-xl px-3 py-2 text-sm"
            >
              <option value="">Select Branch</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-gray-500 mb-1">Compliance Audit Period</label>
            <Select
              value={selectedPeriod || undefined}
              onChange={(value) => setSelectedPeriod(value)}
              disabled={!selectedBranch}
              placeholder={`Select Period (${frequencyBase || "-"})`}
            >
              {getPeriodOptions().map(p => <Option key={p} value={p}>{p}</Option>)}
            </Select>
          </div>
        </div>

        {mappingStartDate && mappingEndDate && (
          <div className="mt-4 text-sm bg-gray-50 p-3 rounded-lg">
            Start: {formatDate(mappingStartDate)} | End: {formatDate(mappingEndDate)}
          </div>
        )}
      </div>

      {selectedPeriod && (
        <div ref={docRef} className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-800">Compliance Documents</h2>
              <span className="text-sm bg-blue-100 text-blue-600 px-3 py-1 rounded-full">{selectedPeriod}</span>
            </div>
            <Button type="primary" ghost onClick={addAdditionalDocument}>
              + Add Additional Document
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {documentsLoading && (
              <div className="col-span-full flex flex-col items-center justify-center py-12">

                <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600"></div>

                <p className="mt-4 text-sm text-gray-500">
                  Loading compliance documents...
                </p>
              </div>
            )}

            {!documentsLoading && tableData.length === 0 && (
              <div className="col-span-full text-center py-10 text-gray-400">
                No documents available for selected period
              </div>
            )}

            {tableData.map((record) => (
              <div key={record.key} className={`
  border
  rounded-2xl
  p-4
  shadow-sm
  transition
  h-32
  flex
  flex-col
  justify-between

  ${
    record.canReupload
      ? "bg-white hover:shadow-md"
      : "bg-gray-50 opacity-80"
  }
`} >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-800 truncate">{record.document_name}</span>
                  <span
                    className={`
                      text-[10px]
                      font-medium
                      px-2.5
                      py-1
                      rounded-full
                      whitespace-nowrap
                      shadow-sm

                      ${
                        record.canReupload
                          ? "bg-red-50 text-red-600 border border-red-200"
                          : "bg-green-50 text-green-600 border border-green-200"
                      }
                    `}
                  >
                    {record.canReupload
                      ? "Reupload Required"
                      : "Complied"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <Upload
                    disabled={!record.canReupload}
                    beforeUpload={() => false}
                    fileList={record.fileList}
                    maxCount={1}
                    showUploadList={false}
                    onChange={({ fileList }) =>
                      updateRow(record.key, { fileList })
                    }
                  >
                  <Button
                    size="small"
                    disabled={!record.canReupload}
                    className={`
                      rounded-lg border-none

                      ${
                        record.canReupload
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      }
                    `}
                  >
                    Upload
                  </Button>
                  </Upload>

                  {record.isAdditional && (
                    <Button danger size="small" onClick={() => removeRow(record.key)}>
                      Remove
                    </Button>
                  )}
                </div>

                <div className="text-xs truncate">
                  {record.fileList.length > 0 ? (
                    <span className="text-green-600 font-medium">✔ Uploaded: {record.fileList[0].name}</span>
                  ) : (
                    <span className="text-gray-400 italic">No file uploaded</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <label className="block text-sm font-semibold mb-2">General Remarks</label>
            <TextArea
              rows={4}
              className="rounded-xl"
              value={generalRemark}
              onChange={(e) => setGeneralRemark(e.target.value)}
            />
          </div>
        </div>
      )}

      {selectedPeriod && (
        <div className="flex justify-end">
          <Button
            type="primary"
            size="medium"
            loading={loading}
            disabled={!selectedPE || !selectedState || !selectedBranch || !selectedPeriod || tableData.every(r => r.fileList.length === 0) || !generalRemark.trim()}
            onClick={handleSubmit}
          >
            Submit Compliance Record
          </Button>
        </div>
      )}
    </div>
  );
}