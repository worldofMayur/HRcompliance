import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import {
    Table,
    Input,
    InputNumber,
    Button,
    message,
    Modal,
    Tooltip,
} from "antd";
import { Upload } from "antd";
import {
    DownloadOutlined,
    SyncOutlined,
    UploadOutlined,
    EditOutlined,
    SaveOutlined
} from "@ant-design/icons";
const API_BASE = import.meta.env.VITE_API_URL;
export default function AuditorDashboard() {
  const token = localStorage.getItem("access_token");
  const location = useLocation();
  const { TextArea } = Input;

  const authHeader = {
    headers: { Authorization: `Bearer ${token}` },
  };

  /* ================= DATA ================= */

  const [peList, setPeList] = useState<any[]>([]);
  const [vendorList, setVendorList] = useState<any[]>([]);
  const [stateList, setStateList] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [checklist, setChecklist] = useState<any[]>([]);
  const [hasDocuments, setHasDocuments] =
  useState(true);
  const [notificationDocs, setNotificationDocs] = useState<string[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [exceptionalFiles, setExceptionalFiles] = useState<any>({});

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

  const [showAuditorGuidelines, setShowAuditorGuidelines] =
    useState(true);


  const [auditSessionStatus, setAuditSessionStatus] =
    useState("");

  const [isFrozen, setIsFrozen] =
    useState(false);

  const [manualEditMode, setManualEditMode] =
  useState(false);

  const [complianceSummary, setComplianceSummary] = useState<any>({
    male_employees: null,
    female_employees: null,
    gross_wages: null,
    net_wages: null,
    pf_remittance_date: "",
    esic_remittance_date: "",
    rc_remittance_date: "",
    lwf_remittance_date: "",
  });

  const [isEditingCompliance, setIsEditingCompliance] = useState(false);
  const updateCompliance = (
      field: keyof typeof complianceSummary,
      value: any
  ) => {
      setComplianceSummary(prev => ({
          ...prev,
          [field]: value,
      }));
  };

  const isAuditLocked =
    (
      auditSessionStatus === "FROZEN"
      ||
      isFrozen
    )
    &&
    !manualEditMode;

  /* ================= LOAD ================= */



const fetchAuditSessionStatus = async (
  branchId: string,
  period: string
) => {

  try {

    const response = await axios.get(

      `${import.meta.env.VITE_API_URL}/api/auditor/audit-session-status/`,

      {
        params: {
          branch_id: branchId,
          audit_period: period,
        },

        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const status =
      response.data?.status || "";

    setAuditSessionStatus(status);

    setIsFrozen(
      status === "FROZEN"
    );

  } catch (error) {

    console.error(
      "SESSION STATUS ERROR:",
      error
    );
  }
};

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

await Promise.resolve();

      await loadChecklist(
        d.branch_id?.toString(),
        d.vendor_id?.toString(),
        d.audit_period,
        docs
      );

      await fetchAuditSessionStatus(
        d.branch_id?.toString(),
        d.audit_period
      );


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
      `${import.meta.env.VITE_API_URL}/api/auditor/mapped-pe/`,
      authHeader
    );
    setPeList(res.data);
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
      `${API_BASE}/api/auditor/mapped-vendors/?pe_id=${peId}`,
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

      `${API_BASE}/api/auditor/audit/documents-zip/${selectedBranch}/?audit_period=${auditPeriod}`,

      {

        headers: {

          Authorization:
            `Bearer ${localStorage.getItem("access_token")}`,
        },

        responseType: "blob",
      }
    );

    const url =
      window.URL.createObjectURL(

        new Blob([response.data])
      );

    const link =
      document.createElement("a");

    link.href = url;

    link.setAttribute(
      "download",
      "audit_documents.zip"
    );

    document.body.appendChild(link);

    link.click();

    link.remove();

  } catch (err) {

    console.error(err);

    message.error(
      "Download failed"
    );

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
      : `${startMonth}-${endMonth} ${year}`;
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
      `${API_BASE}/api/auditor/mapping-details/?pe_id=${peId}&vendor_id=${vendorId}&branch_id=${branchId}`,
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
      `${API_BASE}/api/vendor/frozen-periods/?vendor_id=${vendorId}&branch_id=${branchId}`,
      authHeader
    );

    setFrozenPeriods(res.data || []);

  } catch (err) {
    console.error(err);
  }
};

  const loadStates = async (peId: string, vendorId: string) => {
    const res = await axios.get(
      `${API_BASE}/api/auditor/mapped-states/?pe_id=${peId}&vendor_id=${vendorId}`,
      authHeader
    );
    setStateList(res.data);
  };

  const loadBranches = async (peId: string, vendorId: string, state: string) => {
    const res = await axios.get(
      `${API_BASE}/api/auditor/mapped-branches/?pe_id=${peId}&vendor_id=${vendorId}&state=${state}`,
      authHeader
    );
    setBranches(res.data);
  };

