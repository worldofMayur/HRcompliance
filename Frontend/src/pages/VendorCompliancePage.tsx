import { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  Upload,
  Input,
  Button,
  message,
  Select,
  Modal,
} from "antd";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import type { UploadFile } from "antd/es/upload/interface";
import { useLocation } from "react-router-dom";
const API_BASE = import.meta.env.VITE_API_URL;

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
  workflow_status?: string;
  reupload_remark?: string;
  is_reuploaded?: boolean;

  // NEW
  already_uploaded?: boolean;
  uploaded_file_name?: string;

  submission_id?: number;
}

interface DocumentRow {
  key: string;
  document_id: number | null;
  document_name: string;
  audit_period?: string;
  fileList: UploadFile[];
  isAdditional?: boolean;
  canReupload?: boolean;
  workflow_status?: string;
  reupload_remark?: string;
  is_reuploaded?: boolean;
  isFrozen?: boolean;
  submission_id?: number;
  isUploaded?: boolean;
  uploadedFileName?: string;
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
  const [effectiveReuploadMode, setEffectiveReuploadMode] =
  useState(false);
  const [complianceId, setComplianceId] = useState<number | null>(null);

  const [mappingStartDate, setMappingStartDate] = useState<any>(null);
  const [mappingEndDate, setMappingEndDate] = useState<any>(null);
  const [frequencyBase, setFrequencyBase] = useState("");

  const [summaryOpen, setSummaryOpen] = useState(false);
  const [payrollData, setPayrollData] = useState<any[]>([]);

  const [complianceSummary, setComplianceSummary] = useState({
    male_employees: undefined as number | undefined,
    female_employees: undefined as number | undefined,
    gross_wages: undefined as number | undefined,
    net_wages: undefined as number | undefined,
    pf_remittance_date: "",
    esic_remittance_date: "",
    rc_remittance_date: "",
    lwf_remittance_date: "",
  });

  
  const docRef = useRef<any>(null);

  /* ================= FORMAT DATE ================= */

  const parseDate = (value: string) => {
  const regex = /^\d{2}\/\d{2}\/\d{4}$/;
  if (!regex.test(value)) return null;

  const [day, month, year] = value.split("/").map(Number);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
};

const formatDate = (date: Date | null) => {
  if (!date) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const dateInputClass =
  "w-full h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none";

const formatForAPI = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const parseApiDate = (value: string) => {
  if (!value) return null;

  const [year, month, day] = value.split("-");

  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day)
  );
};

