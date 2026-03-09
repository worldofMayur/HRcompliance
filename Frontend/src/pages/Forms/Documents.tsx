import { useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";
import Input from "../../components/form/input/InputField";

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

const token = localStorage.getItem("access_token");

const authHeaders = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
};

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
      const res = await fetch(`${API_URL}/list/`, {
        headers: authHeaders,
      });
      const data = await res.json();
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading documents:", err);
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
      const res = await fetch(
        "http://127.0.0.1:8000/api/document-master/pe-dropdown/",
        {
          headers: authHeaders,
        }
      );
      const data = await res.json();
      setPeList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading PE list", err);
    }
  };

  /* =========================
     FILTER + SEARCH
  ========================= */
  const filteredDocs = useMemo(() => {
    setProcessing(true);

    const result = (Array.isArray(documents) ? documents : []).filter((d) => {
      const matchesFrequency =
        frequencyFilter === "all" || d.frequency === frequencyFilter;

      const matchesSearch = d.name
        .toLowerCase()
        .includes(search.toLowerCase());

      return matchesFrequency && matchesSearch;
    });

    setTimeout(() => setProcessing(false), 300);
    return result;
  }, [documents, frequencyFilter, search]);

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

    const url = editDoc
      ? `${API_URL}/${editDoc.id}/update/`
      : `${API_URL}/create/`;

    const method = editDoc ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: authHeaders,
      body: JSON.stringify(formData),
    });

    if (!res.ok) {
      alert("Operation failed");
      return;
    }

    setShowForm(false);
    fetchDocuments();
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this document?")) return;
    await fetch(`${API_URL}/${id}/delete/`, {
      method: "DELETE",
      headers: authHeaders,
    });
    fetchDocuments();
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!confirm("Delete selected documents?")) return;

    await Promise.all(
      selectedIds.map((id) =>
        fetch(`${API_URL}/${id}/delete/`, {
          method: "DELETE",
          headers: authHeaders,
        })
      )
    );

    setSelectedIds([]);
    fetchDocuments();
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
              className="h-10 rounded-lg border border-gray-300 bg-white px-4 text-sm"
              value={frequencyFilter}
              onChange={(e) => {
                setFrequencyFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Frequencies</option>
              <option value="monthly">Monthly</option>
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
                  FREQUENCY
                </TableCell>
                <TableCell isHeader className="px-6 py-4 text-center">
                  ACTIONS
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody>
              {(loading || processing) && (
                <TableRow>
                  <TableCell colSpan={4} className="py-12 text-center">
                    <div className="flex items-center justify-center gap-3 text-gray-500">
                      Loading…
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {!loading &&
                !processing &&
                paginatedDocs.map((d, idx) => (
                  <TableRow
                    key={d.id}
                    className={`transition ${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50/40"
                    } hover:bg-blue-50/30`}
                  >
                    <TableCell className="w-12 px-4 text-center align-middle">
                      <Checkbox
                        checked={selectedIds.includes(d.id)}
                        onChange={() => toggleSelect(d.id)}
                      />
                    </TableCell>

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

                    <TableCell className="px-6 py-6 text-center align-middle">
                      <span className="inline-flex min-w-[90px] justify-center rounded-md bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
                        {d.frequency.replace("_", " ")}
                      </span>
                    </TableCell>

                    <TableCell className="px-6 py-6 text-center align-middle">
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => openEdit(d)}
                          className="rounded-md bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 hover:bg-blue-100"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(d.id)}
                          className="rounded-md bg-red-50 px-3 py-1 text-sm font-medium text-red-700 hover:bg-red-100"
                        >
                          Delete
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