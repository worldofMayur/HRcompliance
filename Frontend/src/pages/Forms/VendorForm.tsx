import { useState, useEffect, useRef } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";

import Input from "../../components/form/input/InputField";
import FileInput from "../../components/form/input/FileInput";
import Label from "../../components/form/Label";
import Button from "../../components/ui/button/Button";

import { Checkbox } from "antd";
import "antd/dist/reset.css";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import {
  Table,
  TableHeader,
  TableRow,
  TableCell,
  TableBody,
} from "../../components/ui/table";

import Badge from "../../components/ui/badge/Badge";
import api from "../../utils/api";

/* =========================
   HELPERS
========================= */
const emailRegex =
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const MAX_FILE_SIZE = 3 * 1024 * 1024;

const ALLOWED_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "png",
  "jpg",
  "jpeg",
  "txt",
  "csv",
  "msg",
  "eml",
  "rtf",
  "odt",
  "ods",
  "odp",
  "zip",
];

export default function VendorForm() {

  /* =========================
     FORM STATE
  ========================= */
  const [formData, setFormData] = useState({
    name: "",
    shortName: "",
    hoAddress: "",
    contactPerson: "",
    mobile: "",
    email: "",
    natureOfServices: "",
  });

  const [errors, setErrors] = useState<any>({});
  const [documents, setDocuments] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  /* =========================
     TABLE STATE
  ========================= */
  const [vendors, setVendors] = useState<any[]>([]);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  /* =========================
     EDIT STATE
  ========================= */
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);
  const [search, setSearch] = useState("");

  const filteredVendors = Array.isArray(vendors)
    ? vendors
        .filter((v) => {
          const searchText = search.toLowerCase();

        return (
          v.name?.toLowerCase().includes(searchText) ||
          v.short_name?.toLowerCase().includes(searchText) ||
          v.email?.toLowerCase().includes(searchText) ||
          v.contact_person?.toLowerCase().includes(searchText) ||
          v.ho_address?.toLowerCase().includes(searchText)
        );
        })

        // ✅ ALPHABETICAL SORT
        .sort((a, b) =>
          (a.name || "").localeCompare(
            b.name || "",
            undefined,
            { sensitivity: "base" }
          )
        )

    : [];
  /* =========================
     FETCH
  ========================= */
