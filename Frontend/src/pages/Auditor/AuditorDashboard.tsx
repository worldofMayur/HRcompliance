import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { Table, Input, Button, message, Modal } from "antd";
import { Upload } from "antd";
import { DownloadOutlined, SyncOutlined, UploadOutlined } from "@ant-design/icons";
export default function AuditorDashboard() {
  const token = localStorage.getItem("access_token");
  const location = useLocation();

  const authHeader = {
    headers: { Authorization: `Bearer ${token}` },
  };

  /* ================= DATA ================= */

  const [peList, setPeList] = useState<any[]>([]);
  const [vendorList, setVendorList] = useState<any[]>([]);
  const [stateList, setStateList] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [checklist, setChecklist] = useState<any[]>([]);
  const [notificationDocs, setNotificationDocs] = useState<string[]>([]);
  const [downloading, setDownloading] = useState(false);

  const [selectedPE, setSelectedPE] = useState("");
  const [selectedVendor, setSelectedVendor] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [remarksData, setRemarksData] = useState<any[]>([]);
  const [auditPeriod, setAuditPeriod] = useState("");
  const [frequencyBase, setFrequencyBase] = useState("");
const [mappingStartDate, setMappingStartDate] = useState<any>(null);
const [mappingEndDate, setMappingEndDate] = useState<any>(null);
const [compliancePeriods, setCompliancePeriods] = useState<any[]>([]);
const [frozenPeriods, setFrozenPeriods] = useState<string[]>([]);
  const [minimizedPopups, setMinimizedPopups] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  /* ================= LOAD ================= */

  useEffect(() => {
  loadPE();
}, []);

useEffect(() => {

  const notificationData =
    location.state?.notificationData;

  if (!notificationData) return;

  const d = notificationData.data || {};

  console.log(
    "NOTIFICATION DATA:",
    d
  );

  // ======================================
  // SUPPORT BOTH NOTIFICATION TYPES
  // ======================================

  const docs =
    d.reuploaded_documents ||

    d.entries?.map(
      (e: any) => e.document_name
    ) ||

    [];

  console.log(
    "FILTER DOCS:",
    docs
  );

  setNotificationDocs(docs);

  // ======================================
  // DIRECT OPEN FROM NOTIFICATION
  // ======================================

  const openDirectAudit = async () => {

    try {

      if (
        !d.branch_id ||
        !d.audit_period
      ) {

        message.error(
          "Invalid notification data"
        );

        return;
      }

      // ======================================
      // STEP 1 — PE
      // ======================================

      if (d.pe_id) {

        setSelectedPE(
          d.pe_id?.toString()
        );

        await loadVendors(
          d.pe_id?.toString()
        );
      }

      // ======================================
      // STEP 2 — VENDOR
      // ======================================

      if (
        d.pe_id &&
        d.vendor_id
      ) {

        setSelectedVendor(
          d.vendor_id.toString()
        );

        await loadStates(
          d.pe_id.toString(),
          d.vendor_id.toString()
        );
      }

      // ======================================
      // STEP 3 — STATE
      // ======================================

      if (
        d.pe_id &&
        d.vendor_id &&
        d.state
      ) {

        setSelectedState(
          d.state
        );

        await loadBranches(
          d.pe_id?.toString(),
          d.vendor_id?.toString(),
          d.state
        );
      }

      // ======================================
      // STEP 4 — BRANCH
      // ======================================

      if (
          d.pe_id &&
          d.vendor_id &&
          d.branch_id
        ) {

        setSelectedBranch(
          d.branch_id?.toString()
        );

        await loadMappingDetails(
          d.pe_id?.toString(),
          d.vendor_id?.toString(),
          d.branch_id?.toString()
        );

        await loadFrozenPeriods(
          d.vendor_id?.toString(),
          d.branch_id?.toString()
        );
      }

      // ======================================
      // STEP 5 — PERIOD
      // ======================================

      if (d.audit_period) {

        setAuditPeriod(
          d.audit_period
        );
      }

      // ======================================
      // LOAD CHECKLIST
      // ======================================

    setTimeout(async () => {

      await loadChecklist(
        d.branch_id?.toString(),
        d.vendor_id?.toString(),
        d.audit_period,
        docs
      );

    }, 300);

    } catch (err) {

      console.error(err);

      message.error(
        "Failed to open audit"
      );
    }
  };

  openDirectAudit();

}, []);

/* 🔥 ADD THIS RIGHT BELOW */
useEffect(() => {

  if (
    !mappingStartDate ||
    !mappingEndDate ||
    !frequencyBase
  ) {

    setCompliancePeriods([]);

    return;
  }

  const options =
    getPeriodOptions();

  setCompliancePeriods(options);

  // ======================================
  // DON'T OVERRIDE NOTIFICATION PERIOD
  // ======================================

  setAuditPeriod((prev) => {

    if (prev) return prev;

    return options.length > 0
      ? options[options.length - 1]
      : "";
  });

}, [
  mappingStartDate,
  mappingEndDate,
  frequencyBase
]);

  const loadPE = async () => {
    const res = await axios.get(
      "http://127.0.0.1:8000/api/auditor/mapped-pe/",
      authHeader
    );
    setPeList(res.data);
  };

    const uploadProps = {
      name: "file",
      multiple: false,
      accept: ".pdf,.doc,.docx,.zip,.jpg,.png",

      customRequest: async ({ file, onSuccess, onError }: any) => {
        try {
          const formData = new FormData();
          formData.append("file", file);

          // 🔥 Replace with your Django API
          const res = await axios.post(
            "http://127.0.0.1:8000/api/upload/",
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
                Authorization: `Bearer ${token}`,
              },
            }
          );

          onSuccess(res.data);
          message.success(`${file.name} uploaded successfully`);
        } catch (err) {
          console.error(err);
          onError(err);
          message.error(`${file.name} upload failed`);
        }
      },
    };

    const handleMinimize = () => {
      const popupData = {
        id: Date.now(),
        branch: selectedBranch,
        branchName: branches.find(b => b.id == selectedBranch)?.name,
        state: selectedState,
        pe: selectedPE,
        vendor: selectedVendor,
        auditPeriod: auditPeriod,
        checklist: checklist,
      };

      setMinimizedPopups(prev => [...prev, popupData]);
      setIsModalOpen(false);
    };

  const loadVendors = async (peId: string) => {
    const res = await axios.get(
      `http://127.0.0.1:8000/api/auditor/mapped-vendors/?pe_id=${peId}`,
      authHeader
    );
    setVendorList(res.data);
  };

  const handleCloseTab = (id: number) => {
  setMinimizedPopups(prev => prev.filter(p => p.id !== id));
};

