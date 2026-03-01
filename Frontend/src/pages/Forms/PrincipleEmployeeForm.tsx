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
     BRANCH STATE (NEW)
  ========================= */
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [animatedCount, setAnimatedCount] = useState(0);
  const [selectedPEForBranch, setSelectedPEForBranch] = useState(null);
  const [selectedPEObject, setSelectedPEObject] = useState(null);
  const [branchList, setBranchList] = useState([]);
  const [editingData, setEditingData] = useState({});
  const [editingBranchId, setEditingBranchId] = useState<number | null>(null);

  useEffect(() => {
  let start = 0;
  const end = branchList.length;

  if (start === end) {
    setAnimatedCount(end);
    return;
  }

  const duration = 300;
  const stepTime = 20;
  const increment = Math.ceil(end / (duration / stepTime));

  const timer = setInterval(() => {
    start += increment;
    if (start >= end) {
      setAnimatedCount(end);
      clearInterval(timer);
    } else {
      setAnimatedCount(start);
    }
  }, stepTime);

  return () => clearInterval(timer);
}, [branchList]);

    const [branchData, setBranchData] = useState({
      state: "",
      short_name: "",
      address: "",
      status: "active",   // default active
    });

const openBranchModal = async (peId) => {
  const pe = tableData.find((x) => x.id === peId);

  setSelectedPEForBranch(peId);
  setSelectedPEObject(pe);   // ✅ store full object
  setBranchModalOpen(true);

  const res = await fetch(
    `http://127.0.0.1:8000/api/principal-employer/${peId}/branches/`
  );
  const data = await res.json();
  setBranchList(data);
};

const startEditing = (branch) => {
  setEditingBranchId(branch.id);
  setEditingData(branch);
};

  const resetBranchForm = () => {
    setBranchData({
      state: "",
      short_name: "",
      address: "",
    });
  };

const handleBranchUpdate = async (branchId: number) => {
  const formData = new FormData();

  formData.append("short_name", branchData.short_name);
  formData.append("state", branchData.state);
  formData.append("address", branchData.address);
  formData.append("status", branchData.status);

  if (branchData.document) {
    formData.append("document", branchData.document);
  }

  const res = await fetch(
    `http://127.0.0.1:8000/api/principal-employer/branch/${branchId}/update/`,
    {
      method: "PUT",
      body: formData,
    }
  );

  const data = await res.json();

  if (!res.ok) {
    alert(JSON.stringify(data));
    return;
  }

  // ✅ Update table instantly
  setBranchList((prev) =>
    prev.map((b) =>
      b.id === data.id ? data : b
    )
  );

  // Exit edit mode
  setEditingBranchId(null);

  // Reset form
  setBranchData({
    state: "",
    short_name: "",
    address: "",
    status: "active",
    document: null,
  });
};

