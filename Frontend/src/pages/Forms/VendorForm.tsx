import { useState, useEffect, useMemo, useRef } from "react";
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

const dateInputClass =
  "w-full h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none";

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
    startDate: "",
    endDate: "",
    natureOfServices: "",
  });

  const [errors, setErrors] = useState({});
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);

  /* =========================
     TABLE STATE
  ========================= */
  const [vendors, setVendors] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);

  /* =========================
     EDIT STATE
  ========================= */
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const formRef = useRef(null);

  /* =========================
     FETCH
  ========================= */
  const fetchVendors = async () => {
    const res = await fetch("http://127.0.0.1:8000/api/vendor/list/");
    const data = await res.json();
    setVendors(data);
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  /* =========================
     INPUT HANDLER
  ========================= */
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "mobile") {
      const digits = value.replace(/\D/g, "").slice(0, 10);
      setFormData((p) => ({ ...p, mobile: digits }));
      setErrors((p) => ({
        ...p,
        mobile: digits.length !== 10 ? "Mobile must be 10 digits" : "",
      }));
      return;
    }

    if (name === "email") {
      setErrors((p) => ({
        ...p,
        email: emailRegex.test(value) ? "" : "Invalid email",
      }));
    }

    setFormData((p) => ({ ...p, [name]: value }));
  };

  /* =========================
     FILE HANDLERS
  ========================= */
  const handleFiles = (files) => {
    const valid = [];
    for (const f of Array.from(files)) {
      if (documents.some((d) => d.name === f.name)) return;
      valid.push(f);
    }
    setDocuments((p) => [...p, ...valid]);
  };

  const removeFile = (name) => {
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
      const payload = {};
      Object.entries(formData).forEach(([k, v]) => {
        payload[k.replace(/([A-Z])/g, "_$1").toLowerCase()] = v;
      });

      const res = await fetch(
        `http://127.0.0.1:8000/api/vendor/${editingId}/update/`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
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
      { method: "POST", body: payload }
    );

    if (!res.ok) {
      alert("Creation failed");
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
      startDate: "",
      endDate: "",
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
      startDate: v.start_date,
      endDate: v.end_date,
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
        "From",
        "To",
        "Status",
      ],
      ...vendors.map((v) => [
        v.name,
        v.short_name,
        v.contact_person,
        v.email,
        v.mobile,
        v.nature_of_services,
        v.start_date,
        v.end_date,
        "Active",
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    ws["!cols"] = [
      { wch: 20 }, { wch: 18 }, { wch: 20 }, { wch: 30 },
      { wch: 14 }, { wch: 22 }, { wch: 14 }, { wch: 14 }, { wch: 12 },
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

      {/* ================= FORM ================= */}
      <div
        ref={formRef}
        className="grid grid-cols-1 gap-6 xl:grid-cols-[2fr_1fr]"
      >
        <ComponentCard title="Vendor Details">
          <div className="space-y-4">
            <Label>Name</Label>
            <Input name="name" value={formData.name} onChange={handleChange} />

            <Label>Short Name</Label>
            <Input name="shortName" value={formData.shortName} onChange={handleChange} />

            <Label>Address</Label>
            <Input name="hoAddress" value={formData.hoAddress} onChange={handleChange} />

            <Label>Agreement Start Date</Label>
            <input type="date" className={dateInputClass}
              value={formData.startDate}
              onChange={(e) => handleChange({ target: { name: "startDate", value: e.target.value } })}
            />

            <Label>Agreement End Date</Label>
            <input type="date" className={dateInputClass}
              value={formData.endDate}
              onChange={(e) => handleChange({ target: { name: "endDate", value: e.target.value } })}
            />

            <Label>Contact Person</Label>
            <Input name="contactPerson" value={formData.contactPerson} onChange={handleChange} />

            <Label>Mobile</Label>
            <Input name="mobile" value={formData.mobile} onChange={handleChange} />

            <Label>Email</Label>
            <Input name="email" value={formData.email} onChange={handleChange} />

            <Label>Nature of Services</Label>
            <Input name="natureOfServices" value={formData.natureOfServices} onChange={handleChange} />
          </div>
        </ComponentCard>

        <div className="space-y-6">
          <ComponentCard title="Documents">
            <FileInput multiple onChange={(e) => e.target.files && handleFiles(e.target.files)} />
            {documents.map((f) => (
              <div key={f.name} className="mt-2 flex justify-between text-sm">
                <span className="truncate">📄 {f.name}</span>
                <button className="text-red-500" onClick={() => removeFile(f.name)}>×</button>
              </div>
            ))}
          </ComponentCard>

          <ComponentCard>
            <Button className="w-full" onClick={handleSubmit} disabled={loading}>
              {loading
                ? "Saving..."
                : isEditMode
                ? "Update Vendor"
                : "Create Vendor"}
            </Button>
          </ComponentCard>
        </div>
      </div>

      {/* ================= TABLE (PE STYLE) ================= */}
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
                    "From",
                    "To",
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
                    <TableCell className="px-6 py-5">{v.start_date}</TableCell>
                    <TableCell className="px-6 py-5">{v.end_date}</TableCell>
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