const loadChecklist = async (
  branchId?: string,
  vendorId?: string,
  period?: string,
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
    // CHECKLIST API
    // ======================================

    const checklistUrl =
      `${API_BASE}/api/auditor/audit/checklist/${finalBranch}/?audit_period=${finalPeriod}&vendor_id=${finalVendor}`;

    const [checklistRes, remarksRes] =
      await Promise.all([

        axios.get(
          checklistUrl,
          authHeader
        ),

        axios.get(
          `${API_BASE}/api/auditor/compliance-remarks/?branch_id=${finalBranch}&vendor_id=${finalVendor}&audit_period=${encodeURIComponent(finalPeriod)}`,
          authHeader
        )
      ]);

    // ======================================
    // NO DOCUMENTS CASE
    // ======================================

    if (
      checklistRes.data?.has_documents === false
    ) {

      setChecklist([]);

      setRemarksData([]);

      setHasDocuments(false);

      setIsModalOpen(true);

      return;
    }

    // ======================================
    // NORMAL FLOW
    // ======================================

    setShowAuditorGuidelines(
      checklistRes.data?.show_auditor_guidelines ?? true
    );

    setComplianceSummary(
      checklistRes.data?.compliance_summary || {
        male_employees: null,
        female_employees: null,
        gross_wages: null,
        net_wages: null,
        pf_remittance_date: "",
        esic_remittance_date: "",
        rc_remittance_date: "",
        lwf_remittance_date: "",
      }
    );

    console.log(checklistRes.data.compliance_summary);

    const apiData =
      checklistRes.data?.checklist || [];

    let rows = apiData.map(
      (item: any) => ({

        ...item,

        observation:
          item.observation || "",

        recommendation:
          item.recommendation || "",

        status:
          item.status || "",
      })
    );

    console.log(
      "FINAL FILTERED ROWS:",
      rows
    );

    setChecklist(rows);

    setHasDocuments(true);

    setRemarksData(
      remarksRes.data || []
    );

    console.log(
      "REMARKS RESPONSE:",
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

const handleShowAuditor = async () => {

  if (
    !selectedPE ||
    !selectedVendor ||
    !selectedState ||
    !selectedBranch ||
    !auditPeriod
  ) {

    message.warning(
      "Please select all fields"
    );

    return;
  }

  await loadChecklist();

  await fetchAuditSessionStatus(
    selectedBranch,
    auditPeriod
  );
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


const handleSaveComplianceSummary = async () => {
    try {

        await axios.put(
            `${API_BASE}/api/auditor/update-compliance-summary/`,
            {
                branch_id: selectedBranch,
                vendor_id: selectedVendor,
                audit_period: auditPeriod,
                ...complianceSummary,
            },
            authHeader
        );

        message.success(
            "Compliance Summary updated successfully."
        );

        setIsEditingCompliance(false);

    } catch (err) {

        console.error(err);

        message.error(
            "Failed to update Compliance Summary."
        );
    }
};

const handleSubmit = async () => {

  try {

    setLoading(true);

    // =========================
    // ✅ BASIC VALIDATION
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

        "All rows must have Status, Observation & Recommendation"

      );

      setLoading(false);

      return;
    }

    // =========================
    // ✅ EXCEPTIONAL APPROVAL VALIDATION
    // =========================

    const exceptionalRow = groupedChecklist.find(

      (row) =>

        row.status?.includes(
          "Exceptional Approval"
        ) &&

        !exceptionalFiles[row.id]
    );

    if (exceptionalRow) {

      message.error(

        "Supporting document mandatory for Exceptional Approval"

      );

      setLoading(false);

      return;
    }

    // =========================
    // ✅ FORMDATA
    // =========================

    const formData = new FormData();

    formData.append(
      "branch_id",
      selectedBranch
    );

    formData.append(
      "audit_period",
      auditPeriod
    );

    formData.append(
      "freeze_report",
      String(canFreezeReport)
    );

    // =========================
    // ✅ ENTRIES PAYLOAD
    // =========================

    formData.append(

      "entries",

      JSON.stringify(

        groupedChecklist.map((row) => ({

          checklist_id: row.id,

          observation:
            row.observation?.trim(),

          recommendation:
            row.recommendation?.trim(),

          status: row.status,

          document_id:
            row.document_id || null,
        }))
      )
    );



    // =========================
    // ✅ APPEND EXCEPTION FILES
    // =========================

if (exceptionalFiles) {
  Object.keys(exceptionalFiles).forEach((checklistId) => {
    const file = exceptionalFiles[checklistId];

    if (file) {
      formData.append(
        `exceptional_file_${checklistId}`,
        file
      );
    }
  });
}

    console.log(
      "📤 FINAL SUBMIT DATA"
    );

    // =========================
    // ✅ API CALL
    // =========================

    const res = await axios.post(

      `${import.meta.env.VITE_API_URL}/api/auditor/save-audit/`,

      formData,

      {

        headers: {

          Authorization:
            `Bearer ${token}`,

          "Content-Type":
            "multipart/form-data",
        },
      }
    );

    console.log(
      "✅ RESPONSE:",
      res.data
    );

    // =========================
    // ✅ SUCCESS
    // =========================

    message.success(

      res.data.message ||
      "Audit submitted successfully"
    );
    setManualEditMode(false);

    // =========================
    // ✅ REFRESH SESSION STATUS
    // =========================

    await fetchAuditSessionStatus(
      selectedBranch,
      auditPeriod
    );

    // =========================
    // ✅ CLOSE MODAL
    // =========================

    setIsModalOpen(false);

  } catch (err: any) {

    console.error(
      "❌ ERROR:",
      err
    );

    const details =
      err?.response?.data?.details;

    if (details) {

      const msg = details

        .map(
          (d: any) =>
            `Row ${d.row}: ${d.error}`
        )

        .join("\n");

      alert(msg);

    } else {

      message.error(

        err?.response?.data?.error ||

        "Submission failed"
      );
    }

  } finally {

    setLoading(false);
  }
};

  /* ================= TABLE ================= */

  const columns = [
      {
        title: "Audit Requirement",
        width: 250,
        render: (_: any, record: any) => (
          <div className="space-y-1">
            <div className="text-xs text-gray-600">
              Act: {record.act_name}
            </div>

            <div className="text-xs text-gray-600">
              Section: {record.section_rule}
            </div>

            <div className="text-xs text-gray-600">
              Document: {record.document_name}
            </div>
          </div>
        ),
      },

      {
        title: "Form",
        width: 80,
        dataIndex: "form_number",
        render: (text: string) => (
          <div>
            {text || "-"}
          </div>
        ),
      },

      {
        title: "Audit Particulars",
        width: 280,
        dataIndex: "audit_particulars",
        render: (text: string) => (
          <div
            className="
              bg-blue-50
              border
              border-blue-100
              rounded-md
              p-2
              font-semibold
              text-blue-700
            "
          >
            {text}
          </div>
        ),
      },
    ...(showAuditorGuidelines
      ? [
          {
            title: "Guidelines For Auditor",
            width: 350,
            dataIndex: "auditor_guide",
            render: (text: any) => (
              <div className="space-y-1">
                {Array.isArray(text)
                  ? text.map((t: any, i: number) => (
                      <div key={i}>• {t}</div>
                    ))
                  : <div>• {text}</div>}
              </div>
            ),
          },
        ]
      : []),

    {
      title: "Compliance Status",
      width: 220,
      render: (_: any, record: any, index: number) => (
        <select
          value={record.status || ""}
          disabled={
            isAuditLocked
            &&
            [
              "Complied",
              "Exceptional Approval - Delayed Complied",
              "Not Applicable For Audit Period"
            ].includes(record.status)
          }
          onChange={(e) =>
          updateField(record.id, "status", e.target.value)
          }
          className="border rounded-lg px-3 py-2 w-full"
        >
          <option value="">Select</option>
          <option value="Complied">Complied</option>
          <option value="Not Complied">Not Complied</option>
          <option value="Exceptional Approval - Not Complied">Exceptional Approval- Not Complied</option>
          <option value="Exceptional Approval - Delayed Complied">Exceptional Approval - Delayed Complied</option>
          <option value="Incorrect Document Submitted">Incorrect Document Submitted</option>
          <option value="Not Applicable For Audit Period">Not Applicable For Audit Period</option>

        </select>
      ),
    },

    {
      title: "Auditor Observation",
      width: 220,
      render: (_: any, record: any) => (
        <TextArea
          autoSize={{
            minRows: 2,
            maxRows: 3,
          }}
          value={record.observation}
          disabled={
            isAuditLocked
            &&
            [
              "Complied",
              "Exceptional Approval - Delayed Complied",
              "Not Applicable For Audit Period"
            ].includes(record.status)
          }
          onChange={(e) =>
            updateField(record.id, "observation", e.target.value)
          }
          className="w-full rounded-lg"
          style={{
            height: 36,
            maxWidth: "100%"
          }}
          placeholder="Enter observation"
        />
      ),
    },

{
  title: "Action Recommendation",
  width: 220,
  render: (_: any, record: any) => (
    <TextArea
      autoSize={{
        minRows: 2,
        maxRows: 3,
      }}
      value={record.recommendation}
      disabled={
        isAuditLocked
        &&
        [
          "Complied",
          "Exceptional Approval - Delayed Complied",
          "Not Applicable For Audit Period"
        ].includes(record.status)
      }
      onChange={(e) =>
        updateField(record.id, "recommendation", e.target.value)
      }
      className="w-full rounded-lg"
      style={{
        height: 36,
        maxWidth: "100%"
      }}
      placeholder="Enter recommendation"
    />
  ),
},
  ];

const groupedChecklist = Object.values(
  checklist.reduce((acc: any, item: any) => {

  const key =
    `${item.form_number}_` +
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

const hasExceptionalApproval =
  groupedChecklist.some(
    (row: any) =>
      row.status ===
      "Exceptional Approval - Delayed Complied"
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

  const selectedExceptionalFile =
  Object.values(exceptionalFiles)[0] as any;

  /* ================= UI ================= */

  return (
<div className="space-y-6 w-full px-8 max-w-[1600px] mx-auto pb-28">
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
      {[...peList]
      .sort((a, b) =>
        a.short_name.localeCompare(
          b.short_name,
          undefined,
          { sensitivity: "base" }
        )
      )
      .map((pe) => (
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
      {[...vendorList]
        .sort((a, b) =>
          a.name.localeCompare(
            b.name,
            undefined,
            { sensitivity: "base" }
          )
        )
        .map((v) => (
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
      {[...stateList]
        .sort((a, b) =>
          a.name.localeCompare(
            b.name,
            undefined,
            { sensitivity: "base" }
          )
        )
        .map((s) => (
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
    {[...branches]
      .sort((a, b) =>
        a.name.localeCompare(
          b.name,
          undefined,
          { sensitivity: "base" }
        )
      )
      .map((b) => (
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
  width="95vw"
  closable={false}
  styles={{
    body: {
      height: "90vh",
      padding: 0,
      overflow: "auto",
    }
  }}
  style={{ top: 20 }}
  title={
    <div className="flex justify-between items-center">
      <div className="flex flex-col">
        <span className="font-semibold">
          {
            notificationDocs.length > 0

              ? "Compliance Reupload Review"

              : "Final Audit Review"
          }
        </span>

        {notificationDocs.length > 0 && (
          <span className="text-xs text-orange-500 mt-1">
            Reviewing {notificationDocs.length} reuploaded document(s)
          </span>
        )}
      </div>

      {
        auditSessionStatus && (

          <div
            style={{
              marginBottom: 12,
            }}
          >

            <span
              style={{

                padding: "6px 12px",

                borderRadius: 6,

                fontSize: 12,

                fontWeight: 600,

                background:
                  auditSessionStatus === "FROZEN"
                    ? "#fee2e2"
                    : auditSessionStatus === "SUBMITTED"
                    ? "#dbeafe"
                    : "#fef3c7",

                color:
                  auditSessionStatus === "FROZEN"
                    ? "#b91c1c"
                    : auditSessionStatus === "SUBMITTED"
                    ? "#1d4ed8"
                    : "#92400e",
              }}
            >

              {
                notificationDocs.length > 0

                  ? "REUPLOAD REVIEW"

                  : auditSessionStatus
              }

            </span>

          </div>
        )
      }

      {
        (
          auditSessionStatus === "FROZEN"
          ||
          isFrozen
        )

        &&

        notificationDocs.length === 0

        &&

        !manualEditMode

        && (

          <Button

            type="primary"

            size="small"

            icon={<SyncOutlined />}

            onClick={() => {

              setManualEditMode(true);

              message.warning(
                "Audit unlocked for editing"
              );
            }}

          >

            Edit Audit

          </Button>
      )
      }

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
<div
        className="flex flex-col"
        style={{
            height: "calc(100vh - 110px)",
        }}
    >
      {/* 🔹 TOP CONTENT (NO CHANGE IN UI) */}
    <div
      className="bg-gradient-to-r from-blue-50 to-white border rounded-xl p-4 flex-shrink-0"
    >

  <div className="flex flex-wrap gap-8 text-sm">

    <div>
      <div className="text-gray-500">PE</div>
      <div className="font-semibold">
        {peList.find(p => p.id == selectedPE)?.short_name}
      </div>
    </div>

    <div>
      <div className="text-gray-500">Vendor</div>
      <div className="font-semibold">
        {vendorList.find(v => v.id == selectedVendor)?.name}
      </div>
    </div>

    <div>
      <div className="text-gray-500">State</div>
      <div className="font-semibold">
        {selectedState}
      </div>
    </div>

    <div>
      <div className="text-gray-500">Branch</div>
      <div className="font-semibold">
        {branches.find(b => b.id == selectedBranch)?.name}
      </div>
    </div>

    <div>
      <div className="text-gray-500">Period</div>
      <div className="font-semibold text-blue-600">
        {auditPeriod}
      </div>
    </div>

  </div>

  <div className="mt-3">

  <span
    className="
      inline-flex
      items-center
      px-3
      py-1
      rounded-full
      bg-green-50
      border
      border-green-200
      text-green-700
      text-sm
      font-medium
    "
  >
    Mapping Active:
    {" "}
    {mappingStartDate
      ? new Date(mappingStartDate).toLocaleDateString("en-IN")
      : "-"}

    {" "}→{" "}

    {mappingEndDate
      ? new Date(mappingEndDate).toLocaleDateString("en-IN")
      : "-"}
  </span>

</div>

{/* ================= 50/50 LAYOUT (Left + Right) ================= */}
<div className="mt-4 grid grid-cols-10 gap-5 items-start">
  {/* LEFT 50% - Vendor Remark History + Buttons */}
  <div className="col-span-7 flex flex-col">

    {remarksData.length > 0 && (
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <div className="font-semibold text-amber-700">Vendor Remark History</div>
          <div className="text-xs text-gray-500">{remarksData.length} Remark(s)</div>
        </div>

        {/* Removed max-h-16, added flex-1 to allow dynamic expansion */}
        <div
          className="
          space-y-2
          border
          border-amber-200
          rounded-lg
          p-2
          bg-amber-50
          max-h-[220px]
          overflow-y-auto
          "
          >
          {remarksData.map((remark, index) => (
            <Tooltip key={index} title={remark.remark}>
              <div className="px-3 py-2 bg-white border border-amber-200 rounded-md text-sm">
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-amber-700">Vendor Remark</span>
                  <span className="text-gray-500">
                    {remark.created_at ? new Date(remark.created_at).toLocaleString("en-IN") : "-"}
                  </span>
                </div>
                <div className="text-gray-800">{remark.remark}</div>
              </div>
            </Tooltip>
          ))}
        </div>
      </div>
    )}

    {/* Action Buttons - Added mt-auto to anchor to the bottom */}
    <div className="flex flex-wrap gap-3 mt-3">
      <Button
        type="primary"
        icon={<DownloadOutlined />}
        onClick={downloadZip}
        loading={downloading}
      >
        Download Audit Documents
      </Button>

      <Upload
        disabled={isAuditLocked && !manualEditMode}
        multiple={false}
        beforeUpload={(file) => {
          const exceptionalRows = groupedChecklist.filter(
            (row: any) => row.status === "Exceptional Approval - Delayed Complied"
          );
          const updatedFiles = { ...exceptionalFiles };
          exceptionalRows.forEach((row: any) => {
            updatedFiles[row.id] = file;
          });
          setExceptionalFiles(updatedFiles);
          message.success(`${file.name} attached`);
          return false;
        }}
        showUploadList={false}
      >
        <Button icon={<UploadOutlined />}>Upload Supporting Document</Button>
      </Upload>

      {selectedExceptionalFile && (
        <span className="text-xs text-green-600 ml-2">
          Selected: {selectedExceptionalFile.name}
        </span>
      )}
    </div>
  </div>

{/* RIGHT 50% - Compliance Summary (Narrow & Scrollable) */}
<div className="col-span-3">
      <div
        className="
        bg-white
        border
        rounded-xl
        shadow-sm
        h-250px
        flex
        flex-col
        "
        >
      
      {/* Header - Shrink-0 keeps it fixed at the top while the rest scrolls */}
      <div className="flex flex-col items-start justify-center border-b px-3 py-2 gap-2 shrink-0 bg-white z-10">
        <div>
          <div className="text-base font-bold text-blue-700 leading-tight">Compliance Summary</div>
          <div className="text-[10px] text-gray-500">Vendor submitted details</div>
        </div>

        {!isEditingCompliance ? (
          <Button size="small" icon={<EditOutlined />} onClick={() => setIsEditingCompliance(true)} className="w-full text-xs">
            Edit
          </Button>
        ) : (
          <div className="flex gap-2 w-full">
            <Button size="small" type="primary" icon={<SaveOutlined />} onClick={handleSaveComplianceSummary} className="flex-1 text-xs px-1">
              Save
            </Button>
            <Button size="small" onClick={() => { setIsEditingCompliance(false); loadChecklist(); }} className="flex-1 text-xs px-1">
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Form Content - flex-1 and overflow-y-auto add the scrollbar */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Changed to grid-cols-1 so inputs aren't crushed in the 190px width */}
        <div className="grid grid-cols-1 gap-3 text-sm">

          {/* Employee Information */}
          <div>
            <h3 className="font-semibold text-blue-700 mb-2 border-b pb-1">Employee Info</h3>
          </div>

          <div>
            <div className="text-gray-500 mb-1 text-xs">Male Employees</div>
            <InputNumber
              className="w-full"
              min={0}
              controls={false}
              value={complianceSummary.male_employees}
              disabled={!isEditingCompliance}
              onChange={(value) => updateCompliance("male_employees", value)}
            />
          </div>

          <div>
            <div className="text-gray-500 mb-1 text-xs">Female Employees</div>
            <InputNumber
              className="w-full"
              min={0}
              controls={false}
              value={complianceSummary.female_employees}
              disabled={!isEditingCompliance}
              onChange={(value) => updateCompliance("female_employees", value)}
            />
          </div>

          {/* Wage Details */}
          <div className="mt-2">
            <h3 className="font-semibold text-blue-700 mb-2 border-b pb-1">Wage Details</h3>
          </div>

          <div>
            <div className="text-gray-500 mb-1 text-xs">Gross Wages</div>
            <InputNumber
              className="w-full"
              min={0}
              controls={false}
              formatter={(v) => v ? `₹ ${Number(v).toLocaleString("en-IN")}` : ""}
              parser={(v) => Number(v?.replace(/[₹,\s]/g, "") || 0)}
              value={complianceSummary.gross_wages}
              disabled={!isEditingCompliance}
              onChange={(value) => updateCompliance("gross_wages", value)}
            />
          </div>

          <div>
            <div className="text-gray-500 mb-1 text-xs">Net Wages</div>
            <InputNumber
              className="w-full"
              min={0}
              controls={false}
              formatter={(v) => v ? `₹ ${Number(v).toLocaleString("en-IN")}` : ""}
              parser={(v) => Number(v?.replace(/[₹,\s]/g, "") || 0)}
              value={complianceSummary.net_wages}
              disabled={!isEditingCompliance}
              onChange={(value) => updateCompliance("net_wages", value)}
            />
          </div>

          {/* Remittance Dates */}
          <div className="mt-2">
            <div className="font-semibold text-blue-700 mb-2 border-b pb-1">Remittance Dates</div>
          </div>

          <div>
            <div className="text-gray-500 mb-1 text-xs">PF Date</div>
            <Input
              type="date"
              className="text-xs"
              value={complianceSummary.pf_remittance_date}
              disabled={!isEditingCompliance}
              onChange={(e) => updateCompliance("pf_remittance_date", e.target.value)}
            />
          </div>

          <div>
            <div className="text-gray-500 mb-1 text-xs">ESIC Date</div>
            <Input
              type="date"
              className="text-xs"
              value={complianceSummary.esic_remittance_date}
              disabled={!isEditingCompliance}
              onChange={(e) => updateCompliance("esic_remittance_date", e.target.value)}
            />
          </div>

          <div>
            <div className="text-gray-500 mb-1 text-xs">RC Date</div>
            <Input
              type="date"
              className="text-xs"
              value={complianceSummary.rc_remittance_date}
              disabled={!isEditingCompliance}
              onChange={(e) => updateCompliance("rc_remittance_date", e.target.value)}
            />
          </div>

          <div>
            <div className="text-gray-500 mb-1 text-xs">LWF Date</div>
            <Input
              type="date"
              className="text-xs"
              value={complianceSummary.lwf_remittance_date}
              disabled={!isEditingCompliance}
              onChange={(e) => updateCompliance("lwf_remittance_date", e.target.value)}
            />
          </div>

        </div>
      </div>
    </div>
  </div>

</div>

</div> {/* bg-gradient-to-r from-blue-50 to-white border rounded-xl p-4 */}
    {/* 🔥 SCROLL AREA */}
  <div className="flex-1 min-h-0 p-4"
        style={{
            minHeight: 0,
        }}
    >

      {isAuditLocked && (

        <div className="mb-4 p-3 rounded-lg border border-green-300 bg-green-50 text-green-700 font-medium">

          This audit report has been frozen,
          finalized, and locked from further modifications.
        </div>
      )}

      {
        !hasDocuments ? (

          <div
            className="
              flex
              items-center
              justify-center
              h-[300px]
              bg-gray-50
              rounded-xl
              border
              border-dashed
              border-gray-300
            "
          >

            <div className="text-center">

              <div className="text-lg font-semibold text-gray-700">

                No documents uploaded for this audit period

              </div>

              <div className="text-sm text-gray-400 mt-2">

                Vendor has not submitted any compliance documents yet.

              </div>

            </div>

          </div>

        ) : (

          

          <>
                <div className="flex gap-3 mb-3">

                  <div className="px-3 py-1 rounded bg-blue-100 text-blue-800 font-medium">
                    Total: {groupedChecklist.length}
                  </div>

                  <div className="px-3 py-1 rounded bg-green-100 text-green-800 font-medium">
                    Complied: {
                      groupedChecklist.filter(
                        (row: any) => row.status === "Complied"
                      ).length
                    }
                  </div>

                  <div className="px-3 py-1 rounded bg-red-100 text-red-800 font-medium">
                    Pending: {
                      groupedChecklist.filter(
                        (row: any) =>
                          !allowedFreezeStatuses.includes(row.status)
                      ).length
                    }
                  </div>

                </div>

                <Table
                  rowClassName={() =>
                    "hover:bg-blue-50 transition-colors"
                  }
                  columns={columns}
                  dataSource={groupedChecklist}
                  rowKey="id"
                  pagination={false}
                  bordered
                  size="small"
                  scroll={{
                      y: "calc(100vh - 450px)",
                      x: "max-content",
                  }}
                />

              </>

            )
      }

      {/* UPLOAD */}
    </div>

    {/* 🔹 BOTTOM BUTTONS */}
    <div className="flex justify-end gap-3 p-4 border-t bg-white">

{
  hasDocuments && (

    <Button
      type="primary"
      className={`
      ${
        canFreezeReport
          ? "!bg-green-600"
          : "!bg-blue-600"
      }
    `}
      loading={loading}
      disabled={
        isAuditLocked &&
        !manualEditMode
      }
      onClick={handleSubmit}
    >
      {
        notificationDocs.length > 0

          ? "Review Reuploaded Documents"

          : canFreezeReport

          ? "Freeze Report & Issue CC"

          : "Save & Submit"
      }
    </Button>

  )
}

    </div>

  </div>

</Modal>

{minimizedPopups.length > 0 && (
  <div className="fixed bottom-0 left-0 w-full bg-gray-50 border-t px-2 py-2 flex gap-2 overflow-x-auto z-50">

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