const parseDateForPicker = (dateStr: string) => {
  if (!dateStr) return null;
  const parsed = parseDate(dateStr);
  return parsed;
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
      loadFrozenPeriods(selectedBranch);
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

      setSelectedPeriod((prev) => {

        // Keep notification period
        if (prev) return prev;

        // Show "Select Period" instead of auto-selecting latest
        return "";
      });

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
      const res = await axios.get(
        `${API_BASE}/api/vendor/mapped-pe/`,
        authHeader
      );
      setPeList(res.data);
    } catch (err) { console.error(err); }
  };

  const loadStates = async (peId: string) => {
    try {
      const res = await axios.get(`${API_BASE}/api/vendor/mapped-states/?pe_id=${peId}`, authHeader);
      setStates(res.data);
    } catch (err) { console.error(err); }
  };

  const loadBranches = async (peId: string, state: string) => {
    try {
      const res = await axios.get(`${API_BASE}/api/vendor/mapped-branches/?pe_id=${peId}&state=${state}`, authHeader);
      setBranches(res.data);
    } catch (err) { console.error(err); }
  };

  const loadMappingMeta = async (peId: string, branchId: string) => {
    try {
      const res = await axios.get(
        `${API_BASE}/api/vendor/mapping-meta/?pe_id=${peId}&branch_id=${branchId}`,
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
      `${API_BASE}/api/vendor/frozen-periods/?branch_id=${branchId}`,
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
      `${API_BASE}/api/vendor/mapped-documents/?pe_id=${peId}&branch_id=${branchId}&period=${encodeURIComponent(
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
    console.log(
      "🔴 Reupload Mode:",
      reuploadMode
    );

    console.log(
      "🔴 Failed Entries:",
      failedEntries
    );

    console.log(
      "🔴 API Docs:",
      data
    );

    const failedDocIds = failedEntries.map(
      (e: any) => e.document_id
    );

    const hasReuploadDocs =
      reuploadMode ||
      failedEntries.length > 0 ||
      data.some(
        (doc: any) =>
          doc.workflow_status ===
          "REUPLOAD_REQUESTED"
      );

    setEffectiveReuploadMode(
      hasReuploadDocs
    );

console.log(
  "📄 Failed Document IDs:",
  failedDocIds
);

const filteredDocs =
  failedEntries.length > 0
    ? data.filter((doc: any) =>
        failedEntries.some(
          (f: any) =>
            Number(f.document_id) === Number(doc.id)
        )
      )
    : (
        hasReuploadDocs
          ? data.filter(
              (doc: any) =>
                doc.workflow_status ===
                "REUPLOAD_REQUESTED"
            )
          : data
      );

const rows: DocumentRow[] = filteredDocs.map(
  (doc: DocumentType) => ({

    key: `doc-${doc.id}`,

    document_id: doc.id,

    submission_id: (doc as any).submission_id,

    document_name: doc.name,

    audit_period: doc.audit_period,

    workflow_status:
      doc.workflow_status || "",

    // ✅ Show remarks ONLY in reupload flow
    reupload_remark:
      hasReuploadDocs &&
      doc.workflow_status === "REUPLOAD_REQUESTED"
        ? doc.reupload_remark || ""
        : "",

    is_reuploaded:
      doc.is_reuploaded || false,

    fileList: [],
    isUploaded: doc.already_uploaded || false,

    uploadedFileName:
        doc.uploaded_file_name || "",

    // ✅ ONLY failed documents reuploadable
    canReupload:
      reuploadMode
        ? failedEntries.some(
            (e: any) =>
              Number(e.document_id) === Number(doc.id)
          )
        : (
            doc.workflow_status ===
            "REUPLOAD_REQUESTED"
          ),
  })
);

console.log(
  "✅ Final Document Rows:",
  rows
);

setTableData(rows);

} catch (error) {

  console.error(
    "Failed to load documents:",
    error
  );

  message.error(
    "Failed to load documents"
  );

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
      : `${startMonth}-${endMonth} ${year}`;
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

      // IMPORTANT
      document_id:
        prev.find(
          x => !x.isAdditional
        )?.document_id || null,

      document_name: "Additional Document",

      audit_period: selectedPeriod,

      fileList: [],

      isAdditional: true,

      canReupload: true
  }]);
  };

  const getPayrollMonths = () => {
  if (!selectedPeriod) return [];

  const months: string[] = [];

  const [monthPart, year] = selectedPeriod.split(" ");

  if (monthPart.includes("-")) {
    const [start, end] = monthPart.split("-");

    const monthNames = [
      "Jan","Feb","Mar","Apr","May","Jun",
      "Jul","Aug","Sep","Oct","Nov","Dec"
    ];

    let startIndex = monthNames.indexOf(start);
    let endIndex = monthNames.indexOf(end);

    for (let i = startIndex; i <= endIndex; i++) {
      months.push(`${monthNames[i]} ${year}`);
    }
  } else {
    months.push(selectedPeriod);
  }

  return months;
};

const handleSubmit = () => {
// Reupload -> submit directly
if (effectiveReuploadMode) {
  submitCompliance();
  return;
}

// Build payroll rows
const rows = getPayrollMonths().map((month) => ({
  month,

  male_employees: undefined,
  female_employees: undefined,

  gross_wages: undefined,
  net_wages: undefined,

  pf_remittance_date: "",
  esic_remittance_date: "",
  rc_remittance_date: "",
  lwf_remittance_date: "",
}));

setPayrollData(rows);

setSummaryOpen(true);
};

const submitCompliance = async () => {

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

  if (!generalRemark.trim()) {
    message.error("Please enter general remark.");
    return;
  }

  // ================= REQUIRED DOCUMENT VALIDATION =================

  const missingDocs = tableData.filter(
    (row) =>
      !row.isAdditional &&
      row.fileList.length === 0
  );

  if (missingDocs.length > 0) {

  message.error(
    `Please upload all mandatory documents before submitting. Missing: ${missingDocs.length}`
  );

    return;
  }

  try {

    setLoading(true);

    // ================= FORM DATA =================

    const formData = new FormData();

    formData.append("pe_id", selectedPE);
    formData.append("branch_id", selectedBranch);
    formData.append("state", selectedState);
    formData.append("selected_period", selectedPeriod);
    formData.append("general_remark", generalRemark);

    if (!effectiveReuploadMode) {
      formData.append(
        "male_employees",
        String(complianceSummary.male_employees ?? "")
      );

      formData.append(
        "female_employees",
        String(complianceSummary.female_employees ?? "")
      );

      formData.append(
        "gross_wages",
        String(complianceSummary.gross_wages ?? "")
      );

      formData.append(
        "net_wages",
        String(complianceSummary.net_wages ?? "")
      );

      formData.append(
        "pf_remittance_date",
        complianceSummary.pf_remittance_date
      );

      formData.append(
        "esic_remittance_date",
        complianceSummary.esic_remittance_date
      );

      formData.append(
        "rc_remittance_date",
        complianceSummary.rc_remittance_date
      );

      formData.append(
        "lwf_remittance_date",
        complianceSummary.lwf_remittance_date
      );
    }
    formData.append(
      "cc_emails",
      JSON.stringify(ccEmails || [])
    );

    // ================= REUPLOAD MODE =================
    console.log("effectiveReuploadMode:", effectiveReuploadMode);
    console.log("complianceId:", complianceId);
    
    if (effectiveReuploadMode && complianceId) {

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

// ================= FILES =================

let fileIndex = 0;

tableData.forEach((row) => {

  if (
    row.fileList &&
    row.fileList.length > 0
  ) {

    row.fileList.forEach((fileObj: any) => {

      const file =
        fileObj.originFileObj as File;

      // =========================
      // FILE
      // =========================

      formData.append(
        `document_${fileIndex}_file`,
        file
      );

      // =========================
      // MAIN DOCUMENT
      // =========================

      if (!row.isAdditional) {

        if (row.document_id) {

          formData.append(
            `document_${fileIndex}_id`,
            row.document_id.toString()
          );
        }

        // ✅ REUPLOAD SUPPORT
        if (row.submission_id) {

          formData.append(
            `document_${fileIndex}_submission_id`,
            row.submission_id.toString()
          );
        }
      }

      // =========================
      // SUPPORTING FILE
      // =========================

      else {

        formData.append(
          `document_${fileIndex}_parent_id`,
          row.document_id?.toString() || ""
        );
      }

      // =========================
      // DOCUMENT NAME
      // =========================

      formData.append(
        `document_${fileIndex}_name`,
        row.document_name || ""
      );

      // =========================
      // ADDITIONAL FLAG
      // =========================

      formData.append(
        `document_${fileIndex}_is_additional`,
        String(row.isAdditional || false)
      );

      fileIndex++;

    });

  }

});

// =========================
// TOTAL COUNT
// =========================

formData.append(
  "document_count",
  String(fileIndex)
);

    // ================= API ENDPOINT =================

    const endpoint = effectiveReuploadMode
      ? `${API_BASE}/api/vendor/reupload-compliance/`
      : `${API_BASE}/api/vendor/submit-compliance/`;

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

if (effectiveReuploadMode) {

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

    setEffectiveReuploadMode(false);

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
        <h1 className="text-2xl font-semibold text-gray-800">
          Upload Compliance Documents
        </h1>
        <p className="text-sm text-gray-500">Upload compliance documents for the selected branch and period.</p>
      </div>

      <div className="
        rounded-2xl
        border border-gray-200
        bg-white
        p-6
        shadow-sm
      ">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-gray-500 mb-1">Principal Employer</label>
            <select value={selectedPE} onChange={(e) => setSelectedPE(e.target.value)} className="border rounded-xl px-3 py-2 text-sm">
              <option value="">Select PE</option>
              {[...peList]
                .sort((a, b) =>
                  (a.short_name || "").localeCompare(b.short_name || "")
                )
              .map(pe => <option key={pe.id} value={pe.id}>{pe.short_name}</option>)}
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
             {[...states]
                .sort((a, b) =>
                  (a.name || "").localeCompare(b.name || "")
                )
              .map(s =><option key={s.id} value={s.name}>{s.name}</option>)}
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
             {[...branches]
                .sort((a, b) =>
                  (a.name || "").localeCompare(b.name || "")
                )
              .map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
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
      <div className="space-y-5 mb-5">

  {/* TOP BAR */}
  <div className="
    flex flex-col gap-4
    lg:flex-row
    lg:items-center
    lg:justify-between
  ">

    {/* LEFT */}
    <div className="space-y-3">

      {/* TITLE */}
      <div className="flex items-center gap-2">
        <h2 className="text-base font-semibold text-gray-900">
          Compliance Documents
        </h2>

        {
          frozenPeriods.includes(selectedPeriod) && (

            <span
              className="
                rounded-full
                bg-green-100
                px-2 py-1
                text-[10px]
                font-semibold
                text-green-700
              "
            >
              FINALIZED
            </span>
          )
        }

        <span className="
          rounded-full
          bg-blue-50
          px-2.5 py-1
          text-xs
          font-medium
          text-blue-700
        ">
          {selectedPeriod}
        </span>
      </div>

      {/* STATS */}
      <div className="flex items-center gap-2 flex-wrap">

        <div className="
          rounded-full
          border border-gray-200
          bg-gray-50
          px-3 py-1
        ">
          <span className="text-xs font-medium text-gray-700">
            Total: {totalDocs}
          </span>
        </div>

        <div className="
          rounded-full
          border border-emerald-100
          bg-emerald-50
          px-3 py-1
        ">
          <span className="text-xs font-medium text-emerald-700">
            Uploaded: {uploadedCount}
          </span>
        </div>

        <div className="
          rounded-full
          border border-amber-100
          bg-amber-50
          px-3 py-1
        ">
          <span className="text-xs font-medium text-amber-700">
            Remaining: {
              tableData.filter(
                r =>
                  !r.isAdditional &&
                  r.fileList.length === 0
              ).length
            }
          </span>
        </div>

      </div>
    </div>

    {/* RIGHT */}
    <Button
      type="primary"
      ghost
      disabled={frozenPeriods.includes(selectedPeriod)}
      onClick={addAdditionalDocument}
      className="
        h-9
        rounded-xl
        px-4
        text-sm
        font-medium
      "
    >
      + Add Document
    </Button>

  </div>
</div>

          <div className="
            grid
            grid-cols-1
            md:grid-cols-2
            xl:grid-cols-3
            gap-4
          ">
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
                <div className="py-14 text-center">
                  <p className="text-sm font-medium text-gray-500">
                    No compliance documents available
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Try selecting another audit period
                  </p>
                </div>
              </div>
            )}

            {tableData.map((record) => (
              <div key={record.key} className={`
                  border
                  rounded-2xl
                  p-3.5
                  shadow-sm
                  transition
                  min-h-[132px]
                  flex
                  flex-col
                  gap-3

                  ${
                    effectiveReuploadMode
                      ? (
                          record.canReupload
                            ? "bg-white hover:shadow-md"
                            : "bg-gray-50 opacity-70 border-gray-200"
                        )
                      : "bg-white hover:shadow-md"
                  }
                `} >
                <div className="flex items-start justify-between gap-3">
                  <span className="font-semibold text-gray-800 truncate">{record.document_name}</span>
                  <span
                    className={`
                      text-[10px]
                      font-medium
                      px-2
                      py-0.5
                      rounded-full
                      whitespace-nowrap
                      border

                      ${
                        effectiveReuploadMode
                          ? (
                              record.canReupload
                                ? "bg-red-50 text-red-600 border border-red-200"
                                : "bg-green-50 text-green-600 border border-green-200"
                            )
                          : "bg-blue-50 text-blue-600 border border-blue-200"
                      }
                    `}
                  >
                  {record.fileList.length > 0 ? (
                      "Uploaded"
                  ) : record.isUploaded ? (
                      "Already Submitted"
                  ) : effectiveReuploadMode ? (

                    record.canReupload ? (
                      "Reupload Required"
                    ) : (
                      "Already Complied"
                    )

                  ) : (
                    "Pending Upload"
                  )}
                  </span>
                </div>

                <div className="
                  flex items-center
                  justify-between
                  gap-3
                ">
                <Upload
                    disabled={
                        (record.isUploaded && !record.canReupload) ||

                        frozenPeriods.includes(selectedPeriod) ||

                        (
                            effectiveReuploadMode &&
                            !record.isAdditional &&
                            !record.canReupload
                        )
                    }
                    beforeUpload={(file) => {
                      const alreadyExists =
                        tableData.some(
                          (row) =>
                            row.fileList[0]?.name === file.name
                        );

                      if (alreadyExists) {

                        message.warning(
                          "Same file already selected."
                        );

                        return Upload.LIST_IGNORE;
                      }

                      return false;
                    }}
                    fileList={record.fileList}
                    maxCount={1}
                    showUploadList={false}
                    onChange={({ fileList }) =>
                      updateRow(record.key, { fileList })
                    }
                  >
                  <Button
                    size="small"
                    disabled={
                        (record.isUploaded && !record.canReupload) ||

                        frozenPeriods.includes(selectedPeriod) ||

                        (
                            effectiveReuploadMode &&
                            !record.isAdditional &&
                            !record.canReupload
                        )
                    }
                    className={`
                      rounded-lg border-none

                      ${
                        effectiveReuploadMode
                          ? (
                              record.canReupload
                                ? "bg-blue-500 text-white hover:bg-blue-600"
                                : "bg-gray-200 text-gray-400 cursor-not-allowed"
                            )
                          : "bg-blue-500 text-white hover:bg-blue-600"
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

                {effectiveReuploadMode &&
                  record.canReupload &&
                  record.reupload_remark && (

                    <div className="
                      mt-2
                      text-[11px]
                      text-red-600
                      bg-red-50
                      border border-red-200
                      rounded-lg
                      px-2 py-1
                      leading-relaxed
                    ">
                      <span className="font-semibold">
                        Auditor Remark:
                      </span>{" "}
                      {record.reupload_remark}
                    </div>
                  )}

                  {record.fileList.length > 0 ? (
                  <div
                    className="
                      mt-2
                      flex items-center
                      justify-between
                      rounded-lg
                      border border-emerald-100
                      bg-emerald-50/40
                      px-2.5 py-2
                    "
                  >
                    <p
                      className="
                        text-[11px]
                        font-medium
                        text-emerald-700
                        truncate
                        flex-1
                      "
                    >
                      {record.fileList[0].name}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        updateRow(record.key, {
                          fileList: [],
                        })
                      }
                      className="
                        ml-2
                        text-red-500
                        font-bold
                        hover:text-red-700
                      "
                    >
                      ✕
                    </button>
                  </div>
                    ) : record.isUploaded ? (

                      <div className="mt-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2">
                        <p className="text-[11px] font-medium text-green-700">
                          ✓ Already Submitted
                        </p>

                        {record.uploadedFileName && (
                          <p className="mt-1 text-[10px] text-green-600 truncate">
                            {record.uploadedFileName}
                          </p>
                        )}
                      </div>

                    ) : (

                      <p className="text-xs text-gray-400">
                        Upload PDF, JPG or PNG
                      </p>

                    )}
                </div>
              </div>
            ))}
          </div>

          <div className="
            mt-7
            border-t border-gray-100
            pt-6
          ">
            <label className="block text-sm font-semibold text-gray-800 mb-2">Vendor Remarks</label>
            <TextArea
              rows={3}
              className="rounded-xl"
              value={generalRemark}
              onChange={(e) => setGeneralRemark(e.target.value)}
            />

            <div className="
  mt-5
  flex items-center
  justify-between
