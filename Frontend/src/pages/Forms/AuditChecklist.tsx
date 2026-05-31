import { useEffect, useMemo, useState, useRef } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../../utils/api";

const API_BASE = "https://apii.complianceclearance.com/api";

export default function AuditChecklistForm() {

  /* =========================
     MASTER DATA
  ========================= */
  const [states, setStates] = useState([]);
  const [acts, setActs] = useState([]);
  const [sections, setSections] = useState([]);
  const [showActModal, setShowActModal] = useState(false);
  const [newActName, setNewActName] = useState("");
  const [documents, setDocuments] = useState([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [stateFilter, setStateFilter] = useState("");

  const [documentSearch, setDocumentSearch] = useState("");
  const [docDropdownOpen, setDocDropdownOpen] = useState(false);
  const [stateSearch, setStateSearch] = useState("");
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);
  const [actSearch, setActSearch] = useState("");
const [actDropdownOpen, setActDropdownOpen] = useState(false);
const actRef = useRef(null);
  const stateRef = useRef(null);
  const docRef = useRef(null);  /* =========================
     CHECKLIST DATA
  ========================= */
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);

  /* =========================
     INLINE EDIT
  ========================= */
  const [editingId, setEditingId] = useState(null);
  const [editGuide, setEditGuide] = useState("");

    const [editData, setEditData] = useState({
    audit_particulars: "",
    form_number: "",
    auditor_guide: "",
    section: "",
  });

  /* =========================
     SEARCH & FILTERS
  ========================= */
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
const [checkpoints, setCheckpoints] = useState([]);
const [checkpointInput, setCheckpointInput] = useState("");
  /* =========================
     FORM STATE
  ========================= */
const [formData, setFormData] = useState({
  state: "",
  act: "",
  compliance_nature: "",
  section: "",
  document: "",
  audit_particulars: "",
  form_number: "",
});

  /* =========================
     INITIAL LOAD
  ========================= */
  useEffect(() => {

    api.get("/api/checklist/states/")
      .then((res) => {
setStates(
  Array.isArray(res.data)
    ? [...res.data].sort((a, b) =>
        (a.name || "").localeCompare(
          b.name || "",
          undefined,
          { sensitivity: "base" }
        )
      )
    : []
);
      });

    api.get("/api/document-master/list/")
      .then((res) => {
      setDocuments(
        Array.isArray(res.data)
          ? [...res.data].sort((a, b) =>
              (a.name || "").localeCompare(
                b.name || "",
                undefined,
                { sensitivity: "base" }
              )
            )
          : []
      );
      });

    fetchList();

  }, []);

const handleCreateAct = async () => {
  if (!newActName.trim()) {
    alert("Enter Act name");
    return;
  }

  if (!formData.state) {
    alert("Please select state first");
    return;
  }

  try {
    const res = await api.post(
      "/api/checklist/acts/create/",
      {
        name: newActName,
        state: formData.state,
      }
    );

    const data = res.data;

    // ✅ Instant UI update (no delay)
    setActs(prev => {
      // prevent duplicate
      const exists = prev.find(a => a.id === data.id);
      if (exists) return prev;
      return [...prev, data];
    });

    // ✅ Auto select new act
    setFormData(prev => ({
      ...prev,
      act: data.id,
    }));

    // ✅ Close modal + reset input
    setNewActName("");
    setShowActModal(false);

    // ✅ Optional silent sync (safe fallback)
    setTimeout(() => {
      fetch(`${API_BASE}/checklist/acts/?state=${formData.state}`, {
        headers: authHeaders,
      })
        .then(r => r.json())
        .then(setActs);
    }, 300);

  } catch (err) {
    console.error(err);
    alert("Error creating act");
  }
};

const handleAddCheckpoint = () => {
  if (!checkpointInput.trim()) return;

  const newItem = {
    id: Date.now(),
    text: checkpointInput.trim(),
  };

  setCheckpoints((prev) => [...prev, newItem]);
  setCheckpointInput("");
};

const handleDeleteCheckpoint = (id) => {
  setCheckpoints((prev) => prev.filter((item) => item.id !== id));
};

  const fetchList = async () => {

    setLoading(true);

    try {

      const res = await api.get(
        "/api/checklist/list/"
      );

      setChecklists(
        Array.isArray(res.data)
          ? res.data
          : []
      );

    } catch (err) {

      console.error(err);

      setChecklists([]);

    } finally {

      setLoading(false);
    }
  };

  /* =========================
     CLOSE DROPDOWN ON OUTSIDE CLICK
  ========================= */
useEffect(() => {
  const handleClick = (e) => {
    if (docRef.current && !docRef.current.contains(e.target)) {
      setDocDropdownOpen(false);
    }

    if (stateRef.current && !stateRef.current.contains(e.target)) {
      setStateDropdownOpen(false);
    }

    // ✅ ADD THIS
    if (actRef.current && !actRef.current.contains(e.target)) {
      setActDropdownOpen(false);
    }
  };

  document.addEventListener("mousedown", handleClick);
  return () => document.removeEventListener("mousedown", handleClick);
}, []);

  /* =========================
     DEPENDENT DROPDOWNS
  ========================= */
  useEffect(() => {
    if (!formData.state) return;

  api.get(
    `/api/checklist/acts/?state=${formData.state}`
  )
  .then((res) => {
    setActs(
      Array.isArray(res.data)
        ? [...res.data].sort((a, b) =>
            (a.name || "").localeCompare(
              b.name || "",
              undefined,
              { sensitivity: "base" }
            )
          )
        : []
    );
  });

setFormData(p => ({ ...p, act: "", section: "" }));
    setSections([]);
  }, [formData.state]);

  useEffect(() => {
    if (!formData.act) return;

  api.get(
    `/api/checklist/sections/?act=${formData.act}`
  )
  .then((res) => {
    setSections(
      Array.isArray(res.data)
        ? res.data
        : []
    );
  });

setFormData(p => ({ ...p, section: "" }));
  }, [formData.act]);


  const filteredActs = useMemo(() => {
  if (!actSearch) return acts;

return acts
  .filter((a) =>
    a.name.toLowerCase().includes(actSearch.toLowerCase())
  )
  .sort((a, b) =>
    (a.name || "").localeCompare(
      b.name || "",
      undefined,
      { sensitivity: "base" }
    )
  );

}, [acts, actSearch]);

  /* =========================
     DOCUMENT SEARCH FILTER
  ========================= */
  const filteredDocuments = useMemo(() => {
    if (!documentSearch) return documents;

return (Array.isArray(documents) ? documents : [])
  .filter((d) =>
    d.name.toLowerCase().includes(
      documentSearch.toLowerCase()
    )
  )
  .sort((a, b) =>
    (a.name || "").localeCompare(
      b.name || "",
      undefined,
      { sensitivity: "base" }
    )
  );
  }, [documents, documentSearch]);

  const filteredStates = useMemo(() => {
  if (!stateSearch) return states;

return states
  .filter((s) =>
    s.name.toLowerCase().includes(stateSearch.toLowerCase())
  )
  .sort((a, b) =>
    (a.name || "").localeCompare(
      b.name || "",
      undefined,
      { sensitivity: "base" }
    )
  );
}, [states, stateSearch]);

  /* =========================
     CREATE CHECKLIST
  ========================= */
const handleSubmit = async (e) => {
  e.preventDefault();

  if (
    !formData.state ||
    !formData.act ||
    !formData.section?.trim() ||
    !formData.document
  ) {
    alert("Please fill all required fields");
    return;
  }

  if (checkpoints.length === 0) {
    alert("Please add at least one checklist point");
    return;
  }

  try {
    const payload = {
      state: Number(formData.state),
      act: Number(formData.act),
      compliance_nature: "General",
      section: formData.section.trim(),
      document: Number(formData.document),

      audit_particulars: formData.audit_particulars || "",
      form_number: formData.form_number || "",

      // ✅ SEND ARRAY ONCE
      auditor_guide: checkpoints.map(c => c.text),
    };

    await api.post(
      "/api/checklist/create/",
      payload
    );

    alert("Checklist created successfully ✅");

    setFormData({
      state: "",
      act: "",
      compliance_nature: "",
      section: "",
      document: "",
      audit_particulars: "",
      form_number: "",
    });

    setCheckpoints([]);
    fetchList();

  } catch (err) {
    console.error(err);
    alert("Something went wrong");
  }
};
  /* =========================
     INLINE EDIT
  ========================= */
const startEdit = (row) => {
  setEditingId(row.id);
  setEditData({
    audit_particulars: row.audit_particulars || "",
    form_number: row.form_number || "",
    auditor_guide: row.auditor_guide || "",
    section: row.section || "",
  });
};

const saveEdit = async (id) => {
  try {
    await api.put(
      `/api/checklist/${id}/update/`,
      {
        audit_particulars:
          editData.audit_particulars,

        form_number:
          editData.form_number,

        auditor_guide:
          editData.auditor_guide,

        section:
          editData.section,
      }
    );

    alert("Updated successfully ✅");

    setEditingId(null);

    // reset edit data (important)
    setEditData({
      audit_particulars: "",
      form_number: "",
      auditor_guide: "",
      section: "",
    });

    fetchList();

  } catch (err) {
    console.error("Network error:", err);
    alert("Something went wrong while updating");
  }
};

  const toggleStatus = async (id) => {
    await api.post(
      `/api/checklist/${id}/toggle-status/`
    );
    fetchList();
  };

  const toggleSelect = (id: number) => {
  setSelectedIds((prev) =>
    prev.includes(id)
      ? prev.filter((i) => i !== id)
      : [...prev, id]
  );
};

const toggleSelectAll = () => {
  if (selectedIds.length === filteredChecklists.length) {
    setSelectedIds([]);
  } else {
    setSelectedIds(filteredChecklists.map((c) => c.id));
  }
};


const deleteSelected = async () => {
  if (!selectedIds.length) {
    alert("No checklist selected");
    return;
  }

  if (!confirm("Are you sure you want to delete selected checklists?")) return;

  try {
    await Promise.all(
      selectedIds.map((id) =>
      api.delete(
        `/api/checklist/${id}/delete/`
      )
      )
    );

    alert("Deleted successfully ✅");

    setSelectedIds([]);
    fetchList();

  } catch (err) {
    console.error(err);
    alert("Delete failed");
  }
};
  /* =========================
     FILTERED TABLE DATA
  ========================= */
const filteredChecklists = useMemo(() => {
    if (!Array.isArray(checklists)) {
      return [];
    }

    const filtered = checklists.filter((c) => {
    const searchText = search.toLowerCase();

    const text = `
      ${c.state}
      ${c.act}
      ${c.audit_particulars}
      ${c.form_number}
      ${c.section}
      ${c.document}
      ${c.auditor_guide}
    `.toLowerCase();

    if (search && !text.includes(searchText)) return false;
    if (stateFilter && c.state !== stateFilter) return false;

    if (statusFilter === "active" && !c.is_active) return false;
    if (statusFilter === "inactive" && c.is_active) return false;

    return true;
  });

  // ✅ SORT BY STATE → ACT → SECTION (sequential grouping)
  return filtered.sort((a, b) => {
    // 1. Sort by state
    if (a.state !== b.state) {
      return a.state.localeCompare(
        b.state,
        undefined,
        { sensitivity: "base" }
      );
    }

    // 2. Then by act
if (a.act !== b.act) {
  return a.act.localeCompare(
    b.act,
    undefined,
    { sensitivity: "base" }
  );
}

    // 3. Then by section (numeric-safe)
    return (a.section || "").localeCompare(b.section || "", undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });
}, [checklists, search, statusFilter, stateFilter]);

const [debouncedSearch, setDebouncedSearch] = useState(search);

useEffect(() => {
  const t = setTimeout(() => {
    setDebouncedSearch(search);
  }, 300);

  return () => clearTimeout(t);
}, [search]);

  /* =========================
     EXPORT EXCEL
  ========================= */
  const exportExcel = () => {
const data = filteredChecklists.map(c => ({
  State: c.state,
  Act: c.act,
  "Audit Particulars": c.audit_particulars,
  Section: c.section,
  "Form Number": c.form_number,
  Document: c.document,
  "Guidelines for Auditor": c.auditor_guide,
  Status: c.is_active ? "Active" : "Inactive",
}));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Audit Checklist");

    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buffer]), "audit_checklist.xlsx");
  };

  /* =========================
     EXPORT PDF
  ========================= */
  const exportPDF = () => {
    const doc = new jsPDF("l", "pt", "a4");
    doc.text("Audit Checklist Master", 40, 30);

    autoTable(doc, {
      startY: 50,
      head: [[
"State","Act","Compliance","Section","Document","Auditor Guide","Status"
      ]],
      body: filteredChecklists.map(c => [
        c.state,
        c.act,
        c.section,
        c.document,
        c.auditor_guide || "",
        c.is_active ? "Active" : "Inactive",
      ]),
      styles: { fontSize: 8, cellPadding: 6, valign: "top" },
      columnStyles: { 6: { cellWidth: 260 } },
    });

    doc.save("audit_checklist.pdf");
  };

  /* =========================
     RENDER
  ========================= */
 return (
  <div>
    <PageMeta title="Audit Checklist | HR Compliance" />
    <PageBreadcrumb pageTitle="Manage Audit Checklist" />

<ComponentCard title="Create Audit Checklist">
  <form onSubmit={handleSubmit} className="space-y-6">

    {/* FORM GRID */}
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

      {/* STATE */}
{/* STATE (SEARCHABLE) */}
<div className="space-y-1 relative" ref={stateRef}>
  <Label>State</Label>

  {/* SELECT BOX */}
  <div
    className="w-full h-11 rounded-lg border border-gray-200 px-4 flex items-center cursor-pointer bg-white"
    onClick={() => setStateDropdownOpen(!stateDropdownOpen)}
  >
    {states.find((s) => s.id === Number(formData.state))?.name ||
      "Select State"}
  </div>

  {/* DROPDOWN */}
  {stateDropdownOpen && (
    <div className="absolute left-0 right-0 z-50 bg-white border rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto">

      {/* SEARCH */}
    <input
      placeholder="Search state..."
      value={stateSearch}
      onChange={(e) => setStateSearch(e.target.value)}
      className="w-full h-10 px-3 text-sm rounded-t-lg border-b border-gray-200 outline-none"
    />

      {/* LIST */}
      {filteredStates.map((s) => (
        <div
          key={s.id}
          onClick={() => {
            setFormData({ ...formData, state: s.id });
            setStateDropdownOpen(false);
            setStateSearch("");
          }}
          className={`px-3 py-2 text-sm cursor-pointer ${
            formData.state == s.id
              ? "bg-blue-100 font-medium"
              : "hover:bg-gray-100"
          }`}
        >
          {s.name}
        </div>
      ))}

      {/* EMPTY */}
      {filteredStates.length === 0 && (
        <div className="px-3 py-2 text-sm text-gray-500">
          No states found
        </div>
      )}
    </div>
  )}

  {/* SELECTED STATE */}
  {formData.state && (
    <div className="text-xs text-green-700 mt-2">
      Selected: {
        states.find((s) => s.id === Number(formData.state))?.name
      }
    </div>
  )}
</div>

{/* ACT */}
<div className="space-y-1 relative" ref={actRef}>
  <Label>Act</Label>

  <div className="flex gap-2 items-start">

    {/* DROPDOWN */}
    <div className="relative w-full">
      <div
        className="w-full h-11 rounded-lg border border-gray-200 px-4 flex items-center cursor-pointer bg-white"
        onClick={() => setActDropdownOpen(!actDropdownOpen)}
      >
        {acts.find((a) => a.id === Number(formData.act))?.name ||
          "Select Act"}
      </div>

      {actDropdownOpen && (
        <div className="absolute left-0 right-0 z-50 bg-white border rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto">

          {/* SEARCH */}
          <input
            placeholder="Search act..."
            value={actSearch}
            onChange={(e) => setActSearch(e.target.value)}
            className="w-full h-10 px-3 text-sm rounded-t-lg border-b border-gray-200 outline-none"
          />

          {/* LIST */}
          {filteredActs.map((a) => (
            <div
              key={a.id}
              onClick={() => {
                setFormData({ ...formData, act: a.id });
                setActDropdownOpen(false);
                setActSearch("");
              }}
              className={`px-3 py-2 text-sm cursor-pointer ${
                formData.act == a.id
                  ? "bg-blue-100 font-medium"
                  : "hover:bg-gray-100"
              }`}
            >
              {a.name}
            </div>
          ))}

          {filteredActs.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-500">
              No acts found
            </div>
          )}
        </div>
      )}
    </div>

    {/* ADD BUTTON */}
    <Button
      type="button"
      onClick={() => setShowActModal(true)}
      className="h-11 px-4 whitespace-nowrap shrink-0"
    >
      + Add
    </Button>
  </div>

  {/* SELECTED */}
  {formData.act && (
    <div className="text-xs text-green-700 mt-2">
      Selected: {
        acts.find((a) => a.id === Number(formData.act))?.name
      }
    </div>
  )}
