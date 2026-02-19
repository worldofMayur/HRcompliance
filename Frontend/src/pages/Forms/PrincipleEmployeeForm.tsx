import { useState, useEffect, useMemo, useRef } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";

import Input from "../../components/form/input/InputField";
import FileInput from "../../components/form/input/FileInput";
import Label from "../../components/form/Label";
import Button from "../../components/ui/button/Button";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Checkbox } from "antd";
import "antd/dist/reset.css";

import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";

/* =========================
   HELPERS
========================= */
const emailRegex =
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const normalSelectClass =
  "w-full h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none";

const dateInputClass =
  "w-full h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none";

/* =========================
   COMPONENT
========================= */
export default function PrincipleEmployeeForm() {
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
    natureOfBusiness: "",
    establishmentType: "",
    rulesApplicable: "",
  });

  const [errors, setErrors] = useState({});
  const [documents, setDocuments] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  /* =========================
     EDIT STATE
  ========================= */
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const formRef = useRef(null);

  /* =========================
     TABLE STATE
  ========================= */
  const [tableData, setTableData] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [search, setSearch] = useState("");
  const [ruleFilter, setRuleFilter] = useState("all");

  /* =========================
     FETCH LIST
  ========================= */
  const fetchPEs = async () => {
    const res = await fetch(
      "http://127.0.0.1:8000/api/principal-employer/list/"
    );
    const data = await res.json();
    setTableData(data);
  };

  useEffect(() => {
    fetchPEs();
  }, []);

  /* =========================
     FILTERED DATA
  ========================= */
  const filteredData = useMemo(() => {
    return tableData.filter((pe) => {
      const matchesSearch =
        pe.name.toLowerCase().includes(search.toLowerCase()) ||
        pe.email.toLowerCase().includes(search.toLowerCase()) ||
        pe.contact_person.toLowerCase().includes(search.toLowerCase());

      const matchesRule =
        ruleFilter === "all" || pe.rules_applicable === ruleFilter;

      return matchesSearch && matchesRule;
    });
  }, [tableData, search, ruleFilter]);

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
     DOCUMENT HANDLERS
  ========================= */
  const addDocument = (file) => {
    if (documents.some((d) => d.name === file.name)) return;
    setDocuments((p) => [...p, file]);
  };

  const removeDocument = (name) => {
    setDocuments((p) => p.filter((d) => d.name !== name));
  };

  /* =========================
     EDIT HANDLER
  ========================= */
  const handleEditSelected = () => {
    if (selectedRows.length !== 1) {
      alert("Select exactly one row to edit");
      return;
    }

    const pe = tableData.find((x) => x.id === selectedRows[0]);
    if (!pe) return;

    setFormData({
      name: pe.name,
      shortName: pe.short_name,
      hoAddress: pe.ho_address,
      contactPerson: pe.contact_person,
      mobile: pe.mobile,
      email: pe.email,
      startDate: pe.start_date,
      endDate: pe.end_date || "",
      natureOfBusiness: pe.nature_of_business,
      establishmentType: pe.establishment_type,
      rulesApplicable: pe.rules_applicable,
    });

    setIsEditMode(true);
    setEditingId(pe.id);

    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  /* =========================
     SUBMIT
  ========================= */
  const handleSubmit = async () => {
    if (Object.values(formData).some((v) => v === "")) {
      alert("All fields are required");
      return;
    }

    if (!isEditMode && !documents.length) {
      alert("At least one document is required");
      return;
    }

    if (Object.values(errors).some(Boolean)) {
      alert("Fix validation errors");
      return;
    }

    setSubmitting(true);

    try {
      if (isEditMode) {
        const payload = {};
        Object.entries(formData).forEach(([k, v]) => {
          payload[k.replace(/([A-Z])/g, "_$1").toLowerCase()] = v;
        });

        const res = await fetch(
          `http://127.0.0.1:8000/api/principal-employer/${editingId}/update/`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );

        if (!res.ok) throw new Error("Update failed");
        alert("Updated successfully");
      } else {
        const payload = new FormData();
        Object.entries(formData).forEach(([k, v]) =>
          payload.append(k.replace(/([A-Z])/g, "_$1").toLowerCase(), v)
        );
        documents.forEach((d) => payload.append("document", d));

        const res = await fetch(
          "http://127.0.0.1:8000/api/principal-employer/create/",
          { method: "POST", body: payload }
        );

        if (!res.ok) throw new Error("Creation failed");
        alert("Created successfully");
      }

      setFormData({
        name: "",
        shortName: "",
        hoAddress: "",
        contactPerson: "",
        mobile: "",
        email: "",
        startDate: "",
        endDate: "",
        natureOfBusiness: "",
        establishmentType: "",
        rulesApplicable: "",
      });

      setDocuments([]);
      setSelectedRows([]);
      setIsEditMode(false);
      setEditingId(null);
      fetchPEs();
    } catch (e) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  /* =========================
     EXPORT TO EXCEL
  ========================= */
  const handleExport = () => {
    if (!filteredData.length) return;

    const worksheetData = [
      [
        "Company",
        "Short Name",
        "Contact",
        "Email",
        "Mobile",
        "Nature of Business",
        "Establishment",
        "From",
        "To",
        "Rules",
        "Status",
      ],
      ...filteredData.map((pe) => [
        pe.name,
        pe.short_name,
        pe.contact_person,
        pe.email,
        pe.mobile.toString(),
        pe.nature_of_business,
        pe.establishment_type,
        pe.start_date,
        pe.end_date || "",
        pe.rules_applicable,
        "Active",
      ]),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    worksheet["!cols"] = [
      { wch: 20 }, { wch: 18 }, { wch: 20 }, { wch: 28 },
      { wch: 14 }, { wch: 22 }, { wch: 20 }, { wch: 14 },
      { wch: 14 }, { wch: 12 }, { wch: 12 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Principal Employers");
    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

    saveAs(
      new Blob([buffer], {
        type:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      "principal_employers.xlsx"
    );
  };

  /* =========================
     BULK DELETE
  ========================= */
  const handleBulkDelete = async () => {
    if (!selectedRows.length) return;
    if (!confirm("Delete selected Principal Employers?")) return;

    await Promise.all(
      selectedRows.map((id) =>
        fetch(
          `http://127.0.0.1:8000/api/principal-employer/${id}/delete/`,
          { method: "DELETE" }
        )
      )
    );

    setSelectedRows([]);
    fetchPEs();
  };

  /* =========================
     RENDER
  ========================= */
  return (
    <div>
      <PageMeta title="Principle Employee | HR Compliance" />
      <PageBreadcrumb pageTitle="Manage Principle Employee" />

      {/* ================= FORM ================= */}
      <div ref={formRef} className="grid grid-cols-1 gap-6 xl:grid-cols-[2fr_1fr]">
        <ComponentCard title="Principle Employee Details">
          {isEditMode && (
            <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-800">
              Editing existing Principal Employer
            </div>
          )}

          <div className="space-y-4">
            <Label>Name</Label>
            <Input name="name" value={formData.name} onChange={handleChange} />

            <Label>Short Name</Label>
            <Input name="shortName" value={formData.shortName} onChange={handleChange} />

            <Label>HO Address</Label>
            <Input name="hoAddress" value={formData.hoAddress} onChange={handleChange} />

            <Label>Contact Person</Label>
            <Input name="contactPerson" value={formData.contactPerson} onChange={handleChange} />

            <Label>Mobile</Label>
            <Input name="mobile" value={formData.mobile} onChange={handleChange} />

            <Label>Email</Label>
            <Input name="email" value={formData.email} onChange={handleChange} />

            <Label>Start Date</Label>
            <input type="date" className={dateInputClass}
              value={formData.startDate}
              onChange={(e) => handleChange({ target: { name: "startDate", value: e.target.value } })}
            />

            <Label>End Date</Label>
            <input type="date" className={dateInputClass}
              value={formData.endDate}
              onChange={(e) => handleChange({ target: { name: "endDate", value: e.target.value } })}
            />

            <Label>Nature of Business</Label>
            <Input name="natureOfBusiness" value={formData.natureOfBusiness} onChange={handleChange} />

            <Label>Establishment Type</Label>
            <Input name="establishmentType" value={formData.establishmentType} onChange={handleChange} />

            <Label>Rules Applicable</Label>
            <select className={normalSelectClass} name="rulesApplicable"
              value={formData.rulesApplicable} onChange={handleChange}>
              <option value="">Select</option>
              <option value="central">Central</option>
              <option value="state">State</option>
            </select>
          </div>
        </ComponentCard>

        <div className="space-y-6">
          <ComponentCard title="Documents">
            <FileInput multiple onChange={(e) =>
              e.target.files &&
              Array.from(e.target.files).forEach(addDocument)
            } />
          </ComponentCard>

          <ComponentCard>
            <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
              {submitting
                ? "Submitting..."
                : isEditMode
                ? "Update Principal Employer"
                : "Create Principle Employee"}
            </Button>
          </ComponentCard>
        </div>
      </div>

      {/* ================= TABLE ================= */}
      <div className="mt-10">
        <ComponentCard title="Principal Employers">
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
                    "Principal Employer",
                    "Short Name",
                    "Contact Person",
                    "Email",
                    "Mobile",
                    "Nature of Business",
                    "Establishment Type",
                    "From",
                    "To",
                    "Rules",
                    "Status",
                  ].map((h) => (
                    <TableCell key={h} isHeader className="px-6 py-4 text-xs font-semibold uppercase text-gray-500">
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredData.map((pe) => (
                  <TableRow key={pe.id} className="border-t hover:bg-gray-50">
                    <TableCell className="px-6 py-5">
                      <Checkbox
                        checked={selectedRows.includes(pe.id)}
                        onChange={(e) =>
                          setSelectedRows((prev) =>
                            e.target.checked
                              ? [...prev, pe.id]
                              : prev.filter((id) => id !== pe.id)
                          )
                        }
                      />
                    </TableCell>

                    <TableCell className="px-6 py-5 font-medium">{pe.name}</TableCell>
                    <TableCell className="px-6 py-5">{pe.short_name}</TableCell>
                    <TableCell className="px-6 py-5">{pe.contact_person}</TableCell>
                    <TableCell className="px-6 py-5">{pe.email}</TableCell>
                    <TableCell className="px-6 py-5">{pe.mobile}</TableCell>
                    <TableCell className="px-6 py-5">{pe.nature_of_business}</TableCell>
                    <TableCell className="px-6 py-5">{pe.establishment_type}</TableCell>
                    <TableCell className="px-6 py-5">{pe.start_date}</TableCell>
                    <TableCell className="px-6 py-5">{pe.end_date || "—"}</TableCell>
                    <TableCell className="px-6 py-5">{pe.rules_applicable}</TableCell>
                    <TableCell className="px-6 py-5 text-green-700">Active</TableCell>
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