const downloadZip = async () => {
  try {
    setDownloading(true);

    const response = await axios.get(
      `http://127.0.0.1:8000/api/auditor/audit/documents-zip/${selectedBranch}/?audit_period=${auditPeriod}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        responseType: "blob",
      }
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "audit_documents.zip");
    document.body.appendChild(link);
    link.click();
    link.remove();

  } catch (err) {
    console.error(err);
    message.error("Download failed");
  } finally {
    setDownloading(false);
  }
};

const getPeriodOptions = () => {
  if (!mappingStartDate || !mappingEndDate || !frequencyBase) {
    return [];
  }

  const startBoundary = new Date(mappingStartDate);
  const endBoundary = new Date(mappingEndDate);
  const today = new Date();
  today.setHours(23, 59, 59, 999); // Treat today as fully available

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
      start.getTime() <= today.getTime()   // Only periods that have started
    );
  };

  const normalizedFrequency = String(frequencyBase).trim().toUpperCase();

  let current = new Date(startBoundary.getTime()); // Fresh copy

  if (normalizedFrequency === "MONTHLY") {
    current.setDate(1);
    while (current <= endBoundary) {
      const start = new Date(current);
      const end = new Date(current.getFullYear(), current.getMonth() + 1, 0);

      if (isValidPeriod(start, end)) {
        periods.push(formatPeriod(start, end));
      }
      current.setMonth(current.getMonth() + 1);
    }
  } 
  else if (normalizedFrequency === "QUARTERLY") {
    // Align to quarter start
    const quarterStartMonth = Math.floor(current.getMonth() / 3) * 3;
    current.setMonth(quarterStartMonth);
    current.setDate(1);

    while (current <= endBoundary) {
      const start = new Date(current);
      const end = new Date(current.getFullYear(), current.getMonth() + 3, 0);

      if (isValidPeriod(start, end)) {
        periods.push(formatPeriod(start, end));
      }
      current.setMonth(current.getMonth() + 3);
    }
  } 
  else if (normalizedFrequency === "HALF_YEARLY" || normalizedFrequency === "HALF YEARLY") {
    const halfStartMonth = current.getMonth() < 6 ? 0 : 6;
    current.setMonth(halfStartMonth);
    current.setDate(1);

    while (current <= endBoundary) {
      const start = new Date(current);
      const end = new Date(current.getFullYear(), current.getMonth() + 6, 0);

      if (isValidPeriod(start, end)) {
        periods.push(formatPeriod(start, end));
      }
      current.setMonth(current.getMonth() + 6);
    }
  } 
  else if (normalizedFrequency === "ANNUALLY") {
    current.setMonth(0);
    current.setDate(1);

    while (current <= endBoundary) {
      const start = new Date(current);
      const end = new Date(current.getFullYear(), 11, 31);

      if (isValidPeriod(start, end)) {
        periods.push(formatPeriod(start, end));
      }
      current.setFullYear(current.getFullYear() + 1);
    }
  }

  return Array.from(
    new Set(periods)
  ).filter(
    (p) => !frozenPeriods.includes(p)
  );
};

const loadMappingDetails = async (peId: string, vendorId: string, branchId: string) => {
  try {
    const res = await axios.get(
      `http://127.0.0.1:8000/api/auditor/mapping-details/?pe_id=${peId}&vendor_id=${vendorId}&branch_id=${branchId}`,
      authHeader
    );

    setFrequencyBase(res.data.frequency || "");

    const start = res.data.start_date ? new Date(res.data.start_date) : null;
    const end = res.data.end_date ? new Date(res.data.end_date) : null;

    if (start && !isNaN(start.getTime())) setMappingStartDate(start);
    if (end && !isNaN(end.getTime())) setMappingEndDate(end);

  } catch (err) {
    console.error(err);
    message.error("Failed to load mapping details");
  }
};