">

  {/* LEFT MESSAGE */}
  <div>

    {frozenPeriods.includes(selectedPeriod) ? (

    <div
      className="
        inline-flex
        items-center
        gap-2
        rounded-lg
        border border-green-200
        bg-green-50
        px-3 py-2
      "
    >

      <div className="h-2 w-2 rounded-full bg-green-500"></div>

      <p className="text-xs font-medium text-green-700">

        This compliance audit has been finalized and frozen.

      </p>

    </div>

    ) : (

      <p className="text-xs text-gray-500">
        Ensure all required documents are uploaded before submission.
      </p>

    )}

  </div>

  {/* SUBMIT BUTTON */}
  <Button
    type="primary"
    size="large"
    loading={loading}
    disabled={
      frozenPeriods.includes(selectedPeriod) ||

      !selectedPE ||

      !selectedState ||

      !selectedBranch ||

      !selectedPeriod ||

      !generalRemark.trim()
    }
    onClick={handleSubmit}
    className="
      h-9
      rounded-lg
      px-4
      text-sm
      font-medium
      shadow-sm
    "
  >
  {
    effectiveReuploadMode
      ? "Reupload Compliance Documents"
      : "Proceed"
  }
  </Button>

</div>
          </div>
        </div>
      )}

      {/* ================= COMPLIANCE SUMMARY MODAL ================= */}


