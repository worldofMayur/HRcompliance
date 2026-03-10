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

/* =========================
   HELPERS
========================= */
const emailRegex =
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function VendorForm() {
  const token = localStorage.getItem("access_token");

  const authHeader = {
    Authorization: `Bearer ${token}`,
  };

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

  /* =========================
     FETCH
  ========================= */
  const fetchVendors = async () => {
    try {
      const res = await fetch(
        "http://127.0.0.1:8000/api/vendor/list/",
        { headers: authHeader }
      );

      if (!res.ok) return;

      const result = await res.json();
      setVendors(result);
    } catch (error) {
      console.error("Vendor fetch failed", error);
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
      if (documents.some((d) => d.name === f.name)) continue;
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

    if (!documents.length && !isEditMode) {
      alert("At least one document is required");
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

      const res = await fetch(
        `http://127.0.0.1:8000/api/vendor/${editingId}/update/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...authHeader,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        alert("Update failed");
        setLoading(false);
        return;
      }

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

    const res = await fetch(
      "http://127.0.0.1:8000/api/vendor/create/",
      {
        method: "POST",
        headers: authHeader,
        body: payload,
      }
    );

if (!res.ok) {
  const errorData = await res.json().catch(() => null);

  console.error("Backend Error:", errorData);

  if (errorData) {
    if (errorData.error) {
      alert(errorData.error);
    } else {
      const firstKey = Object.keys(errorData)[0];
      alert(`${firstKey}: ${errorData[firstKey]}`);
    }
  } else {
    alert("Unknown server error");
  }

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
        fetch(`http://127.0.0.1:8000/api/vendor/${id}/delete/`, {
          method: "DELETE",
          headers: authHeader,
        })
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
        <Label>Head Office Address</Label>
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
        onChange={(e) =>
          e.target.files && handleFiles(e.target.files)
        }
      />

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
          <div className="mb-5 flex justify-between">
            <div className="flex gap-2">
              <Button size="sm" onClick={handleExport}>Export to Excel</Button>
              <Button size="sm" variant="outline" disabled={!selectedRows.length} onClick={handleBulkDelete}>
                Delete Selected
              </Button>
              <Button size="sm" variant="outline" disabled={selectedRows.length !== 1} onClick={handleEditSelected}>
                Edit Selected
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableCell isHeader className="w-12 px-6 py-4" />
                  {[
                    "Vendor",
                    "Short Name",
                    "Contact Person",
                    "Email",
                    "Mobile",
                    "Nature of Services",
                    "Status",
                  ].map((h) => (
                    <TableCell key={h} isHeader className="px-6 py-4 text-xs font-semibold uppercase text-gray-500">
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHeader>

              <TableBody>
                {vendors.map((v) => (
                  <TableRow key={v.id} className="border-t hover:bg-gray-50">
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

                    <TableCell className="px-6 py-5 font-medium">{v.name}</TableCell>
                    <TableCell className="px-6 py-5">{v.short_name}</TableCell>
                    <TableCell className="px-6 py-5">{v.contact_person}</TableCell>
                    <TableCell className="px-6 py-5">{v.email}</TableCell>
                    <TableCell className="px-6 py-5">{v.mobile}</TableCell>
                    <TableCell className="px-6 py-5">{v.nature_of_services}</TableCell>
                    <TableCell className="px-6 py-5">
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