const loadFrozenPeriods = async (
  vendorId: string,
  branchId: string
) => {

  try {

    const res = await axios.get(
      `http://127.0.0.1:8000/api/vendor/frozen-periods/?vendor_id=${vendorId}&branch_id=${branchId}`,
      authHeader
    );

    setFrozenPeriods(res.data || []);

  } catch (err) {
    console.error(err);
  }
};

  const loadStates = async (peId: string, vendorId: string) => {
    const res = await axios.get(
      `http://127.0.0.1:8000/api/auditor/mapped-states/?pe_id=${peId}&vendor_id=${vendorId}`,
      authHeader
    );
    setStateList(res.data);
  };

  const loadBranches = async (peId: string, vendorId: string, state: string) => {
    const res = await axios.get(
      `http://127.0.0.1:8000/api/auditor/mapped-branches/?pe_id=${peId}&vendor_id=${vendorId}&state=${state}`,
      authHeader
    );
    setBranches(res.data);
  };

const loadChecklist = async (
  branchId?: string,
  vendorId?: string,
  period?: string,
  filterDocs: string[] = []
) => {

  try {

    setLoading(true);

    const finalBranch =
      branchId || selectedBranch;

    const finalVendor =
      vendorId || selectedVendor;

    const finalPeriod =
      period || auditPeriod;

  if (
    !finalBranch ||
    !finalPeriod
  ) {

      console.error(
        "Checklist values missing",
        {
          finalBranch,
          finalVendor,
          finalPeriod,
        }
      );

      return;
    }

    // ======================================
    // REUPLOADED DOC QUERY
    // ======================================

    const docsQuery =
      filterDocs
        .map(
          (doc) =>
            `reuploaded_documents=${encodeURIComponent(doc)}`
        )
        .join("&");

    const checklistUrl =
      `http://127.0.0.1:8000/api/auditor/audit/checklist/${finalBranch}/?audit_period=${finalPeriod}${docsQuery ? `&${docsQuery}` : ""}`;

    const [checklistRes, remarksRes] =
      await Promise.all([

        axios.get(
          checklistUrl,
          authHeader
        ),

        axios.get(
          `http://127.0.0.1:8000/api/auditor/compliance-remarks/?branch_id=${finalBranch}`,
          authHeader
        ),
      ]);

    let rows = checklistRes.data.map(
      (item: any) => ({
        ...item,
        observation: "",
        recommendation: "",
      })
    );

    // ======================================
    // ONLY SHOW REUPLOADED DOCS
    // ======================================

    if (
        filterDocs.length > 0
    ) {

      rows = rows.filter(
        (r: any) =>
          filterDocs.includes(
            r.document_name
          )
      );
    }
        // ======================================
    // FINAL SAFETY FILTER
    // ======================================

    if (notificationDocs.length > 0) {

      rows = rows.filter((row: any) => {

        const docName =
          row.document_name
            ?.trim()
            ?.toLowerCase();

        return filterDocs.some(
          (doc: string) =>
            doc?.trim()?.toLowerCase() === docName
        );
      });
    }

    console.log(
      "FINAL FILTERED ROWS:",
      rows
    );

    setChecklist(rows);

    setRemarksData(
      remarksRes.data
    );

    setIsModalOpen(true);

  } catch (err) {

    console.error(err);

    message.error(
      "Failed to load audit checklist"
    );

  } finally {

    setLoading(false);
  }
};

  /* ================= VALIDATION ================= */

  const handleShowAuditor = () => {
    if (
      !selectedPE ||
      !selectedVendor ||
      !selectedState ||
      !selectedBranch ||
      !auditPeriod
    ) {
      message.warning("Please select all fields first");
      return;
    }

    loadChecklist();
  };

  /* ================= UPDATE ================= */

    const updateField = (id: number, field: string, value: string) => {
      const updated = checklist.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      );
      setChecklist(updated);
    };

    const handleRestore = async (popup: any) => {

      try {

        // ======================================
        // RESTORE VALUES
        // ======================================

        setSelectedPE(popup.pe);
        setSelectedVendor(popup.vendor);
        setSelectedState(popup.state);
        setSelectedBranch(popup.branch);
        setAuditPeriod(popup.auditPeriod);

        // ======================================
        // RELOAD DROPDOWNS
        // ======================================

        await loadVendors(popup.pe);

        await loadStates(
          popup.pe,
          popup.vendor
        );

        await loadBranches(
          popup.pe,
          popup.vendor,
          popup.state
        );

        // ======================================
        // RESTORE CHECKLIST
        // ======================================

        setChecklist(popup.checklist);

        setIsModalOpen(true);

        setMinimizedPopups((prev) =>
          prev.filter((p) => p.id !== popup.id)
        );

      } catch (err) {

        console.error(err);

        message.error(
          "Failed to restore audit popup"
        );
      }
    };

  /* ================= SUBMIT ================= */

