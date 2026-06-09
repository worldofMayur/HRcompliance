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
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import api from "../../utils/api";

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
  "w-full h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none";

const dateInputClass =
  "w-full h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none";

const formatDate = (dateString: string) => {
  if (!dateString) return "—";

  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
};

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
  /* =========================
   DATE STATES
========================= */

  const [startDateObj, setStartDateObj] = useState<Date | null>(null);
  const [endDateObj, setEndDateObj] = useState<Date | null>(null);
  const [states, setStates] = useState([]);

  const [startInput, setStartInput] = useState("");
  const [endInput, setEndInput] = useState("");

  const [startError, setStartError] = useState("");
  const [endError, setEndError] = useState("");
  const [branchSearch, setBranchSearch] = useState("");

  const parseDate = (value: string) => {
  const regex = /^\d{2}\/\d{2}\/\d{4}$/;
  if (!regex.test(value)) return null;

  const [day, month, year] = value.split("/").map(Number);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
};

const formatForAPI = (date: Date | null) => {
  if (!date) return "";
  return date.toISOString().split("T")[0];
};

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

  useEffect(() => {

    api.get("/api/checklist/states/")
      .then((res) => {

    setStates(
      Array.isArray(res.data)
        ? [...res.data].sort((a, b) =>
            (a.name || "").localeCompare(
              b.name || "",
              undefined,
              { sensitivity: "base" }
            )
          )
        : []
    );

      })
      .catch((err) => {
        console.log(
          "State fetch error",
          err
        );
      });

  }, []);

const openBranchModal = async (peId) => {
  const pe = tableData.find((x) => x.id === peId);

  setSelectedPEForBranch(peId);
  setSelectedPEObject(pe);   // ✅ store full object
  setBranchModalOpen(true);

const res = await api.get(
  `/api/principal-employer/${peId}/branches/`
);

setBranchList(
  Array.isArray(res.data)
    ? [...res.data].sort((a, b) =>
        (a.short_name || "").localeCompare(
          b.short_name || "",
          undefined,
          { sensitivity: "base" }
        )
      )
    : []
);
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

  const res = await api.put(
    `/api/principal-employer/branch/${branchId}/update/`,
    formData
  );

  const data = res.data;

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
  const isFirstBranch = branchList.length === 0;
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

  const res = await api.post(
    "/api/principal-employer/branch/create/",
    formData
  );

  const newBranch = res.data;

  // ✅ Immediately update UI
  setBranchList((prev) =>
    [...prev, newBranch].sort((a, b) =>
      (a.short_name || "").localeCompare(
        b.short_name || "",
        undefined,
        { sensitivity: "base" }
      )
    )
  );
    // =========================
  // AUTO CREATE "ALL BRANCHES"
  // =========================
  if (isFirstBranch) {
    const autoForm = new FormData();

    autoForm.append("principal_employer", selectedPEObject.id);
    autoForm.append("state", branchData.state);
    autoForm.append("short_name", "All Branches");
    autoForm.append("address", branchData.state); // state as address
    autoForm.append("status", "active");

    try {
        const autoRes = await api.post(
          "/api/principal-employer/branch/create/",
          autoForm
        );

        const autoBranch = autoRes.data;

    setBranchList((prev) =>
      [...prev, autoBranch].sort((a, b) =>
        (a.short_name || "").localeCompare(
          b.short_name || "",
          undefined,
          { sensitivity: "base" }
        )
      )
    );
    } catch (err) {
      console.log("Auto All Branch creation failed", err);
    }
  }

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

  try {

    const res = await api.get(
      "/api/principal-employer/list/"
    );

    setTableData(
      Array.isArray(res.data)
        ? res.data
        : []
    );

  } catch (err) {

    console.log(
      "PE fetch error",
      err
    );

    setTableData([]);

  }
};


useEffect(() => {
  fetchPEs();
}, []);

  /* =========================
     FILTERED DATA
  ========================= */
