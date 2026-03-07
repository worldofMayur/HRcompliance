import { useState, useEffect } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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
  is_active?: boolean;
}

interface StateType {
  id: number;
  name: string;
}

interface BranchType {
  id: number;
  address: string;
  short_name: string;
  state: string;
  status: string;   // ADD THIS
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
  const [allBranches, setAllBranches] = useState<BranchType[]>([]);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [startDate, endDate] = dateRange;
const [startInput, setStartInput] = useState("");
const [endInput, setEndInput] = useState("");

const [startError, setStartError] = useState("");
const [endError, setEndError] = useState("");
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

  const [shortNames, setShortNames] = useState<string[]>([]);
  const [selectedShortName, setSelectedShortName] = useState("");

  /* ================= LOAD ================= */

  useEffect(() => {
    loadVendors();
    loadAuditors();
    loadDocuments();
    loadPEBranches(); // 🔥 fixed
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
  try {
    const res = await axios.get(
      "http://127.0.0.1:8000/api/document-master/list/",
      authHeader
    );

    setDocuments(
      (res.data.results || res.data).filter(
        (d: Document) => d.is_active !== false
      )
    );

  } catch (error) {
    console.error("Error loading documents:", error);
  }
};

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

  // ✅ Correct PE branch loading
const loadPEBranches = async () => {
  try {
    const res = await axios.get(
      "http://127.0.0.1:8000/api/vendor/pe/branches/",
      authHeader
    );

    console.log("PE Branch Response:", res.data);

    // if backend doesn't send status, don't filter
    const activeBranches = res.data.filter(
      (b: any) => !b.status || b.status === "active"
    );

    setAllBranches(activeBranches);
    setBranches(activeBranches);

    const uniqueStates = Array.from(
      new Set(activeBranches.map((b: any) => b.state))
    ).map((state, index) => ({
      id: index,
      name: state
    }));

    setStates(uniqueStates);

  } catch (error: any) {
    console.log("PE Branch Error:", error.response?.data);
  }
};

  /* ================= DATE FORMAT ================= */

const formatDate = (date: Date | null) => {
  if (!date) return "-";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

  /* ================= FREQUENCY LOGIC ================= */

  const auditPeriodOptions = () => {
    switch (selectedFrequency) {
      case "MONTHLY":
        return ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      case "QUARTERLY":
        return ["Q1 (Jan-Mar)","Q2 (Apr-Jun)","Q3 (Jul-Sep)","Q4 (Oct-Dec)"];
      case "HALF_YEARLY":
        return ["H1 (Apr-Sep)","H2 (Oct-Mar)"];
      case "ANNUALLY":
        return ["Financial Year (Apr-Mar)","Calendar Year (Jan-Dec)"];
      default:
        return [];
    }
  };

  const formatForAPI = (date: Date | null) => {
  if (!date) return null;
  return date.toISOString().split("T")[0];
};

  /* ================= SAVE ================= */

const handleSave = async () => {

  if (!selectedVendor || !selectedBranch || !startDate || !endDate) {
    alert("Please fill all required fields");
    return;
  }

  try {

    const payload = {
      vendor: Number(selectedVendor),
      branch: Number(selectedBranch),
      auditor: selectedAuditor ? Number(selectedAuditor) : null,
      document: selectedDocument ? Number(selectedDocument) : null,
      start_date: formatForAPI(startDate),
      end_date: formatForAPI(endDate),
      rule: selectedRule,
      frequency: selectedFrequency,
      audit_period: selectedAuditPeriod || null
    };

    await axios.post(
      "http://127.0.0.1:8000/api/vendor/mapping/create/",
      payload,
      authHeader
    );

    alert("Vendor Mapping Saved Successfully");

    // ✅ RESET FORM HERE
    setSelectedVendor("");
    setSelectedVendorObj(null);

    setSelectedState("");
    setSelectedShortName("");
    setSelectedBranch("");
    setSelectedBranchObj(null);

    setSelectedAuditor("");
    setSelectedAuditorObj(null);

    setSelectedDocument("");

    setSelectedRule("");
    setSelectedFrequency("");
    setSelectedAuditPeriod("");

    setDateRange([null, null]);
    setStartInput("");
    setEndInput("");

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

      {/* VENDOR SECTION */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
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

      {/* BRANCH SECTION */}
<div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
  <h2 className="text-lg font-semibold mb-4">Branch Details</h2>

  <div className="grid md:grid-cols-3 gap-4">

    {/* STATE */}
    <select
      className="rounded-lg border border-gray-300 p-2.5 text-sm"
      value={selectedState}
      onChange={(e) => {
        const state = e.target.value;

        setSelectedState(state);
        setSelectedShortName("");
        setSelectedBranch("");
        setSelectedBranchObj(null);

        const filtered = allBranches.filter(b => b.state === state);
        setBranches(filtered);

        const uniqueShortNames = Array.from(
          new Set(filtered.map(b => b.short_name))
        );

        setShortNames(uniqueShortNames);
      }}
    >
      <option value="">Select State</option>
      {states.map(s => (
        <option key={s.id} value={s.name}>
          {s.name}
        </option>
      ))}
    </select>


    {/* SHORT NAME */}
    <select
      className="rounded-lg border border-gray-300 p-2.5 text-sm"
      value={selectedShortName}
      onChange={(e) => {
        const shortName = e.target.value;

        setSelectedShortName(shortName);
        setSelectedBranch("");
        setSelectedBranchObj(null);

        const filtered = allBranches.filter(
          b => b.state === selectedState && b.short_name === shortName
        );

        setBranches(filtered);
      }}
    >
      <option value="">Select Short Name</option>
      {shortNames.map((sn, index) => (
        <option key={index} value={sn}>
          {sn}
        </option>
      ))}
    </select>


    {/* ADDRESS */}
    <select
      className="rounded-lg border border-gray-300 p-2.5 text-sm"
      value={selectedBranch}
      onChange={(e) => {
        const branchId = Number(e.target.value);

        setSelectedBranch(e.target.value);

        const branch = branches.find(b => b.id === branchId);
        setSelectedBranchObj(branch || null);
      }}
    >
      <option value="">Select Branch Address</option>
      {branches.map(b => (
        <option key={b.id} value={b.id}>
          {b.address}
        </option>
      ))}
    </select>

  </div>


  {/* SELECTED SUMMARY */}
  {selectedBranchObj && (
    <div className="mt-4 text-sm bg-gray-50 p-3 rounded-lg space-y-1">
      <div><b>State:</b> {selectedState}</div>
      <div><b>Branch Short Name:</b> {selectedShortName}</div>
      <div><b>Branch Address:</b> {selectedBranchObj.address}</div>
    </div>
  )}
</div>

      {/* AUDIT CONFIGURATION */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Audit Configuration</h2>
<div className="grid md:grid-cols-2 gap-4 mb-5">

  {/* START DATE */}
  <div className="flex flex-col">
    <label className="text-sm font-medium text-gray-700 mb-1">
      Start Date
    </label>

<DatePicker
  selected={startDate}
  value={startInput}
  onChange={(date: Date | null) => {
    if (date) {
      const formatted = date.toLocaleDateString("en-GB");
      setStartInput(formatted);
      setDateRange([date, endDate]);
      setStartError("");
    }
  }}
  onChangeRaw={(e) => {
    const value = e.target.value;
    setStartInput(value);

    const parsed = parseDate(value);

    if (parsed) {
      setDateRange([parsed, endDate]);
      setStartError("");
    } else {
      setStartError("Invalid date format (dd/mm/yyyy)");
    }
  }}
  dateFormat="dd/MM/yyyy"
  placeholderText="dd/mm/yyyy"
  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm"
/>

{startError && (
  <p className="text-red-500 text-xs mt-1">{startError}</p>
)}

    <span className="text-xs text-gray-400 mt-1">
      Format: dd/mm/yyyy
    </span>
  </div>

  {/* END DATE */}
  <div className="flex flex-col">
    <label className="text-sm font-medium text-gray-700 mb-1">
      End Date
    </label>

<DatePicker
  selected={endDate}
  value={endInput}
  onChange={(date: Date | null) => {
    if (date) {
      const formatted = date.toLocaleDateString("en-GB");
      setEndInput(formatted);
      setDateRange([startDate, date]);
      setEndError("");
    }
  }}
  onChangeRaw={(e) => {
    const value = e.target.value;
    setEndInput(value);

    const parsed = parseDate(value);

    if (parsed) {
      setDateRange([startDate, parsed]);
      setEndError("");
    } else {
      setEndError("Invalid date format (dd/mm/yyyy)");
    }
  }}
  dateFormat="dd/MM/yyyy"
  placeholderText="dd/mm/yyyy"
  minDate={startDate || undefined}
  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm"
/>

{endError && (
  <p className="text-red-500 text-xs mt-1">{endError}</p>
)}
    <span className="text-xs text-gray-400 mt-1">
      Format: dd/mm/yyyy
    </span>
  </div>

</div>

  {(startDate || endDate) && (
  <div className="mt-4 text-sm bg-gray-50 p-3 rounded-lg space-y-1">
    <div><b>Selected Start Date:</b> {formatDate(startDate)}</div>
    <div><b>Selected End Date:</b> {formatDate(endDate)}</div>
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
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
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
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
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