import { useEffect, useMemo, useState } from "react";
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
  /* =========================
     MASTER DATA
  ========================= */
  const [states, setStates] = useState([]);
  const [acts, setActs] = useState([]);
  const [complianceNatures, setComplianceNatures] = useState([]);
  const [sections, setSections] = useState([]);
  const [rules, setRules] = useState([]);
  const [documents, setDocuments] = useState([]);

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
    fetch(`${API_BASE}/checklist/states/`).then(r => r.json()).then(setStates);
    fetch(`${API_BASE}/checklist/compliance-natures/`).then(r => r.json()).then(setComplianceNatures);
    fetch(`${API_BASE}/document-master/list/`).then(r => r.json()).then(setDocuments);
    fetchList();
  }, []);

  const fetchList = () => {
    setLoading(true);
    fetch(`${API_BASE}/checklist/list/`)
      .then(r => r.json())
      .then(res => {
        setChecklists(res);
        setLoading(false);
      });
  };

  /* =========================
     DEPENDENT DROPDOWNS
  ========================= */
  useEffect(() => {
    if (!formData.state) return;

    fetch(`${API_BASE}/checklist/acts/?state=${formData.state}`)
      .then(r => r.json())
      .then(setActs);

    setFormData(p => ({ ...p, act: "", section: "", rule: "" }));
    setSections([]);
    setRules([]);
  }, [formData.state]);

  useEffect(() => {
    if (!formData.act) return;

    fetch(`${API_BASE}/checklist/sections/?act=${formData.act}`)
      .then(r => r.json())
      .then(setSections);

    setFormData(p => ({ ...p, section: "", rule: "" }));
    setRules([]);
  }, [formData.act]);

  useEffect(() => {
    if (!formData.section) return;

    fetch(`${API_BASE}/checklist/rules/?section=${formData.section}`)
      .then(r => r.json())
      .then(setRules);

    setFormData(p => ({ ...p, rule: "" }));
  }, [formData.section]);

  /* =========================
     CREATE CHECKLIST
  ========================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch(`${API_BASE}/checklist/create/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ auditor_guide: editGuide }),
    });

    setEditingId(null);
    fetchList();
  };

  const toggleStatus = async (id) => {
    await fetch(`${API_BASE}/checklist/${id}/toggle-status/`, { method: "POST" });
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

      {/* FORM */}
      <ComponentCard title="Create Audit Checklist">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              ["State","state",states,"name"],
              ["Act","act",acts,"name"],
              ["Nature of Compliance","compliance_nature",complianceNatures,"name"],
              ["Section","section",sections,"section_number"],
              ["Rule","rule",rules,"rule_number"],
              ["Document","document",documents,"name"],
            ].map(([label,name,data,key]) => (
              <div key={name}>
                <Label>{label}</Label>
                <select
                  value={formData[name]}
                  onChange={e => setFormData({ ...formData, [name]: e.target.value })}
                  className="w-full h-12 rounded-lg border border-gray-200/70 px-4 bg-white transition"
                  required
                >
                  <option value="">Select {label}</option>
                  {data.map(d => (
                    <option key={d.id} value={d.id}>{d[key]}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div>
            <Label>Auditor Guide / Checkpoints</Label>
            <textarea
              rows={5}
              value={formData.auditor_guide}
              onChange={e => setFormData({ ...formData, auditor_guide: e.target.value })}
              className="w-full rounded-lg border border-gray-200/70 px-4 py-3 transition"
            />
          </div>

          <div className="flex justify-end border-t pt-6 h-16">
            <Button>Save Checklist</Button>
          </div>
        </form>
      </ComponentCard>

      {/* TABLE */}
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
                <tr><td colSpan={9} className="py-10 text-center text-gray-500">Loading…</td></tr>
              ) : filteredChecklists.map(c => (
                <tr key={c.id} className="border-t hover:bg-gray-50 transition">
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
