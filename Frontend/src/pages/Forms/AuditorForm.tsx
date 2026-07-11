import { useState, useEffect } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";

import Input from "../../components/form/input/InputField";
import FileInput from "../../components/form/input/FileInput";
import Label from "../../components/form/Label";
import Button from "../../components/ui/button/Button";

import { Checkbox } from "antd";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import Badge from "../../components/ui/badge/Badge";
import api from "../../utils/api";

/* =========================
   CONSTANTS
========================= */

const emailRegex =
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const ALLOWED_TYPES = [
  "application/pdf",

  "application/msword",

  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

  "application/vnd.ms-excel",

  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

  "application/vnd.ms-powerpoint",

  "application/vnd.openxmlformats-officedocument.presentationml.presentation",

  "image/jpeg",

  "image/png",

  "application/zip",
  "application/x-zip-compressed",
];

  const dateInputClass =
    "w-full h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none";

  const formatDate = (dateString: string) => {
    if (!dateString) return "—";

    const [year, month, day] = dateString.split("-");

    return `${day}/${month}/${year.slice(-2)}`;
  };

  const formatForAPI = (date: Date) => {
    const year = date.getFullYear();
    const month = String(
      date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };


/* =========================
   COMPONENT
========================= */

export default function Auditor() {

  /* =========================
     FORM STATE
  ========================= */

  const [formData, setFormData] = useState({
    name: "",
    company: "",
    shortName: "",
    hoAddress: "",
    mobile: "",
    email: "",
    startDate: "",
    endDate: "",
  });

  const [documents, setDocuments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [startDateObj, setStartDateObj] = useState(null);
  const [endDateObj, setEndDateObj] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);

  /* =========================
     TABLE STATE
  ========================= */

  const [tableData, setTableData] = useState([]);
const filteredAuditors =
  Array.isArray(tableData)
    ? tableData
        .filter((a) => {

          if (!search.trim()) return true;

          const searchText =
            search.trim().toLowerCase();

          return (
            a.name?.toLowerCase().includes(searchText) ||
            a.short_name?.toLowerCase().includes(searchText) ||
            a.company?.toLowerCase().includes(searchText) ||
            a.email?.toLowerCase().includes(searchText) ||
            a.mobile?.toString().includes(searchText)
          );

        })

        // ✅ Alphabetical Order
        .sort((a, b) =>
          (a.name || "").localeCompare(
            b.name || "",
            undefined,
            { sensitivity: "base" }
          )
        )

    : [];

  

  /* =========================
     FETCH AUDITORS
  ========================= */

  const fetchAuditors = async () => {

    try {

      const res = await api.get(
        "/api/auditor/list/"
      );

      setTableData(
        Array.isArray(res.data)
          ? res.data
          : []
      );

    } catch (error) {

      console.error(
        "Failed to fetch auditors",
        error
      );

      setTableData([]);

    }
  };

  useEffect(() => {
    fetchAuditors();
  }, []);

  /* =========================
     INPUT HANDLER
  ========================= */

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  /* =========================
     FILE HANDLERS
  ========================= */

  const handleFiles = (files) => {

    const valid = [];

    for (const file of Array.from(files)) {

      if (!ALLOWED_TYPES.includes(file.type)) {
        alert(`Unsupported file: ${file.name}`);
        return;
      }

      if (documents.some((d) => d.name === file.name)) {
        alert(`Already added: ${file.name}`);
        return;
      }

      valid.push(file);
    }

    setDocuments((p) => [...p, ...valid]);
  };

  const removeFile = (name) =>
    setDocuments((p) => p.filter((f) => f.name !== name));

  /* =========================
     CREATE / UPDATE
  ========================= */

  const handleSubmit = async () => {

    if (Object.values(formData).some((v) => !v)) {
      alert("All fields are required");
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      alert("Start date cannot be after end date");
      return;
    }

    setSubmitting(true);

    try {

      if (editingId) {

        const payload = new FormData();

        payload.append("name", formData.name);
        payload.append("company", formData.company);
        payload.append("short_name", formData.shortName);
        payload.append("ho_address", formData.hoAddress);
        payload.append("mobile", formData.mobile);
        payload.append("email", formData.email);
        payload.append("start_date", formData.startDate);
        payload.append("end_date", formData.endDate);

        // Upload new documents during edit
        documents.forEach((file) => {
          payload.append("documents", file);
        });

        await api.put(
          `/api/auditor/${editingId}/update/`,
          payload,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        alert("Auditor updated successfully");
      } else {

        const payload = new FormData();

        payload.append("name", formData.name);
        payload.append("company", formData.company);
        payload.append("short_name", formData.shortName);
        payload.append("ho_address", formData.hoAddress);
        payload.append("mobile", formData.mobile);
        payload.append("email", formData.email);
        payload.append("start_date", formData.startDate);
        payload.append("end_date", formData.endDate);

        documents.forEach((d) => payload.append("documents", d));

        await api.post(
          "/api/auditor/create/",
          payload
        );

        alert("Auditor created successfully");
      }

      /* RESET FORM */

      setEditingId(null);
      setSelectedRows([]);
      setDocuments([]);

      setStartDateObj(null);
      setEndDateObj(null);

      setFormData({
        name: "",
        company: "",
        shortName: "",
        hoAddress: "",
        mobile: "",
        email: "",
        startDate: "",
        endDate: "",
      });

      fetchAuditors();

    } finally {
      setSubmitting(false);
    }
  };

  /* =========================
     BULK ACTIONS
  ========================= */

const handleEditSelected = () => {

  if (selectedRows.length !== 1) {
    alert("Select exactly one auditor to edit");
    return;
  }

  const a = tableData.find(
    (x) => x.id === selectedRows[0]
  );

  setEditingId(a.id);

  setFormData({
    name: a.name,
    company: a.company,
    shortName: a.short_name,
    hoAddress: a.ho_address,
    mobile: a.mobile,
    email: a.email,
    startDate: a.start_date,
    endDate: a.end_date,
  });

  setStartDateObj(
    a.start_date
      ? new Date(a.start_date + "T00:00:00")
      : null
  );

  setEndDateObj(
    a.end_date
      ? new Date(a.end_date + "T00:00:00")
      : null
  );
};

  const handleBulkDelete = async () => {

    if (!selectedRows.length) return;

    if (!confirm("Delete selected auditors?")) return;

    await Promise.all(
      selectedRows.map((id) =>
        api.delete(
          `/api/auditor/${id}/delete/`
        )
      )
    );

    setSelectedRows([]);
    fetchAuditors();
  };

  const handleExport = () => {

    if (!tableData.length) return;

    const ws = XLSX.utils.json_to_sheet(
      tableData.map((a) => ({
        Company: a.company,
        ShortName: a.short_name,
        Address: a.ho_address,
        Email: a.email,
        Mobile: a.mobile,
        StartDate: a.start_date,
        EndDate: a.end_date,
        Status: "Active",
      }))
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Auditors");

    saveAs(
      new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })]),
      "auditors.xlsx"
    );
  };

  

  /* =========================
     RENDER
  ========================= */

  return (

    <div>

      <PageMeta title="Auditor | HR Compliance" />
      <PageBreadcrumb pageTitle="Manage Auditor" />

      {/* ================= FORM ================= */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[2fr_1fr]">

        {/* LEFT CARD */}

        <ComponentCard title="Auditor Details">

          {editingId && (
            <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-800">
              Editing existing Auditor
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

            <div>
              <Label>Name</Label>
              <Input name="name" value={formData.name} onChange={handleChange} />
            </div>

            <div>
              <Label>Company</Label>
              <Input name="company" value={formData.company} onChange={handleChange} />
            </div>

            <div>
              <Label>Short Name</Label>
              <Input name="shortName" value={formData.shortName} onChange={handleChange} />
            </div>

            <div>
              <Label>Mobile</Label>
              <Input
                name="mobile"
                value={formData.mobile}
                maxLength={10}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  setFormData((p) => ({
                    ...p,
                    mobile: value.slice(0, 10),
                  }));
                }}
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input name="email" value={formData.email} onChange={handleChange} />
            </div>

            <div>
              <Label>Start Date</Label>
              <DatePicker
                selected={startDateObj}
                dateFormat="dd/MM/yyyy"
                placeholderText="dd/mm/yyyy"
                className={dateInputClass}
                onChange={(date) => {
                  setStartDateObj(date);

                  if (date) {
                    const formatted = formatForAPI(date);

                    setFormData((p) => ({
                      ...p,
                      startDate: formatted,
                    }));
                  }
                }}
              />
            </div>

            <div>
              <Label>End Date</Label>
              <DatePicker
                selected={endDateObj}
                dateFormat="dd/MM/yyyy"
                placeholderText="dd/mm/yyyy"
                minDate={startDateObj || undefined}
                className={dateInputClass}
                onChange={(date) => {
                  setEndDateObj(date);

                  if (date) {
                    const formatted = formatForAPI(date);

                    setFormData((p) => ({
                      ...p,
                      endDate: formatted,
                    }));
                  }
                }}
              />
            </div>

            <div className="xl:col-span-2">
              <Label>Work Location</Label>
              <Input name="hoAddress" value={formData.hoAddress} onChange={handleChange} />
            </div>

          </div>

        </ComponentCard>

        {/* RIGHT SIDE */}

        <div className="space-y-6">

          <ComponentCard title="Documents">

            <FileInput
              multiple
              onChange={(e) =>
                e.target.files && handleFiles(e.target.files)
              }
            />

            <div className="mt-2 text-xs text-gray-500">

            Supported formats:
            PDF, DOC, DOCX, XLS, XLSX,
            PPT, PPTX, JPG, JPEG, PNG

            <br />

            Maximum file size:
            10 MB per file

            <br />

            Multiple documents supported

          </div>

            {documents.length > 0 && (
              <div className="mt-4 space-y-2">

                {documents.map((f) => (
                  <div
                    key={f.name}
                    className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm bg-gray-50"
                  >

                    <span className="truncate text-gray-700">
                      📄 {f.name}
                    </span>

                    <button
                      onClick={() => removeFile(f.name)}
                      className="text-red-500 hover:text-red-700 font-medium"
                    >
                      Remove
                    </button>

                  </div>
                ))}

              </div>
            )}

          </ComponentCard>

          <ComponentCard>

            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={submitting}
            >

              {submitting
                ? editingId
                  ? "Updating..."
                  : "Creating..."
                : editingId
                ? "Update Auditor"
                : "Create Auditor"}

            </Button>

          </ComponentCard>

        </div>

      </div>

      {/* ================= TABLE ================= */}

      <div className="mt-10">

        <ComponentCard title="Auditors">

<div className="mb-5 flex justify-between items-center">

  {/* LEFT SIDE (UNCHANGED) */}
  <div className="flex gap-2">

    <Button size="sm" onClick={handleExport}>
      Export to Excel
    </Button>

    <Button
      size="sm"
      variant="outline"
      disabled={!selectedRows.length}
      onClick={handleBulkDelete}
    >
      Delete Selected
    </Button>

    <Button
      size="sm"
      variant="outline"
      disabled={selectedRows.length !== 1}
      onClick={handleEditSelected}
    >
      Edit Selected
    </Button>

  </div>

  {/* RIGHT SIDE SEARCH (NEW) */}
  <input
    type="text"
    placeholder="Search Auditor..."
    className="h-9 px-3 border border-gray-300 rounded-lg text-sm w-52"
    value={search}
    onChange={(e) => setSearch(e.target.value)}
  />

</div>

          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">

            <Table>

              <TableHeader>

                <TableRow className="bg-gray-50">

                  <TableCell isHeader className="w-12 px-6 py-4" />

                  {[
                    "Name",
                    "Company",
                    "Shortname",
                    "Work Location",
                    "Mobile",
                    "Email",
                    "Documents",
                    "Start Date (DD/MM/YY)",
                    "End Date (DD/MM/YY)",
                    "Status",
                  ].map((h) => (
                    <TableCell
                      key={h}
                      isHeader
                      className="px-6 py-4 text-xs font-semibold uppercase text-gray-500 text-center"
                    >
                      {h}
                    </TableCell>
                  ))}

                </TableRow>

              </TableHeader>

              <TableBody>

{filteredAuditors.map((a) => (
                  <TableRow key={a.id} className="border-t hover:bg-gray-50">

                    <TableCell className="px-6 py-5 text-center">

                      <Checkbox
                        checked={selectedRows.includes(a.id)}
                        onChange={(e) =>
                          setSelectedRows((p) =>
                            e.target.checked
                              ? [...p, a.id]
                              : p.filter((x) => x !== a.id)
                          )
                        }
                      />

                    </TableCell>

                    <TableCell className="px-6 py-5 text-center">{a.name}</TableCell>
                    <TableCell className="px-6 py-5 text-center">{a.company}</TableCell>
                    <TableCell className="px-6 py-5 text-center">{a.short_name}</TableCell>
                    <TableCell className="px-6 py-5 text-center">{a.ho_address}</TableCell>
                    <TableCell className="px-6 py-5 text-center">{a.mobile}</TableCell>
                    <TableCell className="px-6 py-5 text-center">{a.email}</TableCell>
                    <TableCell className="px-6 py-5 text-center">

                      {a.documents?.length ? (

                        <a
                          href="#"
                          onClick={async (e) => {

                            e.preventDefault();

                            const response = await api.get(
                              `/api/auditor/${a.id}/download-documents/`,
                              {
                                responseType: "blob",
                              }
                            );

                            const url = window.URL.createObjectURL(
                              new Blob([response.data])
                            );

                            const link =
                              document.createElement("a");

                            link.href = url;

                            link.download =
                              `${a.short_name}_documents.zip`;

                            document.body.appendChild(link);

                            link.click();

                            link.remove();

                            window.URL.revokeObjectURL(url);
                          }}
                          className="
                            text-blue-600
                            hover:text-blue-800
                            hover:underline
                            font-medium
                          "
                        >
                          Download Documents
                        </a>

                      ) : (
                        "—"
                      )}

                    </TableCell>
                    <TableCell className="px-6 py-5 text-center">
                      {formatDate(a.start_date)}
                    </TableCell>

                    <TableCell className="px-6 py-5 text-center">
                      {formatDate(a.end_date)}
                    </TableCell>

                    <TableCell className="px-6 py-5 text-center">
                      <Badge color="success">Active</Badge>
                    </TableCell>

                  </TableRow>

                ))}

              </TableBody>

            </Table>

          </div>

        </ComponentCard>

      </div>

    </div>

  );

}