const fetchVendors = async () => {

  try {

    const res = await api.get(
      "/api/vendor/list/"
    );

    setVendors(
      Array.isArray(res.data)
        ? res.data
        : []
    );

  } catch (error) {

    console.error(
      "Vendor fetch failed",
      error
    );

    setVendors([]);
  }
};

  useEffect(() => {
    fetchVendors();
  }, []);

  /* =========================
     INPUT HANDLER
  ========================= */
  const handleChange = (e: any) => {
    const { name, value } = e.target;

    if (name === "mobile") {
      const digits = value.replace(/\D/g, "").slice(0, 10);
      setFormData((p) => ({ ...p, mobile: digits }));
      setErrors((p: any) => ({
        ...p,
        mobile: digits.length !== 10 ? "Mobile must be 10 digits" : "",
      }));
      return;
    }

    if (name === "email") {
      setErrors((p: any) => ({
        ...p,
        email: emailRegex.test(value) ? "" : "Invalid email",
      }));
    }

    setFormData((p) => ({ ...p, [name]: value }));
  };

  /* =========================
     FILE HANDLERS
  ========================= */
  const handleFiles = (files: FileList) => {

    const valid: File[] = [];

    for (const f of Array.from(files)) {

      const ext =
        f.name.split(".").pop()?.toLowerCase();

      if (!ALLOWED_EXTENSIONS.includes(ext || "")) {
        alert(
          `Unsupported file type: ${ext}`
        );
        continue;
      }

      if (f.size > MAX_FILE_SIZE) {
        alert(
          `${f.name} exceeds 3 MB limit`
        );
        continue;
      }

      if (
        documents.some(
          (d) =>
            d.name === f.name &&
            d.size === f.size
        )
      ) {
        continue;
      }

      valid.push(f);
    }

    setDocuments((p) => [...p, ...valid]);
  };

  const removeFile = (name: string) => {
    setDocuments((p) => p.filter((f) => f.name !== name));
  };

  /* =========================
     CREATE / UPDATE SUBMIT
  ========================= */
  const handleSubmit = async () => {
    if (Object.values(formData).some((v) => !v)) {
      alert("All fields are required");
      return;
    }

    if (Object.values(errors).some(Boolean)) {
      alert("Fix validation errors");
      return;
    }

    setLoading(true);

    if (isEditMode) {
      const payload: any = {};
      Object.entries(formData).forEach(([k, v]) => {
        payload[k.replace(/([A-Z])/g, "_$1").toLowerCase()] = v;
      });

      await api.put(
        `/api/vendor/${editingId}/update/`,
        payload
      );

      alert("Vendor updated successfully");
      setIsEditMode(false);
      setEditingId(null);
      setSelectedRows([]);
      fetchVendors();
      setLoading(false);
      return;
    }

    const payload = new FormData();
    Object.entries(formData).forEach(([k, v]) =>
      payload.append(k.replace(/([A-Z])/g, "_$1").toLowerCase(), v)
    );

    documents.forEach((d) => payload.append("document", d));

    try {

      await api.post(
        "/api/vendor/create/",
        payload
      );

    } catch (error: any) {

      console.error(
        "Backend Error:",
        error.response?.data
      );

      alert(
        error.response?.data?.error ||
        "Vendor creation failed"
      );

      setLoading(false);

      return;
    }

    alert("Vendor created successfully");

    setFormData({
      name: "",
      shortName: "",
      hoAddress: "",
      contactPerson: "",
      mobile: "",
      email: "",
      natureOfServices: "",
    });

    setDocuments([]);
    fetchVendors();
    setLoading(false);
  };

  /* =========================
     EDIT SELECTED
  ========================= */
  const handleEditSelected = () => {
    if (selectedRows.length !== 1) {
      alert("Select exactly one vendor to edit");
      return;
    }

    const v = vendors.find((x) => x.id === selectedRows[0]);
    if (!v) return;

    setFormData({
      name: v.name,
      shortName: v.short_name,
      hoAddress: v.ho_address,
      contactPerson: v.contact_person,
      mobile: v.mobile,
      email: v.email,
      natureOfServices: v.nature_of_services,
    });

    setIsEditMode(true);
    setEditingId(v.id);

    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  /* =========================
     BULK DELETE
  ========================= */
  const handleBulkDelete = async () => {
    if (!selectedRows.length) return;
    if (!confirm("Delete selected vendors?")) return;

    await Promise.all(
      selectedRows.map((id) =>
        api.delete(
          `/api/vendor/${id}/delete/`
        )
      )
    );

    setSelectedRows([]);
    fetchVendors();
  };

  /* =========================
     EXPORT
  ========================= */
  const handleExport = () => {
    if (!vendors.length) return;

    const worksheetData = [
      [
        "Vendor",
        "Short Name",
        "Contact Person",
        "Email",
        "Mobile",
        "Nature of Services",
        "Status",
      ],
      ...vendors.map((v) => [
        v.name,
        v.short_name,
        v.contact_person,
        v.email,
        v.mobile,
        v.nature_of_services,
        "Active",
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    ws["!cols"] = [
      { wch: 20 },
      { wch: 18 },
      { wch: 20 },
      { wch: 30 },
      { wch: 14 },
      { wch: 22 },
      { wch: 12 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Vendors");

    saveAs(
      new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })]),
      "vendors.xlsx"
    );
  };

  /* =========================
     RENDER
  ========================= */
  return (
    <div>
      <PageMeta title="Vendor | HR Compliance" />
      <PageBreadcrumb pageTitle="Manage Vendor" />

 
<div
  ref={formRef}
  className="grid grid-cols-1 gap-6 xl:grid-cols-[2fr_1fr]"
>

  {/* ================= VENDOR FORM ================= */}

  <ComponentCard title="Vendor Details">

    {isEditMode && (
      <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-800">
        Editing existing Vendor
      </div>
    )}

    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

      {/* NAME */}
      <div>
        <Label>Name</Label>
        <Input
          name="name"
          value={formData.name}
          onChange={handleChange}
        />
      </div>

      {/* SHORT NAME */}
      <div>
        <Label>Short Name</Label>
        <Input
          name="shortName"
          value={formData.shortName}
          onChange={handleChange}
        />
      </div>

      {/* CONTACT PERSON */}
      <div>
        <Label>Contact Person</Label>
        <Input
          name="contactPerson"
          value={formData.contactPerson}
          onChange={handleChange}
        />
      </div>

      {/* MOBILE */}
      <div>
        <Label>Mobile</Label>
        <Input
          name="mobile"
          value={formData.mobile}
          onChange={handleChange}
          maxLength={10}
          inputMode="numeric"
        />
      </div>

      {/* EMAIL */}
      <div>
        <Label>Email</Label>
        <Input
          name="email"
          value={formData.email}
          onChange={handleChange}
        />
      </div>

      {/* SERVICES */}
      <div>
        <Label>Nature of Services</Label>
        <Input
          name="natureOfServices"
          value={formData.natureOfServices}
          onChange={handleChange}
        />
      </div>

      {/* ADDRESS FULL WIDTH */}
      <div className="xl:col-span-3">
        <Label>Address As per PE Agreement</Label>
        <Input
          name="hoAddress"
          value={formData.hoAddress}
          onChange={handleChange}
        />
      </div>

    </div>

  </ComponentCard>


  {/* ================= DOCUMENTS + BUTTON ================= */}

  <div className="space-y-6">

    {/* DOCUMENT CARD */}
    <ComponentCard title="Documents">

    <FileInput
      multiple
      accept="
        .pdf,
        .doc,
        .docx,
        .xls,
        .xlsx,
        .ppt,
        .pptx,
        .png,
        .jpg,
        .jpeg,
        .txt,
        .csv,
        .msg,
        .eml,
        .rtf,
        .odt,
        .ods,
        .odp,
        .zip
      "
        onChange={(e) =>
          e.target.files && handleFiles(e.target.files)
        }
      />

      <p className="mt-2 text-xs text-gray-500">
        Supported:
        PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX,
        PNG, JPG, JPEG, TXT, CSV,
        MSG, EML, RTF, ODT, ODS, ODP, ZIP
        (Max 3 MB per file)
      </p>

      {/* DOCUMENT LIST */}
      {documents.length > 0 && (
        <div className="mt-4 space-y-2">

          {documents.map((f) => (
            <div
              key={f.name}
              className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm bg-gray-50"
            >
              <span className="truncate text-gray-700">
                📄 {f.name}
                <span className="ml-2 text-gray-400 text-xs">
                  ({(f.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </span>

              <button
                className="text-red-500 hover:text-red-700 font-medium"
                onClick={() => removeFile(f.name)}
              >
                Remove
              </button>
            </div>
          ))}

        </div>
      )}

    </ComponentCard>


    {/* SUBMIT BUTTON */}
    <ComponentCard>

      <Button
        className="w-full"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading
          ? "Saving..."
          : isEditMode
          ? "Update Vendor"
          : "Create Vendor"}
      </Button>

    </ComponentCard>

  </div>

</div>

      {/* TABLE */}
      <div className="mt-10">
        <ComponentCard title="Vendors">
<div className="mb-5 flex justify-between items-center">

  {/* LEFT SIDE (UNCHANGED) */}
  <div className="flex gap-2">
    <Button size="sm" onClick={handleExport}>Export to Excel</Button>
    <Button size="sm" variant="outline" disabled={!selectedRows.length} onClick={handleBulkDelete}>
      Delete Selected
    </Button>
    <Button size="sm" variant="outline" disabled={selectedRows.length !== 1} onClick={handleEditSelected}>
      Edit Selected
    </Button>
  </div>

  {/* RIGHT SIDE SEARCH (NEW) */}
<input
  type="text"
  placeholder="Search by vendor, email, contact..."
  className="
    h-10
    px-4
    border
    border-gray-300
    rounded-xl
    text-sm
    w-72
    focus:outline-none
    focus:ring-2
    focus:ring-indigo-500
    transition
  "
  value={search}
  onChange={(e) => setSearch(e.target.value)}
/>

</div>

          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-gray-50">
                <TableRow className="bg-gray-50">
                  <TableCell isHeader className="w-12 px-6 py-4" />
                  {[
                    "Vendor",
                    "Short Name",
                    "Contact Person",
                    "Address As Per Agreement",
                    "Email",
                    "Mobile",
                    "Nature of Services",
                    "Documents",
                    "Status",
                  ].map((h) => (
                    <TableCell
                      key={h}
                      isHeader
                      className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500"
                    >                    
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHeader>

        <TableBody>

          {filteredVendors.length === 0 ? (

            <TableRow>
              <TableCell
                colSpan={10}
                className="py-10 text-center text-gray-500"
              >
                No vendors found
              </TableCell>
            </TableRow>

          ) : (

            filteredVendors.map((v) => (

                  <TableRow
                    key={v.id}
                    className="
                      border-t
                      transition-all
                      duration-200
                      odd:bg-white
                      even:bg-gray-50/40
                      hover:bg-indigo-50
                    "
                  >
                    <TableCell className="px-6 py-5">
                      <Checkbox
                        checked={selectedRows.includes(v.id)}
                        onChange={(e) =>
                          setSelectedRows((prev) =>
                            e.target.checked
                              ? [...prev, v.id]
                              : prev.filter((id) => id !== v.id)
                          )
                        }
                      />
                    </TableCell>

                    <TableCell className="px-6 py-5 font-semibold text-gray-800">
                      {v.name}
                    </TableCell>

                    <TableCell className="px-5 py-4 text-sm text-gray-600">
                      {v.short_name}
                    </TableCell>

                    <TableCell className="px-5 py-4 text-sm text-gray-600">
                      {v.contact_person}
                    </TableCell>

                  <TableCell className="px-6 py-5 min-w-[550px] max-w-[650px] whitespace-normal break-words leading-6">
                    {v.ho_address}
                  </TableCell>

                    <TableCell className="px-5 py-4 text-md text-indigo-600">
                      {v.email}
                    </TableCell>

                    <TableCell className="px-5 py-4 text-sm text-gray-600">
                      {v.mobile}
                    </TableCell>

                    <TableCell className="px-5 py-4 text-sm text-gray-600">
                      {v.nature_of_services}
                    </TableCell>

                    <TableCell className="px-5 py-4 text-sm">
                      {v.documents?.length ? (
                        <a
                          href="#"
                          className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                          onClick={async (e) => {

                            e.preventDefault();

                            const response = await api.get(
                              `/api/vendor/${v.id}/download-documents/`,
                              {
                                responseType: "blob",
                              }
                            );

                            const url =
                              window.URL.createObjectURL(
                                new Blob([response.data])
                              );

                            const link =
                              document.createElement("a");

                            link.href = url;

                            link.download =
                              `${v.short_name}_documents.zip`;

                            document.body.appendChild(link);

                            link.click();

                            link.remove();

                            window.URL.revokeObjectURL(url);
                          }}
                        >
                          Download Documents
                        </a>
                      ) : (
                        "—"
                      )}
                    </TableCell>

                    <TableCell className="px-5 py-4 text-sm">
                      <Badge color="success">Active</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}

            </TableBody>
            </Table>
          </div>
        </ComponentCard>
      </div>
    </div>
  );
}