import {
  useState,
  useEffect,
  useRef,
  useMemo,
} from "react";

import DatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";

import {
  Checkbox,
  Input,
} from "antd";

import "antd/dist/reset.css";

import api from "../../utils/api";

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

  // =====================================================
  // MASTER DATA
  // =====================================================

  const [vendors, setVendors] =
    useState<Vendor[]>([]);

  const [auditors, setAuditors] =
    useState<Auditor[]>([]);

  const [documents, setDocuments] =
    useState<Document[]>([]);

  const [states, setStates] =
    useState<StateType[]>([]);

  const [allBranches, setAllBranches] =
    useState<BranchType[]>([]);

  // =====================================================
  // DATE STATE
  // =====================================================

  const [dateRange, setDateRange] =
    useState<[Date | null, Date | null]>([
      null,
      null,
    ]);

  const [startDate, endDate] =
    dateRange;

  const [startInput, setStartInput] =
    useState("");

  const [endInput, setEndInput] =
    useState("");

  const [startError, setStartError] =
    useState("");

  const [endError, setEndError] =
    useState("");

  // =====================================================
  // SELECTED VALUES
  // =====================================================

  const [selectedVendor, setSelectedVendor] =
    useState("");

  const [selectedState, setSelectedState] =
    useState("");

  const [selectedBranch, setSelectedBranch] =
    useState("");

  const [selectedAuditor, setSelectedAuditor] =
    useState("");

  const [selectedFrequency, setSelectedFrequency] =
    useState("");

  const [selectedShortName, setSelectedShortName] =
    useState("");

  // =====================================================
  // SEARCH STATE
  // =====================================================

  const [vendorSearch, setVendorSearch] =
    useState("");

  const [documentSearch, setDocumentSearch] =
    useState("");

  // =====================================================
  // DROPDOWN STATE
  // =====================================================

  const [showVendorDropdown,
    setShowVendorDropdown] =
      useState(false);

  const [showDocumentDropdown,
    setShowDocumentDropdown] =
      useState(false);

  // =====================================================
  // DOCUMENTS
  // =====================================================

  const [selectedDocuments,
    setSelectedDocuments] =
      useState<number[]>([]);

  // =====================================================
  // REFS
  // =====================================================

  const vendorDropdownRef =
    useRef<HTMLDivElement>(null);

  const documentDropdownRef =
    useRef<HTMLDivElement>(null);

  // =====================================================
  // DERIVED STATE (OPTIMIZED)
  // =====================================================

  const selectedVendorObj = useMemo(
    () =>
      vendors.find(
        (v) =>
          v.id === Number(selectedVendor)
      ) || null,
    [vendors, selectedVendor]
  );

  const branches = useMemo(() => {

    if (!selectedState) {
      return allBranches;
    }

    return allBranches.filter(
      (b) => b.state === selectedState
    );

  }, [allBranches, selectedState]);

  const selectedBranchObj = useMemo(
    () =>
      branches.find(
        (b) =>
          b.id === Number(selectedBranch)
      ) || null,
    [branches, selectedBranch]
  );

  const selectedAuditorObj = useMemo(
    () =>
      auditors.find(
        (a) =>
          a.id === Number(selectedAuditor)
      ) || null,
    [auditors, selectedAuditor]
  );