</div>

  {/* AUDIT PARTICULARS */}
<div className="space-y-1">
  <Label>Audit Particulars</Label>
  <Input
    value={formData.audit_particulars}
    onChange={(e) =>
      setFormData({ ...formData, audit_particulars: e.target.value })
    }
    placeholder="Enter audit particulars"
    className="h-11"
  />
</div>

      {/* SECTION */}
<div className="space-y-1">
  <Label>Section / Clause</Label>

  <Input
    value={formData.section}
    onChange={(e) =>
      setFormData({ ...formData, section: e.target.value })
    }
    placeholder="Enter section (e.g. 370, 12A)"
    className="h-11"
  />

  {formData.section && (
    <div className="text-xs text-green-700 mt-2">
      Entered: {formData.section}
    </div>
  )}
</div>

{/* FORM NUMBER */}
<div className="space-y-1">
  <Label>Form Number</Label>
  <Input
    value={formData.form_number}
    onChange={(e) =>
      setFormData({ ...formData, form_number: e.target.value })
    }
    placeholder="Enter form number (e.g. Form II)"
    className="h-11"
  />
</div>


      {/* DOCUMENT */}
<div className="space-y-1 relative" ref={docRef}>
  <Label>Document</Label>

  <div
    className="w-full h-11 rounded-lg border border-gray-200 px-4 flex items-center cursor-pointer bg-white"
    onClick={() => setDocDropdownOpen(!docDropdownOpen)}
  >
    {documents.find((d) => d.id === Number(formData.document))?.name ||
      "Select Document"}
  </div>

  {docDropdownOpen && (
    <div className="absolute left-0 right-0 z-50 bg-white border rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto">
      <input
        placeholder="Search document..."
        value={documentSearch}
        onChange={(e) => setDocumentSearch(e.target.value)}
        className="w-full h-10 px-3 text-sm rounded-t-lg border-b border-gray-200 outline-none focus:ring-2 focus:ring-blue-100"
      />

      {filteredDocuments.map((doc) => (
        <div
          key={doc.id}
          onClick={() => {
            setFormData({ ...formData, document: doc.id });
            setDocDropdownOpen(false);
            setDocumentSearch("");
          }}
          className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
        >
          {doc.name}
        </div>
      ))}
    </div>
  )}

  {/* ✅ SELECTED DOCUMENT */}
  {formData.document && (
    <div className="text-xs text-green-700 mt-2">
      Selected: {
        documents.find((d) => d.id === Number(formData.document))?.name
      }
    </div>
  )}