const handleSubmit = async () => {
  try {
    setLoading(true);

    // =========================
    // ✅ VALIDATION (STRICT)
    // =========================
// =========================
// ✅ VALIDATION (UPDATED)
// =========================
    const invalidRow = groupedChecklist.find(
      (row) =>
        !row.status ||
        !row.observation ||
        !row.recommendation ||
        !row.observation.trim() ||
        !row.recommendation.trim()
    );

    if (invalidRow) {
      message.error(
        "All rows must have status + Observation & Recommendation"
      );
      setLoading(false);
      return;
    }

    // =========================
    // ✅ PAYLOAD (FIXED SOURCE)
    // =========================
    const payload = {
      branch_id: selectedBranch,
      audit_period: auditPeriod,
      freeze_report: canFreezeReport,
      entries: groupedChecklist.map((row) => ({
        checklist_id: row.id,
        observation: row.observation?.trim(),
        recommendation: row.recommendation?.trim(),
        status: row.status,
      })),
    };

    console.log("📤 FINAL PAYLOAD:", payload);

    // =========================
    // ✅ API CALL
    // =========================
    const res = await axios.post(
      "http://127.0.0.1:8000/api/auditor/save-audit/",
      payload,
      authHeader
    );

    console.log("✅ RESPONSE:", res.data);

    message.success(res.data.message || "Audit submitted successfully");

    setIsModalOpen(false);

  } catch (err: any) {
    console.error("❌ ERROR:", err);

    const details = err?.response?.data?.details;

    if (details) {
      const msg = details
        .map((d: any) => `Row ${d.row}: ${d.error}`)
        .join("\n");

      alert(msg);
    } else {
      message.error(
        err?.response?.data?.error || "Submission failed"
      );
    }

  } finally {
    setLoading(false);
  }
};

  /* ================= TABLE ================= */

  const columns = [
    { title: "State", dataIndex: "state" },
    { title: "Act Name", dataIndex: "act_name" },
    { title: "Audit Particulars", dataIndex: "audit_particulars" },
    { title: "Section", dataIndex: "section_rule" },
    { title: "Form Number", dataIndex: "form_number" },
    {
      title: "Document Name",
      dataIndex: "document_name",
    },
    {
      title: "Guidelines For Auditor",
      dataIndex: "auditor_guide",
      render: (text: any) => (
        <div className="space-y-1">
          {Array.isArray(text)
            ? text.map((t, i) => <div key={i}>• {t}</div>)
            : <div>• {text}</div>}
        </div>
      ),
    },

    {
      title: "Compliance Status",
      render: (_: any, record: any, index: number) => (
        <select
          value={record.status || ""}
          onChange={(e) =>
          updateField(record.id, "status", e.target.value)
          }
          className="border rounded px-2 py-1"
        >
          <option value="">Select</option>
          <option value="Complied">Complied</option>
          <option value="Not Complied">Not Complied</option>
          <option value="Exceptional Approval- Not Complied">Exceptional Approval- Not Complied</option>
          <option value="Exceptional Approval - Delayed Complied">Exceptional Approval - Delayed Complied</option>
          <option value="Delayed Complied">Delayed Complied</option>
          <option value="Incorrect Document Submitted">Incorrect Document Submitted</option>
          <option value="Not Applicable For Audit Period">Not Applicable For Audit Period</option>

        </select>
      ),
    },

    {
      title: "Auditor Observation",
      width: 260,
      render: (_: any, record: any) => (
        <Input
          value={record.observation}
          onChange={(e) =>
            updateField(record.id, "observation", e.target.value)
          }
          className="rounded-xl px-3 shadow-sm"
          style={{
            height: 100,
            whiteSpace: "nowrap",
            overflowX: "auto"
          }}
          placeholder="Enter observation"
        />
      ),
    },

{
  title: "Action Recommendation",
  width: 260,
  render: (_: any, record: any) => (
    <Input
      value={record.recommendation}
      onChange={(e) =>
        updateField(record.id, "recommendation", e.target.value)
      }
      className="rounded-xl px-3 shadow-sm"
      style={{
        height: 100,
        whiteSpace: "nowrap",
        overflowX: "auto"
      }}
      placeholder="Enter recommendation"
    />
  ),
},
  ];

