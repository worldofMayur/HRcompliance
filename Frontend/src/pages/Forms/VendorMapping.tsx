import { useState, useEffect } from "react";
import axios from "axios";

interface Vendor {
  id: number;
  short_name: string;
  name: string;
  email: string;
  mobile: string;
  agreement_address?: string;
  nature_of_compliance?: string;
  contact_person?: string;
  ho_address?: string;
  nature_of_services?: string;
}

interface Auditor {
  id: number;
  name: string;
  email?: string;
}

interface Document {
  id: number;
  name: string;
}

interface StateType {
  id: number;
  name: string;
}

interface BranchType {
  id: number;
  address: string;
  display_address?: string;
  state?: string;
}

export default function VendorMapping() {

  const token = localStorage.getItem("access_token");

  const authHeader = {
    headers: { Authorization: `Bearer ${token}` }
  };

  /* ================= MASTER DATA ================= */

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [auditors, setAuditors] = useState<Auditor[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [states, setStates] = useState<StateType[]>([]);
  const [branches, setBranches] = useState<BranchType[]>([]);

  /* ================= SELECTED ================= */

  const [selectedVendor, setSelectedVendor] = useState("");
  const [selectedVendorObj, setSelectedVendorObj] = useState<Vendor | null>(null);

  const [selectedState, setSelectedState] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedBranchObj, setSelectedBranchObj] = useState<BranchType | null>(null);

  const [selectedAuditor, setSelectedAuditor] = useState("");
  const [selectedAuditorObj, setSelectedAuditorObj] = useState<Auditor | null>(null);

  const [selectedRule, setSelectedRule] = useState("");
  const [selectedFrequency, setSelectedFrequency] = useState("");
  const [selectedAuditPeriod, setSelectedAuditPeriod] = useState("");
  const [selectedDocument, setSelectedDocument] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  /* ================= LOAD ================= */

  useEffect(() => {
    loadVendors();
    loadAuditors();
    loadDocuments();
    loadStates();
  }, []);

  const loadVendors = async () => {
    const res = await axios.get("http://127.0.0.1:8000/api/vendor/list/", authHeader);
    setVendors(res.data);
  };

  const loadAuditors = async () => {
    const res = await axios.get("http://127.0.0.1:8000/api/auditor/list/", authHeader);
    setAuditors(res.data);
  };

  const loadDocuments = async () => {
    const res = await axios.get("http://127.0.0.1:8000/api/documents/list/", authHeader);
    setDocuments(res.data);
  };

  const loadStates = async () => {
    const res = await axios.get("http://127.0.0.1:8000/api/branches/states/", authHeader);
    setStates(res.data);
  };

  const loadBranchesByState = async (stateName: string) => {
    const res = await axios.get(
      `http://127.0.0.1:8000/api/branches/by-state/?state=${stateName}`,
      authHeader
    );
    setBranches(res.data);
  };

  /* ================= DATE FORMAT ================= */

  const formatDateToDDMMYYYY = (date: string) => {
    if (!date) return "";
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  /* ================= FREQUENCY LOGIC ================= */

  const auditPeriodOptions = () => {
    switch (selectedFrequency) {
      case "MONTHLY":
        return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      case "QUARTERLY":
        return ["Q1 (Jan-Mar)", "Q2 (Apr-Jun)", "Q3 (Jul-Sep)", "Q4 (Oct-Dec)"];
      case "HALF_YEARLY":
        return ["H1 (Apr-Sep)", "H2 (Oct-Mar)"];
      case "ANNUALLY":
        return ["Financial Year (Apr-Mar)", "Calendar Year (Jan-Dec)"];
      default:
        return [];
    }
  };

  /* ================= SAVE ================= */

  const handleSave = async () => {
    try {

      const payload = {
        vendor: Number(selectedVendor),
        branch: Number(selectedBranch),
        auditor: selectedAuditor ? Number(selectedAuditor) : null,
        start_date: startDate || null,
        end_date: endDate || null,
        rule: selectedRule,
        frequency: selectedFrequency,
        audit_period: selectedAuditPeriod || null,
        document: selectedDocument ? Number(selectedDocument) : null,
      };

      const res = await axios.post(
        "http://127.0.0.1:8000/api/vendor/mapping/create/",
        payload,
        authHeader
      );

      alert("Vendor Mapping Saved Successfully");

    } catch (error: any) {
      alert(JSON.stringify(error.response?.data));
    }
  };

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Vendor Mapping
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Map vendor branches, assign auditors and compliance documents.
        </p>
      </div>

      {/* VENDOR */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold mb-4">Vendor Information</h2>

        <select
          className="w-full rounded-lg border border-gray-300 p-2.5 text-sm"
          value={selectedVendor}
          onChange={(e) => {
            setSelectedVendor(e.target.value);
            const vendor = vendors.find(v => v.id === Number(e.target.value));
            setSelectedVendorObj(vendor || null);
          }}
        >
          <option value="">Select Vendor</option>
          {vendors.map(v => (
            <option key={v.id} value={v.id}>{v.short_name}</option>
          ))}
        </select>

        {selectedVendorObj && (
          <div className="grid md:grid-cols-6 gap-4 mt-5 text-sm">
            <div><b>Name</b><br />{selectedVendorObj.name}</div>
            <div><b>Agreement Address</b><br />{selectedVendorObj.ho_address || "-"}</div>
            <div><b>Nature of Service</b><br />{selectedVendorObj.nature_of_services || "-"}</div>
            <div><b>Spocname</b><br />{selectedVendorObj.contact_person || "-"}</div>
            <div><b>Email</b><br />{selectedVendorObj.email}</div>
            <div><b>Mobile</b><br />{selectedVendorObj.mobile}</div>
          </div>
        )}
      </div>

      {/* STATE + BRANCH */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold mb-4">Branch Details</h2>

        <div className="grid md:grid-cols-2 gap-4">
          <select
            className="rounded-lg border border-gray-300 p-2.5 text-sm"
            value={selectedState}
            onChange={(e) => {
              setSelectedState(e.target.value);
              loadBranchesByState(e.target.value);
            }}
          >
            <option value="">Select State</option>
            {states.map(s => (
              <option key={s.id} value={s.name}>{s.name}</option>
            ))}
          </select>

          <select
            className="rounded-lg border border-gray-300 p-2.5 text-sm"
            value={selectedBranch}
            onChange={(e) => {
              setSelectedBranch(e.target.value);
              const branch = branches.find(b => b.id === Number(e.target.value));
              setSelectedBranchObj(branch || null);
            }}
          >
            <option value="">Select Branch Address</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>
                {b.display_address}
              </option>
            ))}
          </select>
        </div>

        {selectedBranchObj && (
          <div className="mt-4 text-sm bg-gray-50 p-3 rounded-lg">
            <div><b>Full Address:</b> {selectedBranchObj.display_address}</div>
            <div><b>State:</b> {selectedState}</div>
          </div>
        )}
      </div>

      {/* AUDIT CONFIG */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold mb-4">Audit Configuration</h2>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <input
            type="date"
            className="rounded-lg border border-gray-300 p-2.5 text-sm"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />

          <input
            type="date"
            className="rounded-lg border border-gray-300 p-2.5 text-sm"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        {(startDate || endDate) && (
          <div className="text-sm text-gray-600">
            {startDate && <div><b>Start Date:</b> {formatDateToDDMMYYYY(startDate)}</div>}
            {endDate && <div><b>End Date:</b> {formatDateToDDMMYYYY(endDate)}</div>}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-4 mt-4">
          <select className="rounded-lg border border-gray-300 p-2.5 text-sm"
            onChange={(e)=>setSelectedRule(e.target.value)}>
            <option value="">Rule</option>
            <option value="STATE">State</option>
            <option value="CENTRAL">Central</option>
          </select>

          <select className="rounded-lg border border-gray-300 p-2.5 text-sm"
            onChange={(e)=>setSelectedFrequency(e.target.value)}>
            <option value="">Audit Frequency</option>
            <option value="MONTHLY">Monthly</option>
            <option value="QUARTERLY">Quarterly</option>
            <option value="HALF_YEARLY">Half-Yearly</option>
            <option value="ANNUALLY">Annually</option>
          </select>

          {auditPeriodOptions().length > 0 && (
            <select className="rounded-lg border border-gray-300 p-2.5 text-sm"
              onChange={(e)=>setSelectedAuditPeriod(e.target.value)}>
              <option value="">Audit Period</option>
              {auditPeriodOptions().map(opt => (
                <option key={opt}>{opt}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* AUDITOR */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold mb-4">Assign Auditor</h2>

        <select className="w-full rounded-lg border border-gray-300 p-2.5 text-sm"
          onChange={(e)=>{
            setSelectedAuditor(e.target.value);
            const auditor = auditors.find(a => a.id === Number(e.target.value));
            setSelectedAuditorObj(auditor || null);
          }}>
          <option value="">Select Auditor</option>
          {auditors.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>

        {selectedAuditorObj && (
          <div className="mt-4 text-sm bg-gray-50 p-3 rounded-lg">
            <div><b>Name:</b> {selectedAuditorObj.name}</div>
            <div><b>Email:</b> {selectedAuditorObj.email || "-"}</div>
          </div>
        )}
      </div>

      {/* DOCUMENT */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold mb-4">Assign Documents</h2>

        <select className="w-full rounded-lg border border-gray-300 p-2.5 text-sm"
          onChange={(e)=>setSelectedDocument(e.target.value)}>
          <option value="">Select Document</option>
          {documents.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
          <option value="OTHER">Other</option>
        </select>
      </div>

      {/* SAVE */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition"
        >
          Save Vendor Mapping
        </button>
      </div>

    </div>
  );
}