{/* ================= COMPLIANCE SUMMARY MODAL ================= */}
<Modal
  title="Employee Payroll Details"
  open={summaryOpen}
  width={1280}
  centered
  onCancel={() => setSummaryOpen(false)}
  cancelButtonProps={{ style: { display: "none" } }}
  onOk={() => {
    if (
      payrollData.some(row =>
        !row.male_employees || !row.female_employees ||
        !row.gross_wages || !row.net_wages
      )
    ) {
      message.error("Please fill all mandatory fields for every month.");
      return;
    }
    setSummaryOpen(false);
    submitCompliance();
  }}
  okText="Submit Compliance Documents"
  okButtonProps={{ size: "large" }}
>
  <div className="max-h-[68vh] overflow-hidden">
    <div className="flex gap-5 overflow-x-auto pb-6 snap-x snap-mandatory px-2">
      {payrollData.map((row, index) => (
        <div
          key={row.month}
          className="min-w-[500px] flex-shrink-0 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow transition-all snap-start"
        >
          <h3 className="text-2xl font-semibold text-gray-900 mb-6 border-b pb-3">
            {row.month}
          </h3>

          <div className="grid grid-cols-2 gap-x-6 gap-y-5">
            {/* Male Employees */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Male Employees</label>
              <Input
                type="number"
                min={0}
                value={row.male_employees ?? ""}
                onChange={(e) => {
                  const temp = [...payrollData];
                  temp[index].male_employees = e.target.value ? Number(e.target.value) : undefined;
                  setPayrollData(temp);
                }}
                className="h-10 text-sm"
              />
            </div>

            {/* Female Employees */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Female Employees</label>
              <Input
                type="number"
                min={0}
                value={row.female_employees ?? ""}
                onChange={(e) => {
                  const temp = [...payrollData];
                  temp[index].female_employees = e.target.value ? Number(e.target.value) : undefined;
                  setPayrollData(temp);
                }}
                className="h-10 text-sm"
              />
            </div>

            {/* Gross Wages */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gross Wages</label>
              <Input
                type="number"
                min={0}
                value={row.gross_wages ?? ""}
                onChange={(e) => {
                  const temp = [...payrollData];
                  temp[index].gross_wages = e.target.value ? Number(e.target.value) : undefined;
                  setPayrollData(temp);
                }}
                className="h-10 text-sm"
              />
            </div>

            {/* Net Wages */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Net Wages</label>
              <Input
                type="number"
                min={0}
                value={row.net_wages ?? ""}
                onChange={(e) => {
                  const temp = [...payrollData];
                  temp[index].net_wages = e.target.value ? Number(e.target.value) : undefined;
                  setPayrollData(temp);
                }}
                className="h-10 text-sm"
              />
            </div>

            {/* PF Remittance Date */}
            <div className="flex flex-col">
              <label className="block text-sm font-medium text-gray-700 mb-1">PF Remittance Date</label>
              <DatePicker
                selected={row.pf_remittance_date ? parseDateForPicker(row.pf_remittance_date) : null}
                value={row.pf_remittance_date || ""}
                onChange={(date: Date | null) => {
                  const temp = [...payrollData];
                  temp[index].pf_remittance_date = date ? formatDate(date) : "";
                  setPayrollData(temp);
                }}
                onChangeRaw={(e) => {
                  const value = e.target.value;
                  const temp = [...payrollData];
                  const parsed = parseDate(value);
                  temp[index].pf_remittance_date = parsed ? formatDate(parsed) : value;
                  setPayrollData(temp);
                }}
                dateFormat="dd/MM/yyyy"
                placeholderText="dd/mm/yyyy"
                className="w-full h-10 border border-gray-300 rounded-lg px-3 text-sm"
              />
            </div>

            {/* ESIC Remittance Date */}
            <div className="flex flex-col">
              <label className="block text-sm font-medium text-gray-700 mb-1">ESIC Remittance Date</label>
              <DatePicker
                selected={row.esic_remittance_date ? parseDateForPicker(row.esic_remittance_date) : null}
                value={row.esic_remittance_date || ""}
                onChange={(date: Date | null) => {
                  const temp = [...payrollData];
                  temp[index].esic_remittance_date = date ? formatDate(date) : "";
                  setPayrollData(temp);
                }}
                onChangeRaw={(e) => {
                  const value = e.target.value;
                  const temp = [...payrollData];
                  const parsed = parseDate(value);
                  temp[index].esic_remittance_date = parsed ? formatDate(parsed) : value;
                  setPayrollData(temp);
                }}
                dateFormat="dd/MM/yyyy"
                placeholderText="dd/mm/yyyy"
                className="w-full h-10 border border-gray-300 rounded-lg px-3 text-sm"
              />
            </div>

            {/* RC Remittance Date */}
            <div className="flex flex-col">
              <label className="block text-sm font-medium text-gray-700 mb-1">RC Remittance Date</label>
              <DatePicker
                selected={row.rc_remittance_date ? parseDateForPicker(row.rc_remittance_date) : null}
                value={row.rc_remittance_date || ""}
                onChange={(date: Date | null) => {
                  const temp = [...payrollData];
                  temp[index].rc_remittance_date = date ? formatDate(date) : "";
                  setPayrollData(temp);
                }}
                onChangeRaw={(e) => {
                  const value = e.target.value;
                  const temp = [...payrollData];
                  const parsed = parseDate(value);
                  temp[index].rc_remittance_date = parsed ? formatDate(parsed) : value;
                  setPayrollData(temp);
                }}
                dateFormat="dd/MM/yyyy"
                placeholderText="dd/mm/yyyy"
                className="w-full h-10 border border-gray-300 rounded-lg px-3 text-sm"
              />
            </div>

            {/* LWF Remittance Date */}
            <div className="flex flex-col">
              <label className="block text-sm font-medium text-gray-700 mb-1">LWF Remittance Date</label>
              <DatePicker
                selected={row.lwf_remittance_date ? parseDateForPicker(row.lwf_remittance_date) : null}
                value={row.lwf_remittance_date || ""}
                onChange={(date: Date | null) => {
                  const temp = [...payrollData];
                  temp[index].lwf_remittance_date = date ? formatDate(date) : "";
                  setPayrollData(temp);
                }}
                onChangeRaw={(e) => {
                  const value = e.target.value;
                  const temp = [...payrollData];
                  const parsed = parseDate(value);
                  temp[index].lwf_remittance_date = parsed ? formatDate(parsed) : value;
                  setPayrollData(temp);
                }}
                dateFormat="dd/MM/yyyy"
                placeholderText="dd/mm/yyyy"
                className="w-full h-10 border border-gray-300 rounded-lg px-3 text-sm"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
</Modal>

    </div>
  );
}