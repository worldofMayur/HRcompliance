import { useState, useEffect, useRef } from "react";import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Checkbox, Input } from "antd";
import "antd/dist/reset.css";

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
  status: string;
}

export default function VendorMapping() {

  const token = localStorage.getItem("access_token");

  const authHeader = {
    headers: { Authorization: `Bearer ${token}` }
  };

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

  const [selectedVendor, setSelectedVendor] = useState("");
  const [selectedVendorObj, setSelectedVendorObj] = useState<Vendor | null>(null);

  const [selectedState, setSelectedState] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedBranchObj, setSelectedBranchObj] = useState<BranchType | null>(null);

  const [selectedAuditor, setSelectedAuditor] = useState("");
  const [selectedAuditorObj, setSelectedAuditorObj] = useState<Auditor | null>(null);

  const [selectedRule, setSelectedRule] = useState("");
  const [selectedFrequency, setSelectedFrequency] = useState("");
  const [selectedDocument, setSelectedDocument] = useState("");

  const [selectedShortName, setSelectedShortName] = useState("");
  const [vendorSearch, setVendorSearch] = useState("");
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);
  const vendorDropdownRef = useRef<HTMLDivElement>(null);

  const [documentSearch, setDocumentSearch] = useState("");
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([]);
  const [showDocumentDropdown, setShowDocumentDropdown] = useState(false);
  const documentDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadVendors();
    loadAuditors();
    loadDocuments();
    loadPEBranches();
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

      console.log("Documents from API:", res.data);

      // Backend already filters documents for the logged-in PE
      setDocuments(res.data);

    } catch (error) {
      console.error("Error loading documents:", error);
    }
  };

  const loadPEBranches = async () => {
    try {

      const res = await axios.get(
        "http://127.0.0.1:8000/api/vendor/pe/branches/",
        authHeader
      );

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
    if (!date) return "-";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatForAPI = (date: Date | null) => {
    if (!date) return null;
    return date.toISOString().split("T")[0];
  };

useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (
      documentDropdownRef.current &&
      !documentDropdownRef.current.contains(event.target as Node)
    ) {
      setShowDocumentDropdown(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);

const toggleDocument = (id: number) => {
  setSelectedDocuments((prev) =>
    prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
  );
};

const handleSave = async () => {

  if (!selectedVendor || !selectedBranch || !startDate || !endDate) {
    alert("Please fill all required fields");
    return;
  }

  // 🔥 FIX 1 — Normalize today's date
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 🔥 FIX 2 — Prevent invalid range
  if (startDate > endDate) {
    alert("Start date cannot be greater than End date");
    return;
  }

  // 🔥 FIX 3 — Prevent past end date (MAIN ISSUE)
  if (endDate < today) {
    alert("End date cannot be in the past");
    return;
  }

  try {

    const payload = {
      vendor: Number(selectedVendor),
      branch: Number(selectedBranch),
      auditor: selectedAuditor ? Number(selectedAuditor) : null,
      documents: selectedDocuments,
      start_date: formatForAPI(startDate),
      end_date: formatForAPI(endDate),
      rule: selectedRule,
      frequency: selectedFrequency,
    };

    // 🔥 DEBUG (VERY IMPORTANT)
    console.log("🚀 FINAL PAYLOAD:", payload);

    await axios.post(
      "http://127.0.0.1:8000/api/vendor/mapping/create/",
      payload,
      authHeader
    );

    alert("Vendor Mapping Saved Successfully");

    // RESET
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

    setDateRange([null, null]);
    setStartInput("");
    setEndInput("");

  } catch (error: any) {
    console.log("❌ ERROR:", error.response?.data);
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

      </div>

      {/* VENDOR SECTION */}
   {/* VENDOR + BRANCH SECTION */}
<div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
  <h2 className="text-lg font-semibold mb-4">Vendor Information</h2>

  <div className="grid md:grid-cols-3 gap-4">

    {/* VENDOR SEARCH */}
    <div className="relative" ref={vendorDropdownRef}>
      <input
        type="text"
        placeholder="Search Vendor..."
        value={vendorSearch}
        onFocus={() => setShowVendorDropdown(true)}
        onChange={(e) => {
          setVendorSearch(e.target.value);
          setShowVendorDropdown(true);
        }}
        className="w-full rounded-lg border border-gray-300 p-2.5 text-sm"
      />

      {showVendorDropdown && (
        <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-lg mt-1 max-h-52 overflow-y-auto shadow">

          {vendors
            .filter(v =>
              v.short_name.toLowerCase().includes(vendorSearch.toLowerCase())
            )
            .map(v => (
              <div
                key={v.id}
                onClick={() => {
                  setSelectedVendor(String(v.id));
                  setSelectedVendorObj(v);
                  setVendorSearch(v.short_name);
                  setShowVendorDropdown(false);
                }}
                className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm"
              >
                {v.short_name}
              </div>
            ))}

        </div>
      )}
    </div>

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
        const branchId = e.target.value;

        setSelectedBranch(branchId);

        const branch = branches.find(b => String(b.id) === branchId);

        if (branch) {
          setSelectedBranchObj(branch);
          setSelectedShortName(branch.short_name);
        } else {
          setSelectedBranchObj(null);
          setSelectedShortName("");
        }
      }}
    >
      <option value="">Select Short Name</option>
      {branches.map((b) => (
        <option key={b.id} value={b.id}>
          {b.short_name}
        </option>
      ))}
    </select>

  </div>

  {/* Vendor Details */}
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

  {/* Branch Summary */}
{selectedBranchObj && (
  <div className="mt-4 text-sm bg-gray-50 p-3 rounded-lg space-y-1">
    <div><b>State:</b> {selectedState}</div>
    <div><b>Branch Short Name:</b> {selectedShortName}</div>
    <div><b>Branch Address:</b> {selectedBranchObj.address}</div>
  </div>
)}

{/* ✅ ADD HERE */}
{selectedBranchObj?.short_name === "All Branches" && (
  <div className="mt-3 text-sm bg-yellow-50 p-3 rounded-lg">
    This mapping applies to entire {selectedState}
  </div>
)}

</div>

      {/* AUDIT CONFIGURATION */}
{/* AUDIT DATES */}
<div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
  <h2 className="text-lg font-semibold mb-4">Agreement Validity</h2>

  <div className="grid md:grid-cols-2 gap-4">

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
</div>


{/* AUDIT RULES */}
<div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
  <h2 className="text-lg font-semibold mb-4">Audit Rules</h2>

  <div className="grid md:grid-cols-2 gap-4">

    {/* RULE */}
    <select
      className="rounded-lg border border-gray-300 p-2.5 text-sm"
      onChange={(e) => setSelectedRule(e.target.value)}
    >
      <option value="">Rule</option>
      <option value="STATE">State</option>
      <option value="CENTRAL">Central</option>
    </select>

    {/* FREQUENCY */}
    <select
      className="rounded-lg border border-gray-300 p-2.5 text-sm"
      onChange={(e) => setSelectedFrequency(e.target.value)}
    >
      <option value="">Audit Frequency</option>
      <option value="MONTHLY">Monthly</option>
      <option value="QUARTERLY">Quarterly</option>
      <option value="HALF_YEARLY">Half-Yearly</option>
      <option value="ANNUALLY">Annually</option>
    </select>

  </div>
</div>

      {/* AUDITOR */}
      {/* AUDITOR + DOCUMENT */}
<div className="grid md:grid-cols-2 gap-6">

  {/* AUDITOR */}
  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
    <h2 className="text-lg font-semibold mb-4">Assign Auditor</h2>

    <select
      className="w-full rounded-lg border border-gray-300 p-2.5 text-sm"
      value={selectedAuditor}
      onChange={(e) => {
        setSelectedAuditor(e.target.value);
        const auditor = auditors.find(a => a.id === Number(e.target.value));
        setSelectedAuditorObj(auditor || null);
      }}
    >
      <option value="">Select Auditor</option>
      {auditors.map(a => (
        <option key={a.id} value={a.id}>
          {a.name}
        </option>
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
{/* DOCUMENT */}
{/* DOCUMENT */}
<div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
  <h2 className="text-lg font-semibold mb-4">Assign Documents</h2>

  <div className="relative" ref={documentDropdownRef}>

    {/* SEARCH INPUT */}
    <Input
      placeholder="Search Documents..."
      value={documentSearch}
      onFocus={() => setShowDocumentDropdown(true)}
      onChange={(e) => {
        setDocumentSearch(e.target.value);
        setShowDocumentDropdown(true);
      }}
      className="w-full rounded-lg border border-gray-300 p-2.5 text-sm"
    />

    {/* DROPDOWN */}
    {showDocumentDropdown && (
      <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-lg mt-1 max-h-60 overflow-y-auto shadow">

        {documents
          .filter((doc) =>
            doc.name.toLowerCase().includes(documentSearch.toLowerCase())
          )
          .map((doc) => (
            <div
              key={doc.id}
              className="flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm"
            >
              <Checkbox
                checked={selectedDocuments.includes(doc.id)}
                onChange={() => toggleDocument(doc.id)}
              >
                {doc.name}
              </Checkbox>
            </div>
          ))}

        {documents.filter((doc) =>
          doc.name.toLowerCase().includes(documentSearch.toLowerCase())
        ).length === 0 && (
          <div className="px-3 py-2 text-gray-400 text-sm">
            No documents found
          </div>
        )}
      </div>
    )}
  </div>

  {/* SELECTED DOCUMENT TAGS */}
  {selectedDocuments.length > 0 && (
    <div className="mt-3 flex flex-wrap gap-2">

      {documents
        .filter((doc) => selectedDocuments.includes(doc.id))
        .map((doc) => (
          <span
            key={doc.id}
            className="flex items-center gap-2 bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full"
          >
            {doc.name}

            {/* REMOVE BUTTON */}
            <button
              onClick={() => toggleDocument(doc.id)}
              className="text-blue-700 hover:text-red-500 font-bold"
            >
              ×
            </button>
          </span>
        ))}
    </div>
  )}
</div>

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