</div>


    </div>

    {/* AUDITOR GUIDE */}
<div className="space-y-2">
  <Label>Guidelines for Auditor</Label>

  {/* TEXTAREA */}
  <textarea
    rows={3}
    value={checkpointInput}
    onChange={(e) => setCheckpointInput(e.target.value)}
    onKeyDown={(e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault(); // 🚫 stop newline
        handleAddCheckpoint(); // ✅ add point
      }
    }}
    placeholder="Enter checklist point..."
    className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-blue-100 outline-none"
  />

  {/* CHECKLIST LIST */}
  {checkpoints.length > 0 && (
    <ul className="list-disc pl-5 mt-3 space-y-2">
      {checkpoints.map((item) => (
        <li
          key={item.id}
          className="flex items-start justify-between gap-3 text-sm text-gray-700"
        >
          {/* TEXT */}
          <span className="leading-relaxed">{item.text}</span>

          {/* CLEAN REMOVE BUTTON */}
          <button
            onClick={() => handleDeleteCheckpoint(item.id)}
            className="text-red-400 hover:text-red-600 transition text-xs"
          >
            ✕
          </button>
        </li>
      ))}
    </ul>
  )}
</div>

    {/* ACTIONS */}
    <div className="flex justify-end gap-3 border-t pt-5">
      <Button
        variant="outline"
        className="h-10"
        onClick={() => {
          setFormData({
            state: "",
            act: "",
            compliance_nature: "",
            section: "",
            document: "",
            audit_particulars: "",
            form_number: "",
          });

          setCheckpoints([]);        // ✅ clear added points
          setCheckpointInput("");    // ✅ clear textarea
        }}
      >
        Reset
      </Button>

      <Button type="submit" className="h-10">
        Save Checklist
      </Button>
    </div>

  </form>