const filteredData = useMemo(() => {

  return tableData

    .filter((pe) => {
    const matchesSearch =
      pe.name?.toLowerCase().includes(search.toLowerCase()) ||
      pe.short_name?.toLowerCase().includes(search.toLowerCase()) ||   // ✅ ADD THIS
      pe.email?.toLowerCase().includes(search.toLowerCase()) ||
      pe.contact_person?.toLowerCase().includes(search.toLowerCase());

      const matchesRule =
        ruleFilter === "all" || pe.rules_applicable === ruleFilter;

      return matchesSearch && matchesRule;
    })

    // ✅ Alphabetical Order
    .sort((a, b) =>
      (a.name || "").localeCompare(
        b.name || "",
        undefined,
        { sensitivity: "base" }
      )
    );

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
    const MAX_FILE_SIZE = 3 * 1024 * 1024;

    const addDocument = (file: File) => {
      if (file.size > MAX_FILE_SIZE) {
        alert("File size must be less than 3 MB");
        return;
      }

      if (documents.some((d) => d.name === file.name)) {
        alert("Document already added");
        return;
      }

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

  /* =========================
     SET DATEPICKER VALUES
  ========================= */

  if (pe.start_date) {
    const start = new Date(pe.start_date);
    setStartDateObj(start);
    setStartInput(start.toLocaleDateString("en-GB"));
  } else {
    setStartDateObj(null);
    setStartInput("");
  }

  if (pe.end_date) {
    const end = new Date(pe.end_date);
    setEndDateObj(end);
    setEndInput(end.toLocaleDateString("en-GB"));
  } else {
    setEndDateObj(null);
    setEndInput("");
  }

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

  /* =========================
     DATE VALIDATION
  ========================= */

  if (startDateObj && endDateObj && endDateObj < startDateObj) {
    alert("End Date cannot be before Start Date");
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

      const payload: any = {};

      Object.entries(formData).forEach(([k, v]) => {
        payload[k.replace(/([A-Z])/g, "_$1").toLowerCase()] = v;
      });

      await api.put(
        `/api/principal-employer/${editingId}/update/`,
        payload
      );


      alert("Updated successfully");

    } else {

      const payload = new FormData();

      Object.entries(formData).forEach(([k, v]) =>
        payload.append(k.replace(/([A-Z])/g, "_$1").toLowerCase(), v)
      );

      documents.forEach((d) => payload.append("document", d));

      await api.post(
        "/api/principal-employer/create/",
        payload
      );

      alert("Created successfully");
    }

    /* =========================
       RESET FORM
    ========================= */

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

    /* reset datepicker */

    setStartDateObj(null);
    setEndDateObj(null);
    setStartInput("");
    setEndInput("");
    setStartError("");
    setEndError("");

    setDocuments([]);
    setSelectedRows([]);
    setIsEditMode(false);
    setEditingId(null);

    fetchPEs();

} catch (e: any) {

  console.log(
    "FULL BACKEND ERROR",
    e.response?.data
  );

  alert(
    e.response?.data?.error ||
    JSON.stringify(e.response?.data) ||
    "Something went wrong"
  );
}
finally {
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
        "Valid From (DD/MM/YY)",
        "Valid To (DD/MM/YY)",
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
        api.delete(
          `/api/principal-employer/${id}/delete/`
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
      <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm text-blue-800">
        Editing existing Principal Employer
      </div>
    )}

    {/* 3 COLUMN GRID FORM */}
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

      <div>
        <Label>Name</Label>
        <Input name="name" value={formData.name} onChange={handleChange} />
      </div>

      <div>
        <Label>Short Name</Label>
        <Input name="shortName" value={formData.shortName} onChange={handleChange} />
      </div>

      <div>
        <Label>Contact Person</Label>
        <Input name="contactPerson" value={formData.contactPerson} onChange={handleChange} />
      </div>

      <div>
        <Label>Mobile</Label>
        <Input name="mobile" value={formData.mobile} onChange={handleChange} />
      </div>

      <div>
        <Label>Email</Label>
        <Input name="email" value={formData.email} onChange={handleChange} />
      </div>

      <div>
        <Label>Rules Applicable</Label>
        <select
          className={normalSelectClass}
          name="rulesApplicable"
          value={formData.rulesApplicable}
          onChange={handleChange}
        >
          <option value="">Select</option>
          <option value="central">Central</option>
          <option value="state">State</option>
        </select>
      </div>

      <div>
        <Label>Start Date</Label>

        <DatePicker
          selected={startDateObj}
          value={startInput}
          dateFormat="dd/MM/yyyy"
          placeholderText="dd/mm/yyyy"
          className={dateInputClass}
          onChange={(date: Date | null) => {
            if (date) {
              const formatted = date.toLocaleDateString("en-GB");

              setStartInput(formatted);
              setStartDateObj(date);
              setStartError("");

              setFormData((p) => ({
                ...p,
                startDate: formatForAPI(date),
              }));
            }
          }}
          onChangeRaw={(e) => {
            const value = e.target.value;
            setStartInput(value);

            const parsed = parseDate(value);

            if (parsed) {
              setStartDateObj(parsed);
              setStartError("");

              setFormData((p) => ({
                ...p,
                startDate: formatForAPI(parsed),
              }));
            } else {
              setStartError("Invalid date format (dd/mm/yyyy)");
            }
          }}
        />

        {startError && (
          <p className="text-red-500 text-xs mt-1">{startError}</p>
        )}
      </div>

      <div>
        <Label>End Date</Label>

        <DatePicker
          selected={endDateObj}
          value={endInput}
          dateFormat="dd/MM/yyyy"
          placeholderText="dd/mm/yyyy"
          minDate={startDateObj || undefined}
          className={dateInputClass}
          onChange={(date: Date | null) => {
            if (date) {
              const formatted = date.toLocaleDateString("en-GB");

              setEndInput(formatted);
              setEndDateObj(date);
              setEndError("");

              setFormData((p) => ({
                ...p,
                endDate: formatForAPI(date),
              }));
            }
          }}
          onChangeRaw={(e) => {
            const value = e.target.value;
            setEndInput(value);

            const parsed = parseDate(value);

            if (parsed) {
              setEndDateObj(parsed);
              setEndError("");

              setFormData((p) => ({
                ...p,
                endDate: formatForAPI(parsed),
              }));
            } else {
              setEndError("Invalid date format (dd/mm/yyyy)");
            }
          }}
        />

        {endError && (
          <p className="text-red-500 text-xs mt-1">{endError}</p>
        )}
      </div>

      <div>
        <Label>Nature of Business</Label>
        <Input name="natureOfBusiness" value={formData.natureOfBusiness} onChange={handleChange} />
      </div>

      <div>
        <Label>Establishment Type</Label>
        <Input name="establishmentType" value={formData.establishmentType} onChange={handleChange} />
      </div>

      <div className="xl:col-span-3">
        <Label>HO Address</Label>
        <Input name="hoAddress" value={formData.hoAddress} onChange={handleChange} />
      </div>

    </div>
  </ComponentCard>

  <div className="space-y-6">
    <ComponentCard title="Documents">
      <FileInput
        multiple
        onChange={(e) =>
          e.target.files &&
          Array.from(e.target.files).forEach(addDocument)
        }
      />
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

  {/* RIGHT SIDE (NEW - NON BREAKING) */}
  <div className="flex gap-3 items-center">

    {/* SEARCH */}
    <input
      type="text"
      placeholder="Search PE..."
      className="h-9 px-3 border border-gray-300 rounded-lg text-sm w-52"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />

    {/* RULE FILTER */}
    <select
      className="h-9 px-3 border border-gray-300 rounded-lg text-sm"
      value={ruleFilter}
      onChange={(e) => setRuleFilter(e.target.value)}
    >
      <option value="all">All</option>
      <option value="central">Central</option>
      <option value="state">State</option>
    </select>

  </div>
</div>

          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableCell isHeader className="w-12 px-5 py-3" />
                  {[
                    "Principal Employer",
                    "Short Name",
                    "Contact Person",
                    "Email",
                    "Mobile",
                    "Nature of Business",
                    "Establishment Type",
                    "Valid From (DD/MM/YY)",
                    "Valid To (DD/MM/YY)",
                    "Rules",
                    "Status",
                  ].map((h) => (
                    <TableCell key={h} isHeader className="px-5 py-3 text-xs font-semibold uppercase text-gray-500">
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
                    <TableCell className="px-6 py-5">
                      {formatDate(pe.start_date)}
                    </TableCell>

                    <TableCell className="px-6 py-5">
                      {formatDate(pe.end_date)}
                    </TableCell>
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
<div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
<div className="w-full max-w-[1200px] rounded-2xl bg-white shadow-2xl overflow-hidden border border-gray-200">
        {/* ================= HEADER ================= */}
<div className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">

  <div className="min-w-0">

    <h2 className="truncate text-xl font-semibold tracking-tight text-gray-800">
      {selectedPEObject?.name}
    </h2>

    <p className="mt-1 text-sm text-gray-500">
      Managing mapped branches
    </p>

  </div>

  <button
    onClick={() => setBranchModalOpen(false)}
    className="
      flex
      h-9
      w-9
      items-center
      justify-center
      rounded-lg
      border
      border-gray-200
      text-gray-500
      transition-all
      hover:bg-gray-50
      hover:text-gray-700
    "
  >
    ✕
  </button>

</div>

      {/* ================= BODY ================= */}
<div className="p-6 space-y-6 h-[78vh] overflow-y-auto custom-scrollbar bg-gray-50/40">
<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

  {/* TOTAL */}
  <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">

    <div className="flex items-center justify-between">

      <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
        Total Branches
      </span>

      <span className="text-[10px] text-gray-400">
        Live
      </span>

    </div>

    <div className="mt-2 flex items-end justify-between">

      <div className="text-2xl font-semibold text-gray-800">
        {branchList.length}
      </div>

      <div className="text-[11px] text-gray-400">
        Branches mapped
      </div>

    </div>

  </div>

  {/* ACTIVE */}
  <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">

    <div className="flex items-center justify-between">

      <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
        Active
      </span>

      <span className="text-[10px] text-green-600 font-medium">
        Running
      </span>

    </div>

    <div className="mt-2 flex items-end justify-between">

      <div className="text-2xl font-semibold text-gray-800">
        {
          branchList.filter(
            (b) => b.status === "active"
          ).length
        }
      </div>

      <div className="text-[11px] text-gray-400">
        Operational
      </div>

    </div>

  </div>

  {/* CLOSED */}
  <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">

    <div className="flex items-center justify-between">

      <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
        Closed
      </span>

      <span className="text-[10px] text-red-500 font-medium">
        Disabled
      </span>

    </div>

    <div className="mt-2 flex items-end justify-between">

      <div className="text-2xl font-semibold text-gray-800">
        {
          branchList.filter(
            (b) => b.status === "closed"
          ).length
        }
      </div>

      <div className="text-[11px] text-gray-400">
        Non-operational
      </div>

    </div>

  </div>

  {/* STATES */}
  <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">

    <div className="flex items-center justify-between">

      <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
        States Covered
      </span>

      <span className="text-[10px] text-indigo-500 font-medium">
        Coverage
      </span>

    </div>

    <div className="mt-2 flex items-end justify-between">

      <div className="text-2xl font-semibold text-gray-800">
        {
          new Set(
            branchList.map((b) => b.state)
          ).size
        }
      </div>

      <div className="text-[11px] text-gray-400">
        Unique states
      </div>

    </div>

  </div>

</div>
        {/* ================= ADD / EDIT FORM ================= */}
        <div
          id="branch-form"
          className="
            bg-white
            border
            border-gray-200
            rounded-2xl
            p-6
            space-y-6
            shadow-sm
          "
        >

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">


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
                className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm"
                value={branchData.state}
                onChange={(e) =>
                  setBranchData({ ...branchData, state: e.target.value })
                }
              >
                <option value="">Select State</option>

                {[...states]
                .sort((a, b) =>
                  (a.name || "").localeCompare(
                    b.name || "",
                    undefined,
                    { sensitivity: "base" }
                  )
                )
                .map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* SHORT NAME */}
            <div>
              <Label>Branch Short Name</Label>
              <Input
                className="h-10"
                placeholder="Ex: Pune HO, Mumbai Branch"
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
                className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm"
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
              className="h-10"
              placeholder="Enter complete branch address"
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
                  <div className="flex items-center justify-between text-sm bg-white px-4 py-1.5 rounded-lg border">
                    <a
                      href={`https://apii.complianceclearance.com${branchData.existingDocument}`}
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
<label className="flex items-center justify-between h-10 w-full px-4 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 bg-white transition">                  <span className="text-sm text-gray-600 truncate">
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
            size="sm"
            className="h-9 min-w-[90px] px-4 text-sm"
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
  size="sm"
  className="h-9 min-w-[116px] px-4 text-sm"
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
<div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Mapped Branches
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Total: {branchList.length}
              </p>
            </div>

<div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search branch..."
                  value={branchSearch}
                  onChange={(e) =>
                    setBranchSearch(e.target.value)
                  }
                  className="
                    h-9
                    w-60
                    rounded-lg
                    border
                    border-gray-300
                    bg-white
                    px-3
                    text-sm
                  "
                />

                <Button
                  size="sm"
                  className="h-9 px-4 text-sm"
                  onClick={handleExportBranches}
                >
                    Export
                </Button>

              </div>
          </div>

          {branchList.length === 0 ? (
          <div className="text-center py-14 border border-dashed rounded-xl bg-white">

            <div className="text-sm font-medium text-gray-600">
              No branches mapped yet
            </div>

            <div className="text-xs text-gray-400 mt-1">
              Add your first branch using the form above
            </div>

          </div>
          ) : (

            
<div className="rounded-xl border border-gray-200 overflow-hidden overflow-x-auto custom-scrollbar">
              <table className="w-full text-sm">

<thead className="sticky top-0 z-10 bg-gray-50 text-xs uppercase text-gray-400 tracking-wide">
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

{branchList

  .filter((branch) => {

    const q =
      branchSearch.toLowerCase();

    return (
      branch.short_name
        ?.toLowerCase()
        .includes(q) ||

      branch.state
        ?.toLowerCase()
        .includes(q) ||

      branch.address
        ?.toLowerCase()
        .includes(q)
    );
  })

  // ✅ Alphabetical Order
.sort((a, b) => {

  // ✅ First sort by State
  const stateCompare =
    (a.state || "").localeCompare(
      b.state || "",
      undefined,
      { sensitivity: "base" }
    );

  if (stateCompare !== 0) {
    return stateCompare;
  }

  // ✅ Then sort by Branch Name
  return (a.short_name || "").localeCompare(
    b.short_name || "",
    undefined,
    { sensitivity: "base" }
  );

})

  .map((branch) => (

                        <tr key={branch.id} className="hover:bg-gray-50 transition">

                      <td className="px-5 py-3 font-medium text-gray-700">
                        {selectedPEObject?.name}
                      </td>

                      <td className="px-5 py-3 text-gray-700">
                        {branch.short_name}
                      </td>

                      <td className="px-5 py-3 text-gray-600">
                        {branch.state}
                      </td>

                      <td className="px-5 py-3 text-gray-600">
                        {branch.address}
                      </td>

                      <td className="px-5 py-3">
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

                      <td className="px-5 py-3 text-sm">
                        {branch.document ? (
                          <a
                            href={`https://apii.complianceclearance.com${branch.document}`}
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

                      <td className="px-5 py-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 px-4 text-sm"
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
