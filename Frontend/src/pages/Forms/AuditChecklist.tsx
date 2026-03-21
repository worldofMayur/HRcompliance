import { useEffect, useMemo, useState, useRef } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import Label from "../../components/form/Label";
import Badge from "../../components/ui/badge/Badge";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const API_BASE = "http://127.0.0.1:8000/api";

export default function AuditChecklistForm() {

  const token = localStorage.getItem("access_token");

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  /* =========================
     MASTER DATA
  ========================= */
  const [states, setStates] = useState([]);
  const [acts, setActs] = useState([]);
  const [complianceNatures, setComplianceNatures] = useState([]);
  const [sections, setSections] = useState([]);
  const [rules, setRules] = useState([]);
  const [showActModal, setShowActModal] = useState(false);
const [newActName, setNewActName] = useState("");
  const [documents, setDocuments] = useState([]);

  const [documentSearch, setDocumentSearch] = useState("");
  const [docDropdownOpen, setDocDropdownOpen] = useState(false);
const docRef = useRef<HTMLDivElement | null>(null);
  /* =========================
     CHECKLIST DATA
  ========================= */
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);

  /* =========================
     INLINE EDIT
  ========================= */
  const [editingId, setEditingId] = useState(null);
  const [editGuide, setEditGuide] = useState("");

  /* =========================
     SEARCH & FILTERS
  ========================= */
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  /* =========================
     FORM STATE
  ========================= */
  const [formData, setFormData] = useState({
    state: "",
    act: "",
    compliance_nature: "",
    section: "",
    rule: "",
    document: "",
    auditor_guide: "",
  });

  /* =========================
     INITIAL LOAD
  ========================= */
  useEffect(() => {
    fetch(`${API_BASE}/checklist/states/`, { headers: authHeaders }).then(r => r.json()).then(setStates);
    fetch(`${API_BASE}/checklist/compliance-natures/`, { headers: authHeaders }).then(r => r.json()).then(setComplianceNatures);

    fetch(`${API_BASE}/document-master/list/`, { headers: authHeaders })
      .then(r => r.json())
      .then(res => setDocuments(Array.isArray(res) ? res : []));

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
    const res = await fetch(`${API_BASE}/checklist/acts/create/`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        name: newActName,
        state: formData.state,
      }),
    });

    if (!res.ok) {
      throw new Error("Failed to create act");
    }

    const data = await res.json();

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

  const fetchList = () => {
    setLoading(true);
    fetch(`${API_BASE}/checklist/list/`, { headers: authHeaders })
      .then(r => r.json())
      .then(res => {
        setChecklists(res);
        setLoading(false);
      });
  };

  /* =========================
     CLOSE DROPDOWN ON OUTSIDE CLICK
  ========================= */
  useEffect(() => {
    const handleClick = (e) => {
      if (docRef.current && !docRef.current.contains(e.target)) {
        setDocDropdownOpen(false);
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

    fetch(`${API_BASE}/checklist/acts/?state=${formData.state}`, { headers: authHeaders })
      .then(r => r.json())
      .then(setActs);

    setFormData(p => ({ ...p, act: "", section: "", rule: "" }));
    setSections([]);
    setRules([]);
  }, [formData.state]);

  useEffect(() => {
    if (!formData.act) return;

    fetch(`${API_BASE}/checklist/sections/?act=${formData.act}`, { headers: authHeaders })
      .then(r => r.json())
      .then(setSections);

    setFormData(p => ({ ...p, section: "", rule: "" }));
    setRules([]);
  }, [formData.act]);

  useEffect(() => {
    if (!formData.section) return;

    fetch(`${API_BASE}/checklist/rules/?section=${formData.section}`, { headers: authHeaders })
      .then(r => r.json())
      .then(setRules);

    setFormData(p => ({ ...p, rule: "" }));
  }, [formData.section]);

  /* =========================
     DOCUMENT SEARCH FILTER
  ========================= */
  const filteredDocuments = useMemo(() => {
    if (!documentSearch) return documents;

    return (Array.isArray(documents) ? documents : []).filter(d =>
      d.name.toLowerCase().includes(documentSearch.toLowerCase())
    );
  }, [documents, documentSearch]);

  /* =========================
     CREATE CHECKLIST
  ========================= */
const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

    const res = await fetch(`${API_BASE}/checklist/create/`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify(formData),
    });

    if (!res.ok) {
      alert("Failed to create checklist");
      return;
    }

    setFormData({
      state: "",
      act: "",
      compliance_nature: "",
      section: "",
      rule: "",
      document: "",
      auditor_guide: "",
    });

    fetchList();
  };

  /* =========================
     INLINE EDIT
  ========================= */
  const startEdit = (row) => {
    setEditingId(row.id);
    setEditGuide(row.auditor_guide || "");
  };

  const saveEdit = async (id) => {
    await fetch(`${API_BASE}/checklist/${id}/update/`, {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify({ auditor_guide: editGuide }),
    });

    setEditingId(null);
    fetchList();
  };

  const toggleStatus = async (id) => {
    await fetch(`${API_BASE}/checklist/${id}/toggle-status/`, {
      method: "POST",
      headers: authHeaders
    });
    fetchList();
  };

  /* =========================
     FILTERED TABLE DATA
  ========================= */
  const filteredChecklists = useMemo(() => {
    return checklists.filter(c => {
      const text =
        `${c.state} ${c.act} ${c.document} ${c.auditor_guide}`.toLowerCase();

      if (search && !text.includes(search.toLowerCase())) return false;
      if (statusFilter === "active" && !c.is_active) return false;
      if (statusFilter === "inactive" && c.is_active) return false;

      return true;
    });
  }, [checklists, search, statusFilter]);

  /* =========================
     EXPORT EXCEL
  ========================= */
  const exportExcel = () => {
    const data = filteredChecklists.map(c => ({
      State: c.state,
      Act: c.act,
      Compliance: c.compliance_nature,
      Section: c.section,
      Rule: c.rule,
      Document: c.document,
      "Auditor Guide": c.auditor_guide,
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
        "State","Act","Compliance","Section","Rule","Document","Auditor Guide","Status"
      ]],
      body: filteredChecklists.map(c => [
        c.state,
        c.act,
        c.compliance_nature,
        c.section,
        c.rule,
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
      <form onSubmit={handleSubmit} className="space-y-8">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">          {/* STATE */}
          <div>
            <Label>State</Label>
<select
  value={formData.state}
  onChange={e => setFormData({ ...formData, state: e.target.value })}
  className="w-full h-12 rounded-lg border border-gray-200/70 px-4 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
  required
>
  <option value="">Select State</option>
  {states.map(s => (
    <option key={s.id} value={s.id}>
      {s.name}
    </option>
  ))}
</select>
          </div>

          {/* ACT + ADD BUTTON */}
          <div>
            <Label>Act</Label>
            <div className="flex gap-2">
              <select
                value={formData.act}
                onChange={e => setFormData({ ...formData, act: e.target.value })}
                className="w-full h-12 rounded-lg border border-gray-200/70 px-4 bg-white"
                required
              >
                <option value="">Select Act</option>
                {acts.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>

              <Button
                type="button"
                onClick={() => setShowActModal(true)}
              >
                + Add
              </Button>
            </div>
          </div>

          {/* COMPLIANCE */}
<div>
  <Label>Nature of Compliance</Label>
  <input
    value={formData.compliance_nature}
    onChange={e =>
      setFormData({ ...formData, compliance_nature: e.target.value })
    }
    className="w-full h-12 rounded-lg border border-gray-200/70 px-4"
    placeholder="Enter compliance nature"
    required
  />
</div>

          {/* SECTION INPUT */}
          <div>
            <Label>Section/ Rule</Label>
            <input
              value={formData.section}
              onChange={e => setFormData({ ...formData, section: e.target.value })}
              className="w-full h-12 rounded-lg border border-gray-200/70 px-4"
              placeholder="Enter Section"
              required
            />
          </div>

          {/* RULE DROPDOWN */}
          <div>
            <Label>Jurisdiction</Label>
            <select
              value={formData.rule}
              onChange={e => setFormData({ ...formData, rule: e.target.value })}
              className="w-full h-12 rounded-lg border border-gray-200/70 px-4 bg-white"
              required
            >
              <option value="">Select</option>
              <option value="STATE">State</option>
              <option value="CENTRAL">Central</option>
            </select>
          </div>

          {/* DOCUMENT DROPDOWN */}
          <div ref={docRef} className="relative">
            <Label>Document</Label>

            <div
              className="w-full h-12 rounded-lg border border-gray-200/70 px-4 flex items-center cursor-pointer bg-white"
              onClick={() => setDocDropdownOpen(!docDropdownOpen)}
            >
              {documents.find(d => d.id == formData.document)?.name || "Select Document"}
            </div>

            {docDropdownOpen && (
              <div className="absolute left-0 right-0 z-50 bg-white border border-gray-200 rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto">

                <input
                  placeholder="Search document..."
                  value={documentSearch}
                  onChange={(e) => setDocumentSearch(e.target.value)}
                  className="w-full px-3 py-2 border-b border-gray-200 outline-none text-sm"
                />

                {filteredDocuments.map(doc => (
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
          </div>

        </div>

        {/* AUDITOR GUIDE */}
        <div>
          <Label>Auditor Guide / Checkpoints</Label>
          <textarea
            rows={5}
            value={formData.auditor_guide}
            onChange={e => setFormData({ ...formData, auditor_guide: e.target.value })}
            className="w-full rounded-lg border border-gray-200/70 px-4 py-3"
          />
        </div>

        <div className="flex justify-end border-t pt-6 h-16">
          <Button>Save Checklist</Button>
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

      <div className="flex justify-between items-center mb-4 gap-3">
        <input
          placeholder="Search checklist..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-10 w-64 rounded-lg border border-gray-200 px-4 text-sm"
        />

        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="h-10 rounded-lg border px-3 text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <Button variant="outline" size="sm" onClick={exportExcel}>
            Export Excel
          </Button>
          <Button variant="outline" size="sm" onClick={exportPDF}>
            Export PDF
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="min-w-[1800px] w-full">
          <thead className="bg-gray-50">
            <tr>
              {["State","Act","Compliance","Section","Rule","Document","Auditor Guide","Status","Actions"]
                .map(h => (
                  <th key={h} className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                    {h}
                  </th>
                ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="py-10 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : filteredChecklists.map(c => (
              <tr key={c.id} className="border-t hover:bg-gray-50">
                <td className="px-5 py-4">{c.state}</td>
                <td className="px-5 py-4">{c.act}</td>
                <td className="px-5 py-4">{c.compliance_nature}</td>
                <td className="px-5 py-4">{c.section}</td>
                <td className="px-5 py-4">{c.rule}</td>
                <td className="px-5 py-4">{c.document}</td>
                <td className="px-5 py-4 max-w-[450px]">{c.auditor_guide}</td>
                <td className="px-5 py-4">
                  <Badge color={c.is_active ? "success" : "warning"}>
                    {c.is_active ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="px-5 py-4">
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => startEdit(c)}>Edit</Button>
                    <Button size="sm" variant="outline" onClick={() => toggleStatus(c.id)}>
                      {c.is_active ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </ComponentCard>
  </div>
);
}