</ComponentCard>

    {/* ADD ACT MODAL */}
    {showActModal && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-xl w-96 space-y-4">

          <h2 className="text-lg font-semibold">Add Act</h2>

          <input
            placeholder="Enter Act Name"
            value={newActName}
            onChange={(e) => setNewActName(e.target.value)}
            className="w-full h-11 border rounded-lg px-3"
          />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowActModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAct}>
              Save
            </Button>
          </div>

        </div>
      </div>
    )}

    {/* TABLE (UNCHANGED) */}
<ComponentCard title="Audit Checklist Master" className="mt-8">

  {/* 🔹 HEADER / FILTER BAR */}
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">

    {/* SEARCH */}
    <input
      placeholder="Search checklist..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="h-10 w-full md:w-72 rounded-lg border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
    />

    {/* FILTERS + ACTIONS */}
    <div className="flex flex-wrap items-center gap-2">

  {/* ✅ STATE FILTER (ADD HERE) */}
  <select
    value={stateFilter}
    onChange={(e) => setStateFilter(e.target.value)}
    className="h-10 rounded-lg border border-gray-200 px-3 text-sm"
  >
    <option value="">All States</option>
    {[...states]
    .sort((a, b) =>
      (a.name || "").localeCompare(
        b.name || "",
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

  {/* EXISTING BUTTONS */}
  <Button
    variant="outline"
    size="sm"
    onClick={exportExcel}
    disabled={!filteredChecklists.length}
  >
    Export Excel
  </Button>

  <Button
    variant="outline"
    size="sm"
    onClick={deleteSelected}
    disabled={!selectedIds.length}
  >
    Delete Selected
  </Button>

  <Button
    variant="outline"
    size="sm"
    onClick={exportPDF}
    disabled={!filteredChecklists.length}
  >
    Export PDF
  </Button>
</div>
  </div>

  {/* 🔹 TABLE */}
<div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
  <table className="min-w-[1500px] w-full text-sm">

    {/* HEADER */}
    <thead className="bg-gray-50 sticky top-0 z-10">
      <tr>

        {/* ✅ SELECT ALL CHECKBOX */}
        <th className="px-3 py-3">
          <input
            type="checkbox"
            checked={
              selectedIds.length === filteredChecklists.length &&
              filteredChecklists.length > 0
            }
            onChange={toggleSelectAll}
          />
        </th>

        {[
          "State",
          "Act",
          "Audit Particulars",
          "Section",
          "Form Number",
          "Document",
          "Guidelines for Auditor",
          "Actions",
        ].map((h) => (
          <th
            key={h}
            className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase text-left"
          >
            {h}
          </th>
        ))}
      </tr>
    </thead>

    {/* BODY */}
    <tbody>

      {/* 🔄 LOADING */}
      {loading && (
        <tr>
          <td colSpan={9} className="py-12 text-center text-gray-500">
            Loading checklist...
          </td>
        </tr>
      )}

      {/* 📭 EMPTY */}
      {!loading && filteredChecklists.length === 0 && (
        <tr>
          <td colSpan={9} className="py-12 text-center text-gray-500">
            No checklist found
          </td>
        </tr>
      )}

      {/* 📄 DATA */}
      {/* 📄 DATA */}
{!loading && (() => {
  const groupedData = Object.values(
    filteredChecklists.reduce((acc, item) => {
      const key = `${item.state}-${item.act}-${item.section}-${item.document}-${item.audit_particulars}`;
      if (!acc[key]) {
        acc[key] = {
          ...item,
          auditor_guide: Array.isArray(item.auditor_guide)
          ? item.auditor_guide
          : [item.auditor_guide],
        };
      } else {
          if (Array.isArray(item.auditor_guide)) {
            acc[key].auditor_guide.push(...item.auditor_guide);
          } else {
            acc[key].auditor_guide.push(item.auditor_guide);
          }
      }

      return acc;
    }, {})
  );

  return groupedData.map((c, idx) => (
    <tr
      key={c.id}
      className={`border-t transition ${
        idx % 2 === 0 ? "bg-white" : "bg-gray-50/40"
      } hover:bg-blue-50/30`}
    >

      <td className="px-3 py-4">
        <input
          type="checkbox"
          checked={selectedIds.includes(c.id)}
          onChange={() => toggleSelect(c.id)}
        />
      </td>

      <td className="px-5 py-4">{c.state}</td>
      <td className="px-5 py-4">{c.act}</td>

      <td className="px-5 py-4">
        {editingId === c.id ? (
          <Input
            value={editData.audit_particulars}
            onChange={(e) =>
              setEditData({ ...editData, audit_particulars: e.target.value })
            }
          />
        ) : (
          c.audit_particulars || "-"
        )}
      </td>

      <td className="px-5 py-4">
        {editingId === c.id ? (
          <Input
            value={editData.section}
            onChange={(e) =>
              setEditData({ ...editData, section: e.target.value })
            }
          />
        ) : (
          c.section
        )}
      </td>

      <td className="px-5 py-4">
        {editingId === c.id ? (
          <Input
            value={editData.form_number}
            onChange={(e) =>
              setEditData({ ...editData, form_number: e.target.value })
            }
          />
        ) : (
          c.form_number || "-"
        )}
      </td>

      <td className="px-5 py-4">{c.document}</td>

      {/* ✅ GROUPED GUIDELINES */}
      <td className="px-5 py-4 max-w-[420px]">
        {editingId === c.id ? (
          <textarea
            value={editData.auditor_guide}
            onChange={(e) =>
              setEditData({ ...editData, auditor_guide: e.target.value })
            }
            className="w-full border rounded px-2 py-1"
          />
        ) : (
          <div className="whitespace-pre-line">
            {c.auditor_guide.map((point, i) => (
            <div key={i}>
              <span className="font-bold mr-1">•</span>
              {point}
            </div>            
          ))}
          </div>
        )}
      </td>

      <td className="px-5 py-4 space-x-2">
        {editingId === c.id ? (
          <>
            <Button size="sm" onClick={() => saveEdit(c.id)}>
              Save
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditingId(null);
                setEditData({
                  audit_particulars: "",
                  form_number: "",
                  auditor_guide: "",
                  section: "",
                });
              }}
            >
              Cancel
            </Button>
          </>
        ) : (
          <Button size="sm" onClick={() => startEdit(c)}>
            Edit
          </Button>
        )}
      </td>

    </tr>
  ));
})()}
    </tbody>
  </table>
</div>
</ComponentCard>
  </div>
);
}