const groupedChecklist = Object.values(
  checklist.reduce((acc: any, item: any) => {

    const key =
      `${item.audit_particulars}_` +
      `${item.act_name}_` +
      `${item.section_rule}_` +
      `${item.document_name}`;

    if (!acc[key]) {
      acc[key] = {
        ...item,
        auditor_guide: [],
      };
    }

    if (Array.isArray(item.auditor_guide)) {
      acc[key].auditor_guide.push(...item.auditor_guide);
    } else {
      acc[key].auditor_guide.push(item.auditor_guide);
    }

    return acc;

  }, {})
);

const allowedFreezeStatuses = [
  "Complied",
  "Exceptional Approval - Delayed Complied",
  "Not Applicable For Audit Period"
];

const canFreezeReport =
  groupedChecklist.length > 0 &&
  groupedChecklist.every(
    (row: any) =>
      allowedFreezeStatuses.includes(row.status)
  );

  /* ================= UI ================= */

  return (
<div className="space-y-6 w-full px-8 max-w-[1600px] mx-auto">
        <h1 className="text-2xl font-semibold">Auditor Panel</h1>

      {/* FILTER + BUTTON */}
<div className="bg-white p-6 rounded-xl border flex flex-row gap-4 w-full max-w-[1600px] mx-auto">   
<div className="flex flex-wrap items-start gap-6">

  {/* PE */}
  <div className="flex flex-col min-w-[180px]">
    <select
      value={selectedPE}
      onChange={(e) => {
        setSelectedPE(e.target.value);
        loadVendors(e.target.value);
      }}
      className="h-11 rounded-lg border border-gray-200 px-3 text-sm"
    >
      <option value="">Select PE</option>
      {peList.map((pe) => (
        <option key={pe.id} value={pe.id}>
          {pe.short_name}
        </option>
      ))}
    </select>

    {selectedPE && (
      <span className="text-xs text-green-700 mt-1">
        Selected: {peList.find(p => p.id == selectedPE)?.short_name}
      </span>
    )}
  </div>

  {/* Vendor */}
  <div className="flex flex-col min-w-[180px]">
    <select
      value={selectedVendor}
      onChange={(e) => {
        const vendorId = e.target.value;
        setSelectedVendor(vendorId);

        loadStates(selectedPE, vendorId);
      }}
      className="h-11 rounded-lg border border-gray-200 px-3 text-sm"
    >
      <option value="">Select Vendor</option>
      {vendorList.map((v) => (
        <option key={v.id} value={v.id}>
          {v.name}
        </option>
      ))}
    </select>

    {selectedVendor && (
      <span className="text-xs text-green-700 mt-1">
        Selected: {vendorList.find(v => v.id == selectedVendor)?.name}
      </span>
    )}
  </div>

  {/* State */}
  <div className="flex flex-col min-w-[180px]">
    <select
      value={selectedState}
      onChange={(e) => {
        setSelectedState(e.target.value);
        loadBranches(selectedPE, selectedVendor, e.target.value);
      }}
      className="h-11 rounded-lg border border-gray-200 px-3 text-sm"
    >
      <option value="">Select State</option>
      {stateList.map((s) => (
        <option key={s.id} value={s.name}>
          {s.name}
        </option>
      ))}
    </select>

    {selectedState && (
      <span className="text-xs text-green-700 mt-1">
        Selected: {selectedState}
      </span>
    )}
  </div>

  {/* Branch */}
 {/* Branch */}
<div className="flex flex-col min-w-[180px]">
  <select
    value={selectedBranch}
    onChange={(e) => {
      const branchId = e.target.value;
      
      // Reset dependent states when branch changes
      setSelectedBranch(branchId);
      setAuditPeriod("");           // Reset period
      setCompliancePeriods([]);     // Clear previous periods
      setChecklist([]);             // Clear checklist if any

      if (selectedPE && selectedVendor && branchId) {
        loadMappingDetails(selectedPE, selectedVendor, branchId);
        loadFrozenPeriods(selectedVendor, branchId);
      }
    }}
    className="h-11 rounded-lg border border-gray-200 px-3 text-sm"
  >
    <option value="">Select Branch</option>
    {branches.map((b) => (
      <option key={b.id} value={b.id}>
        {b.name}
      </option>
    ))}
  </select>

  {selectedBranch && (
    <span className="text-xs text-green-700 mt-1">
      Selected: {branches.find(b => b.id == selectedBranch)?.name}
    </span>
  )}
</div>

  {/* Audit Period */}
  <div className="flex flex-col min-w-[180px]">
    <select
      value={auditPeriod}
      onChange={(e) => setAuditPeriod(e.target.value)}
      className="h-11 rounded-lg border border-gray-200 px-3 text-sm"
    >
      <option value="">Select Compliance Period</option>

      {compliancePeriods.map((p) => (
        <option key={p} value={p}>
          {p}
        </option>
      ))}
    </select>

    {auditPeriod && (
      <span className="text-xs text-green-700 mt-1 capitalize">
        Selected: {auditPeriod}
      </span>
    )}
  </div>

</div>

        {/* BUTTON */}
        <div className="flex justify-end">
          <Button
            type="primary"
            onClick={handleShowAuditor}
            className="h-10 px-6"
          >
            Open Auditor Form
          </Button>
        </div>
      </div>

      {/* MODAL */}
{/* MODAL */}
<Modal
  open={isModalOpen}
  footer={null}
  width={1700}
  closable={false}
  styles={{ body: { height: "80vh", overflow: "hidden", padding: 0 } }}
  style={{ top: 20 }}
  title={
    <div className="flex justify-between items-center">
      <div className="flex flex-col">
        <span className="font-semibold">
          Reuploaded Compliance Review
        </span>

        {notificationDocs.length > 0 && (
          <span className="text-xs text-orange-500 mt-1">
            Reviewing {notificationDocs.length} reuploaded document(s)
          </span>
        )}
      </div>

      <Button
        size="small"
        onClick={handleMinimize}
        className="text-lg font-bold px-2"
      >
        −
      </Button>
    </div>
  }
>

  {/* 🔥 WRAPPER (IMPORTANT FOR SCROLL) */}
  <div className="h-full flex flex-col">

    {/* 🔹 TOP CONTENT (NO CHANGE IN UI) */}
    <div className="p-4 space-y-4 border-b bg-white">

      {/* 🔥 VENDOR REMARKS */}
    <div className="grid grid-cols-12 gap-4">

  {/* 🔥 LEFT: REMARKS */}
  <div className="col-span-8 bg-white border rounded-xl p-4 shadow-sm">

  <h3 className="font-semibold text-gray-800 mb-3">
    Vendor Submitted Remarks
  </h3>

  <div className="space-y-3 max-h-52 overflow-y-auto pr-2">

    {remarksData.length === 0 && (
      <div className="text-sm text-gray-400">
        No remarks submitted yet
      </div>
    )}

    {remarksData.map((group, index) => (
      <div key={index} className="border rounded-lg p-3 bg-gray-50">

        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-medium text-blue-600">
            {new Date(group.date).toLocaleDateString("en-GB")}
          </span>

          <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
            Submitted
          </span>
        </div>

        {group.general_remark && (
          <div className="text-sm text-gray-800 mb-2">
            <span className="font-medium text-gray-600">
              General:
            </span>{" "}
            {group.general_remark}
          </div>
        )}

        
      </div>
    ))}

  </div>

  {/* 🔥 MOVE DOWNLOAD HERE */}
  <div className="mt-4 flex justify-between items-center p-4 bg-blue-50 border border-blue-200 rounded-xl">

    <div>
      <div className="text-sm font-medium text-blue-900">
        Audit Documents
      </div>
      <div className="text-xs text-blue-700">
        Download all supporting files for verification
      </div>
    </div>

    <Button
      type="primary"
      icon={<DownloadOutlined />}
      loading={downloading}
      onClick={downloadZip}
      disabled={!selectedBranch}
      className="rounded-lg px-5 shadow-sm"
    >
      {downloading ? "Downloading..." : "Download Audit Document"}
    </Button>

  </div>

</div>
  {/* 🔥 RIGHT: SUMMARY */}
  <div className="col-span-4 bg-blue-50 border border-blue-200 rounded-xl p-4">

    <h3 className="font-semibold text-blue-900 mb-3">
      Audit Summary
    </h3>

    <div className="space-y-2 text-sm">

      <div>
        <span className="text-gray-500">PE:</span>
        <div className="font-medium text-gray-800">
          {peList.find(p => p.id == selectedPE)?.short_name || "-"}
        </div>
      </div>

      <div>
        <span className="text-gray-500">Vendor:</span>
        <div className="font-medium text-gray-800">
          {vendorList.find(v => v.id == selectedVendor)?.name || "-"}
        </div>
      </div>

      <div>
        <span className="text-gray-500">State:</span>
        <div className="font-medium text-gray-800">
          {selectedState || "-"}
        </div>
      </div>

      <div>
        <span className="text-gray-500">Branch:</span>
        <div className="font-medium text-gray-800">
          {branches.find(b => b.id == selectedBranch)?.name || "-"}
        </div>
      </div>

      <div>
        <span className="text-gray-500">Audit Period:</span>
        <div className="font-medium text-blue-700">
          {auditPeriod || "-"}
        </div>
      </div>

    </div>
  </div>

</div>

    </div>

    {/* 🔥 SCROLL AREA */}
    <div className="flex-1 overflow-y-auto p-4">

      <Table
        columns={columns}
        dataSource={groupedChecklist}
        rowKey="id"
        pagination={false}
        bordered
        size="small"
      />

      {/* UPLOAD */}
      <div className="flex justify-start flex-col mt-4 gap-2">
        <span className="font-semibold">
          For Exceptional Approval, Upload Supporting Evidance
        </span>

        <Upload {...uploadProps}>
          <Button icon={<UploadOutlined />}>
            Upload Document
          </Button>
        </Upload>

        <span className="font-semibold">
          File Type - PDF/ JPG/ JPEG/ Email PDF/ Zip Folder
        </span>
      </div>

    </div>

    {/* 🔹 BOTTOM BUTTONS */}
    <div className="flex justify-end gap-3 p-4 border-t bg-white">

    <Button
      type="primary"
      loading={loading}
      onClick={handleSubmit}
    >
      {canFreezeReport
        ? "Freeze Report & Issue CC"
        : "Save & Submit"}
    </Button>

    </div>

  </div>

</Modal>

{minimizedPopups.length > 0 && (
  <div className="fixed bottom-0 left-0 w-full bg-gray-50 border-t px-2 py-1 flex gap-2 overflow-x-auto z-50">

    {minimizedPopups.map((popup) => (
      <div
        key={popup.id}
        onClick={() => handleRestore(popup)}
        className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 border border-blue-300 rounded-md cursor-pointer hover:bg-blue-200 whitespace-nowrap"
      >

        {/* TAB TEXT */}
      <div className="flex flex-col leading-tight">
        <span className="font-medium">
          {popup.auditPeriod}
        </span>

        <span className="text-[10px] text-gray-600">
          {(popup.branchName || popup.branch || "Audit").split(",")[0]}
        </span>
      </div>

        {/* ❌ CLOSE BUTTON */}
        <span
          onClick={(e) => {
            e.stopPropagation();   // VERY IMPORTANT
            handleCloseTab(popup.id);
          }}
          className="ml-1 text-gray-600 hover:text-red-500 font-bold cursor-pointer"
        >
          ×
        </span>

      </div>
    ))}

  </div>
)}
    </div>
  );
}