const filteredVendors = useMemo(() => {

  return [...vendors]

    .sort((a, b) =>
      a.short_name.localeCompare(
        b.short_name,
        undefined,
        { sensitivity: "base" }
      )
    )

    .filter((v) =>
      v.short_name
        .toLowerCase()
        .includes(
          vendorSearch.toLowerCase()
        )
    );

}, [vendors, vendorSearch]);

  const filteredDocuments = useMemo(() => {

    return documents.filter((doc) =>
      doc.name
        .toLowerCase()
        .includes(
          documentSearch.toLowerCase()
        )
    );

  }, [documents, documentSearch]);

  useEffect(() => {

    const loadInitialData = async () => {

      try {

        const [
          vendorsRes,
          auditorsRes,
          documentsRes,
          branchesRes,
        ] = await Promise.all([

          api.get("/api/vendor/list/"),

          api.get("/api/auditor/list/"),

          api.get("/api/document-master/list/"),

          api.get("/api/vendor/pe/branches/"),
        ]);

        setVendors(
          Array.isArray(vendorsRes.data)
            ? vendorsRes.data
            : []
        );

        setAuditors(
          Array.isArray(auditorsRes.data)
            ? auditorsRes.data
            : []
        );

        setDocuments(
          Array.isArray(documentsRes.data)
            ? documentsRes.data
            : []
        );

        const activeBranches =
          Array.isArray(branchesRes.data)
            ? branchesRes.data.filter(
                (b: any) =>
                  !b.status ||
                  b.status === "active"
              )
            : [];

        setAllBranches(activeBranches);

        const uniqueStates = Array.from(
          new Set(
            activeBranches.map(
              (b: any) => b.state
            )
          )
        ).map((state, index) => ({
          id: index,
          name: state as string,
        }));

        setStates(

          uniqueStates.sort((a, b) =>

            a.name.localeCompare(
              b.name,
              undefined,
              { sensitivity: "base" }
            )
          )
        );
      } catch (error) {

        console.error(
          "Initial load failed",
          error
        );
      }
    };

    loadInitialData();

  }, []);

  const selectedDocumentSet = useMemo(
  () => new Set(selectedDocuments),
  [selectedDocuments]
);

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

    const handleClickOutside = (
      event: MouseEvent
    ) => {

      if (
        vendorDropdownRef.current &&
        !vendorDropdownRef.current.contains(
          event.target as Node
        )
      ) {
        setShowVendorDropdown(false);
      }

      if (
        documentDropdownRef.current &&
        !documentDropdownRef.current.contains(
          event.target as Node
        )
      ) {
        setShowDocumentDropdown(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {

      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };

  }, []);

const toggleDocument = (id: number) => {
  setSelectedDocuments((prev) =>
    prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
  );
};

const handleSave = async () => {

  if (
    !selectedVendor ||
    !selectedBranch ||
    !startDate ||
    !endDate
  ) {
    alert(
      "Please fill all required fields"
    );
    return;
  }

  // Normalize today's date
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  // Prevent invalid range
  if (startDate > endDate) {

    alert(
      "Start date cannot be greater than End date"
    );

    return;
  }

  // Prevent past end date
  if (endDate < today) {

    alert(
      "End date cannot be in the past"
    );

    return;
  }

  try {

    const payload = {
      vendor: Number(selectedVendor),
      branch: Number(selectedBranch),
      auditor: selectedAuditor
        ? Number(selectedAuditor)
        : null,

      document_ids: selectedDocuments,

      start_date: formatForAPI(startDate),
      end_date: formatForAPI(endDate),

      frequency: selectedFrequency,
    };

    console.log(
      "🚀 FINAL PAYLOAD:",
      payload
    );

    await api.post(
      "/api/vendor/mapping/create/",
      payload
    );

    alert(
      "Vendor Mapping Saved Successfully"
    );

    // RESET FORM

    setSelectedVendor("");

    setSelectedState("");

    setSelectedShortName("");

    setSelectedBranch("");

    setSelectedAuditor("");

    setSelectedDocuments([]);

    setDocumentSearch("");

    setVendorSearch("");

    setSelectedRule("");

    setSelectedFrequency("");

    setDateRange([null, null]);

    setStartInput("");

    setEndInput("");

    setStartError("");

    setEndError("");

  } catch (error: any) {

    console.log(
      "❌ ERROR:",
      error.response?.data
    );

    alert(
      JSON.stringify(
        error.response?.data
      )
    );
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

    {filteredVendors.map(v => (
              <div
                key={v.id}
                onClick={() => {
                  setSelectedVendor(String(v.id));
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
      }}
    >
      <option value="">Select State</option>
      {[...states]
        .sort((a, b) =>
          a.name.localeCompare(
            b.name,
            undefined,
            { sensitivity: "base" }
          )
        )
        .map(s => (
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
          setSelectedShortName(branch.short_name);
        } else {
          setSelectedShortName("");
        }
      }}
    >
      <option value="">Select Short Name</option>
      {[...branches]
        .sort((a, b) =>
          a.short_name.localeCompare(
            b.short_name,
            undefined,
            { sensitivity: "base" }
          )
        )
        .map((b) => (
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
    <div className="mt-4 text-sm bg-gray-50 p-3 rounded-lg flex items-center gap-2 overflow-x-auto whitespace-nowrap">
      <span>
        <b>State:</b> {selectedState}
      </span>

      <span>|</span>

      <span>
        <b>Branch Short Name:</b> {selectedShortName}
      </span>

      <span>|</span>

      <span>
        <b>Branch Address:</b> {selectedBranchObj.address}
      </span>
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
    <div className="mt-4 text-sm bg-gray-50 p-3 rounded-lg flex items-center gap-2 overflow-x-auto whitespace-nowrap">
      <span>
        <b>Selected Start Date:</b> {formatDate(startDate)}
      </span>

      <span>|</span>

      <span>
        <b>Selected End Date:</b> {formatDate(endDate)}
      </span>
    </div>
  )}
</div>


{/* AUDIT RULES */}
<div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
  <h2 className="text-lg font-semibold mb-4">Audit Rules</h2>

  <div className="grid md:grid-cols-2 gap-4">

    {/* RULE */}
<input
  type="text"
  value={selectedRule}
  readOnly
  className="rounded-lg border border-gray-300 p-2.5 text-sm bg-gray-100 cursor-not-allowed"
/>

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
      }}
    >
      <option value="">Select Auditor</option>
      {[...auditors]
        .sort((a, b) =>
          a.name.localeCompare(
            b.name,
            undefined,
            { sensitivity: "base" }
          )
        )
        .map(a => (
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

      {[...filteredDocuments]
        .sort((a, b) =>
          a.name.localeCompare(
            b.name,
            undefined,
            { sensitivity: "base" }
          )
        )
        .map((doc) => (     
            <div
              key={doc.id}
              className="flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm"
            >
              <Checkbox
                checked={selectedDocumentSet.has(doc.id)}
                onChange={() => toggleDocument(doc.id)}
              >
                {doc.name}
              </Checkbox>
            </div>
          ))}

      {filteredDocuments.length === 0 && (
          <div className="px-3 py-2 text-gray-400 text-sm">
            No documents found
          </div>
        )}
      </div>
    )}
  </div>

  {/* SELECTED DOCUMENT TAGS */}
{/* SELECTED DOCUMENT TAGS */}
{selectedDocuments.length > 0 && (

  <div className="mt-3 flex flex-wrap gap-2">

    {documents
      .filter((doc) =>
        selectedDocumentSet.has(doc.id)
      )
      .map((doc) => (

        <span
          key={doc.id}
          className="flex items-center gap-2 bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full"
        >
          {doc.name}

          {/* REMOVE BUTTON */}
          <button
            onClick={() =>
              toggleDocument(doc.id)
            }
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