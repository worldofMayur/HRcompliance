import { useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";
import Input from "../../components/form/input/InputField";
import api from "../../utils/api";

import { Checkbox } from "antd";

import {
  Table,
  TableHeader,
  TableRow,
  TableCell,
  TableBody,
} from "../../components/ui/table";

/* =========================
   CONSTANTS
========================= */
const API_URL = "http://127.0.0.1:8000/api/document-master";
const PAGE_SIZE = 8;

/* =========================
   COMPONENT
========================= */
export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [frequencyFilter, setFrequencyFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [peList, setPeList] = useState([]);

  const [selectedIds, setSelectedIds] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [editDoc, setEditDoc] = useState(null);
  const [companyFilter, setCompanyFilter] = useState("all");

  const [formData, setFormData] = useState({
    name: "",
    frequency: "monthly",
    principal_employer: "",
  });

  /* =========================
     FETCH DOCUMENTS
  ========================= */
  const fetchDocuments = async () => {

    setLoading(true);

    try {

      const res = await api.get(
        "/api/document-master/list/"
      );

      setDocuments(
        Array.isArray(res.data)
          ? res.data
          : []
      );

    } catch (err) {

      console.error(
        "Error loading documents:",
        err
      );

      setDocuments([]);

    } finally {

      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchPEs();
  }, []);

  const fetchPEs = async () => {

    try {

      const res = await api.get(
        "/api/document-master/pe-dropdown/"
      );

      setPeList(
        Array.isArray(res.data)
          ? res.data
          : []
      );

    } catch (err) {

      console.error(
        "Error loading PE list",
        err
      );

      setPeList([]);
    }
  };

  /* =========================
     FILTER + SEARCH
  ========================= */
const filteredDocs = useMemo(() => {
  const searchText = search.trim().toLowerCase();

    if (!Array.isArray(documents)) {
      return [];
    }

    return documents.filter((d) => {
    const matchesFrequency =
    frequencyFilter === "all" || d.frequency === frequencyFilter;

  const matchesCompany =
    companyFilter === "all" ||
    (companyFilter === "common" && !d.principal_employer_name) ||
    d.principal_employer_name === companyFilter;

  const matchesSearch =
    d.name?.toLowerCase().includes(searchText) ||
    d.principal_employer_name?.toLowerCase().includes(searchText);

  return matchesFrequency && matchesSearch && matchesCompany;
});
}, [documents, frequencyFilter, search, companyFilter]);
  /* =========================
     PAGINATION
  ========================= */
  const totalPages = Math.ceil(filteredDocs.length / PAGE_SIZE);

  const paginatedDocs = filteredDocs.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  /* =========================
     SELECTION
  ========================= */
  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    setSelectedIds(
      selectedIds.length === paginatedDocs.length
        ? []
        : paginatedDocs.map((d) => d.id)
    );
  };

  /* =========================
     CRUD HANDLERS
  ========================= */
  const openAdd = () => {
    setEditDoc(null);

    setFormData({
      name: "",
      frequency: "monthly",
      principal_employer: "",
    });

    setShowForm(true);
  };

  const openEdit = (doc) => {
    setEditDoc(doc);
    setFormData({
      name: doc.name,
      frequency: doc.frequency,
      principal_employer: doc.principal_employer || "",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert("Document name is required");
      return;
    }

    try {

      if (editDoc) {

        await api.put(
          `/api/document-master/${editDoc.id}/update/`,
          formData
        );

      } else {

        await api.post(
          "/api/document-master/create/",
          formData
        );
      }

    } catch (error: any) {

      console.error(
        error.response?.data
      );

      alert(
        error.response?.data?.detail ||
        error.response?.data?.error ||
        "Operation failed"
      );

      return;
    }

    setShowForm(false);
    fetchDocuments();
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this document?")) return;
      await api.delete(
        `/api/document-master/${id}/delete/`
      );
    fetchDocuments();
  };

  const handleExport = () => {
  if (!filteredDocs.length) {
    alert("No data to export");
    return;
  }

  const rows = [
    ["Document Name", "Company", "Frequency"],
...filteredDocs.map((d) => [
  `"${d.name}"`,
  `"${d.principal_employer_name || "Common"}"`,
  `"${d.frequency}"`,
]),
  ];

  const csvContent =
    "data:text/csv;charset=utf-8," +
    rows.map((e) => e.join(",")).join("\n");

  const link = document.createElement("a");
  link.href = encodeURI(csvContent);
  link.download = "documents.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;

    if (!confirm("Delete selected documents?")) return;

    try {
      const res = await api.post(
        "/api/document-master/bulk-delete/",
        {
          ids: selectedIds,
        }
      );

      const data = res.data;

      // ✅ handle partial delete
      alert(data.message || "Deleted successfully");

      setSelectedIds([]);
      fetchDocuments();
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  /* =========================
     RENDER
  ========================= */
  return (
    <div>
      <PageMeta title="Documents | HR Compliance" />
      <PageBreadcrumb pageTitle="Manage Documents" />

      <ComponentCard title="Document Master">
        {/* HEADER / TOOLBAR */}
        <div className="mb-6 flex items-end justify-between border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Document Master
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage statutory & compliance document requirements
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Total Documents:{" "}
              <span className="font-medium text-gray-900">
                {filteredDocs.length}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Input
              placeholder="Search document..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-9 w-[240px]"
            />

            <select
className="h-10 rounded-lg border border-gray-300 bg-white px-4 pr-8 text-sm appearance-none"
            value={companyFilter}
            onChange={(e) => {
              setCompanyFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Companies</option>
            <option value="common">Common</option>

            {peList.map((pe) => (
              <option key={pe.id} value={pe.name}>
                {pe.name}
              </option>
            ))}
          </select>

            <select
className="h-10 rounded-lg border border-gray-300 bg-white px-4 pr-8 text-sm appearance-none"
              value={frequencyFilter}
              onChange={(e) => {
                setFrequencyFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Frequencies</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="half-yearly">Half-Yearly</option>
              <option value="annually">Annually</option>
              <option value="one_time">One Time</option>
            </select>

            <Button onClick={openAdd} className="h-9">+ Add Document</Button>

            <Button
              variant="outline"
              disabled={!selectedIds.length}
              onClick={handleBulkDelete}
              className="h-10"
            >
              Delete Selected
            </Button>

            <Button
              variant="outline"
              onClick={handleExport}
              disabled={!filteredDocs.length}
              className="h-10"
            >
              Export Excel
            </Button>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableCell isHeader className="w-12 px-4 text-center">
                  <Checkbox
                    checked={
                      selectedIds.length === paginatedDocs.length &&
                      paginatedDocs.length > 0
                    }
                    indeterminate={
                      selectedIds.length > 0 &&
                      selectedIds.length < paginatedDocs.length
                    }
                    onChange={toggleSelectAll}
                  />
                </TableCell>

              <TableCell isHeader className="px-8 py-4 text-left">
                DOCUMENT NAME
              </TableCell>

              <TableCell isHeader className="px-6 py-4 text-center">
                COMPANY NAME
              </TableCell>

              <TableCell isHeader className="px-6 py-4 text-center">
                FREQUENCY
              </TableCell>
                <TableCell isHeader className="px-6 py-4 text-center">
                  ACTIONS
                </TableCell>
              </TableRow>
            </TableHeader>

<TableBody>
  {/* 🔄 LOADING */}
  {(loading || processing) && (
    <TableRow>
      <TableCell colSpan={5} className="py-12 text-center">
        <div className="flex items-center justify-center gap-3 text-gray-500">
<div className="animate-pulse">Loading documents...</div>
        </div>
      </TableCell>
    </TableRow>
  )}

  {/* 📭 EMPTY STATE */}
  {!loading && !processing && paginatedDocs.length === 0 && (
    <TableRow>
      <TableCell colSpan={5} className="py-10 text-center text-gray-500">
        No documents found
      </TableCell>
    </TableRow>
  )}

  {/* 📄 DATA ROWS */}
  {!loading &&
    !processing &&
    paginatedDocs.map((d, idx) => (
      <TableRow
        key={d.id}
        className={`transition ${
          idx % 2 === 0 ? "bg-white" : "bg-gray-50/40"
        } hover:bg-blue-50/30`}
      >
        {/* ✅ CHECKBOX */}
        <TableCell className="w-12 px-4 text-center align-middle">
          <Checkbox
            checked={selectedIds.includes(d.id)}
            onChange={() => toggleSelect(d.id)}
          />
        </TableCell>

        {/* 📄 DOCUMENT NAME */}
        <TableCell className="px-8 py-6 align-middle">
          <div className="flex flex-col">
            <span className="font-medium text-gray-900">
              {d.name}
            </span>
            <span className="text-xs text-gray-400">
              Document Master
            </span>
          </div>
        </TableCell>

        {/* 🏢 COMPANY NAME (IMPROVED UI) */}
        <TableCell className="px-6 py-6 text-center align-middle">
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              d.principal_employer_name
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {d.principal_employer_name || "Common"}
          </span>
        </TableCell>

        {/* 🔁 FREQUENCY */}
        <TableCell className="px-6 py-6 text-center align-middle">
          <span className="inline-flex min-w-[90px] justify-center rounded-md bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
            {d.frequency?.replace("_", " ")}
          </span>
        </TableCell>

        {/* ⚙️ ACTIONS */}
        <TableCell className="px-6 py-6 text-center align-middle">
          <div className="inline-flex gap-2">
            <button
              onClick={() => openEdit(d)}
              className="rounded-md bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 hover:bg-blue-100"
            >
              Edit
            </button>
          </div>
        </TableCell>
      </TableRow>
    ))}
</TableBody>
          </Table>
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`h-9 w-9 rounded-md border text-sm font-medium ${
                  page === i + 1
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </ComponentCard>

      {/* ADD / EDIT MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-xl bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold">
              {editDoc ? "Edit Document" : "Add Document"}
            </h3>

            <div className="space-y-4">
              <Input
                label="Document Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, name: e.target.value }))
                }
              />

              <select
                className="w-full h-11 rounded-lg border px-3"
                value={formData.principal_employer}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    principal_employer: e.target.value,
                  }))
                }
              >
                <option value="">Common</option>

                {peList.map((pe) => (
                  <option key={pe.id} value={pe.id}>
                    {pe.name}
                  </option>
                ))}
              </select>

              <select
                className="w-full h-11 rounded-lg border px-3"
                value={formData.frequency}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    frequency: e.target.value,
                  }))
                }
              >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="half_yearly">Half Yearly</option>
              <option value="annually">Annually</option>
              <option value="one_time">One Time</option>
              </select>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editDoc ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}