const handleBranchSubmit = async () => {
  if (!selectedPEObject) return;

  const formData = new FormData();

  formData.append("principal_employer", selectedPEObject.id);
  formData.append("state", branchData.state);
  formData.append("short_name", branchData.short_name);
  formData.append("address", branchData.address);
  formData.append("status", branchData.status);

  if (branchData.document) {
    formData.append("document", branchData.document);
  }

  const res = await fetch("http://127.0.0.1:8000/api/principal-employer/branch/create/", {
      method: "POST",
      body: formData,
    }
  );

  if (!res.ok) {
    const err = await res.json();
    console.log(err);
    return;
  }

  const newBranch = await res.json();

  // ✅ Immediately update UI
  setBranchList((prev) => [newBranch, ...prev]);

  // Reset form
  setBranchData({
    state: "",
    short_name: "",
    address: "",
    status: "active",
    document: null,
  });
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

const handleExportBranches = () => {
  if (!branchList.length) return;

  const worksheetData = [
    ["Principal Employer", "Short Name", "State", "Address", "Status"],
    ...branchList.map((b) => [
      selectedPEObject?.name,
      b.short_name,
      b.state,
      b.address,
      b.status,
    ]),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Branches");

  const buffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  saveAs(
    new Blob([buffer], {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `${selectedPEObject?.short_name}_branches.xlsx`
  );
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
      const requiredFields = [
        formData.name,
        formData.shortName,
        formData.hoAddress,
        formData.contactPerson,
        formData.mobile,
        formData.email,
        formData.startDate,
        formData.natureOfBusiness,
        formData.establishmentType,
        formData.rulesApplicable,
      ];

      if (requiredFields.some((v) => !v)) {
        alert("All required fields must be filled");
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

        if (!res.ok) {
          const errorData = await res.json();
          console.log("Backend Error:", errorData);
          alert(JSON.stringify(errorData));
          return;
        }

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
        "Branch",
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
                    <TableCell className="px-6 py-5">
                      <Button
                        size="sm"
                        onClick={() => openBranchModal(pe.id)}
                      >
                        Add / View Branch
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </ComponentCard>
      </div>
      {/* ================= BRANCH MODAL ================= */}

{/* ================= ENHANCED BRANCH MODAL ================= */}
{/* ================= PREMIUM BRANCH MODAL ================= */}
{branchModalOpen && (
  <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 pb-10 bg-black/40 backdrop-blur-sm px-4">
    <div className="w-full max-w-6xl rounded-2xl bg-white shadow-2xl overflow-hidden">

      {/* ================= HEADER ================= */}
      <div className="flex items-center justify-between px-8 py-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">
            {selectedPEObject?.name}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Managing mapped branches
          </p>
        </div>

        <button
          onClick={() => setBranchModalOpen(false)}
          className="text-gray-500 hover:text-gray-700 text-xl"
        >
          ✕
        </button>
      </div>

      {/* ================= BODY ================= */}
      <div className="p-8 space-y-10 max-h-[70vh] overflow-y-auto">

        {/* ================= ADD / EDIT FORM ================= */}
        <div id="branch-form" className="bg-gray-50 border rounded-2xl p-8 space-y-8">

          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
              {editingBranchId ? "Edit Branch" : "Add New Branch"}
            </h3>

            {editingBranchId && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-medium">
                Editing Mode
              </span>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-6">

            {/* STATE */}
            <div>
              <Label>State</Label>
              <select
                className="w-full h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm"
                value={branchData.state}
                onChange={(e) =>
                  setBranchData({ ...branchData, state: e.target.value })
                }
              >
                <option value="">Select State</option>
                <option value="Telangana">Telangana</option>
                <option value="Tamilnadu">Tamilnadu</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Delhi">Delhi</option>
              </select>
            </div>

            {/* SHORT NAME */}
            <div>
              <Label>Branch Short Name</Label>
              <Input
                value={branchData.short_name}
                onChange={(e) =>
                  setBranchData({
                    ...branchData,
                    short_name: e.target.value,
                  })
                }
              />
            </div>

            {/* STATUS */}
            <div>
              <Label>Status</Label>
              <select
                className="w-full h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm"
                value={branchData.status}
                onChange={(e) =>
                  setBranchData({
                    ...branchData,
                    status: e.target.value,
                  })
                }
              >
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* ADDRESS */}
            <div className="md:col-span-2">
              <Label>Address</Label>
              <Input
                value={branchData.address}
                onChange={(e) =>
                  setBranchData({
                    ...branchData,
                    address: e.target.value,
                  })
                }
              />
            </div>

            {/* DOCUMENT */}
            <div>
              <Label>Upload Document (Optional)</Label>

              <div className="mt-2 space-y-3">

                {/* EXISTING DOCUMENT */}
                {branchData.existingDocument && !branchData.document && (
                  <div className="flex items-center justify-between text-sm bg-white px-4 py-2 rounded-lg border">
                    <a
                      href={`http://127.0.0.1:8000${branchData.existingDocument}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      View Current Document
                    </a>

                    <button
                      type="button"
                      onClick={() =>
                        setBranchData({
                          ...branchData,
                          existingDocument: null,
                        })
                      }
                      className="text-xs text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {/* UPLOAD BOX */}
                <label className="flex items-center justify-between w-full px-4 py-3 border border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition">

                  <span className="text-sm text-gray-600 truncate">
                    {branchData.document
                      ? branchData.document.name
                      : "Click to upload document"}
                  </span>

                  <span className="text-xs text-gray-400">
                    PDF, DOC, XLS (Max 3MB)
                  </span>

                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) =>
                      setBranchData({
                        ...branchData,
                        document: e.target.files?.[0] || null,
                      })
                    }
                  />
                </label>
              </div>
            </div>

          </div>

          {/* FORM BUTTONS */}
          <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => {
              setEditingBranchId(null);
              setBranchData({
                state: "",
                short_name: "",
                address: "",
                status: "active",
                document: null,
              });
            }}
          >
            Cancel
          </Button>

        <Button
          onClick={() =>
            editingBranchId
              ? handleBranchUpdate(editingBranchId)
              : handleBranchSubmit()
          }
        >
          {editingBranchId ? "Update Branch" : "Save Branch"}
        </Button>
          </div>

        </div>

        {/* ================= TABLE ================= */}
        <div className="space-y-6">

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Mapped Branches
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Total: {branchList.length}
              </p>
            </div>

            <Button size="sm" onClick={handleExportBranches}>
              Export
            </Button>
          </div>

          {branchList.length === 0 ? (
            <div className="text-center text-sm text-gray-400 py-16 border rounded-xl">
              No branches mapped yet
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 overflow-hidden">

              <table className="w-full text-sm">

                <thead className="bg-gray-50 text-xs uppercase text-gray-400 tracking-wide">
                  <tr>
                    <th className="px-6 py-3 text-left">Principal Employer</th>
                    <th className="px-6 py-3 text-left">Short Name</th>
                    <th className="px-6 py-3 text-left">State</th>
                    <th className="px-6 py-3 text-left">Address</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">Document</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">

                  {branchList.map((branch) => (
                    <tr key={branch.id} className="hover:bg-gray-50 transition">

                      <td className="px-6 py-4 font-medium text-gray-700">
                        {selectedPEObject?.name}
                      </td>

                      <td className="px-6 py-4 text-gray-700">
                        {branch.short_name}
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {branch.state}
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {branch.address}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                            branch.status === "active"
                              ? "bg-green-50 text-green-600"
                              : "bg-red-50 text-red-600"
                          }`}
                        >
                          {branch.status.toUpperCase()}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-sm">
                        {branch.document ? (
                          <a
                            href={`http://127.0.0.1:8000${branch.document}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline"
                          >
                            View
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingBranchId(branch.id);
                            setBranchData({
                              state: branch.state,
                              short_name: branch.short_name,
                              address: branch.address,
                              status: branch.status,
                              document: null,
                              existingDocument: branch.document || null,
                            });

                            document
                              .getElementById("branch-form")
                              ?.scrollIntoView({ behavior: "smooth" });
                          }}
                        >
                          Edit
                        </Button>
                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>
          )}

        </div>

      </div>
    </div>
  </div>
)}
    </div>
  );
}
