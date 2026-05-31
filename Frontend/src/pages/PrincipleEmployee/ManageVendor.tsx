import { useEffect, useState, useMemo } from "react";
import { Button, Modal } from "antd";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const API_BASE = "https://apii.complianceclearance.com/api";

export default function ManageVendor() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [dateFrom, setDateFrom] = useState("");
  const [auditors, setAuditors] = useState([]);
  const [dateTo, setDateTo] = useState("");

  const [editingRowId, setEditingRowId] = useState(null);
  const [editData, setEditData] = useState<any>({});
  const [isDirty, setIsDirty] = useState(false);
  const [effectiveDate, setEffectiveDate] = useState(new Date());
  const [documents, setDocuments] = useState([]); // master list
const [selectedDocuments, setSelectedDocuments] = useState([]); // selected docs

  const [selectedDoc, setSelectedDoc] = useState("");
  // ✅ DATE STATES (same as VendorMapping)
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [startDate, endDate] = dateRange;

  const [startInput, setStartInput] = useState("");
  const [endInput, setEndInput] = useState("");

  const [startError, setStartError] = useState("");
  const [endError, setEndError] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [filters, setFilters] = useState({
    vendor_short_name: "",
    vendor_name: "",
    state: "",
    branch: "",
    audit_rule: "",
    audit_frequency: "",
    auditor_name: "",
    nature_of_services: "",
  });

  const token = localStorage.getItem("access_token");

  const headers = {
    Authorization: `Bearer ${token}`,
  };

useEffect(() => {
  fetchVendors();
  fetchDocuments();
  fetchAuditors();
}, []);


const fetchAuditors = async () => {
  try {
    const res = await fetch(`${API_BASE}/auditor/list/`, {
      headers,
    });

    const data = await res.json();

    setAuditors(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error(err);
  }
};

const fetchDocuments = async () => {
  try {
    const res = await fetch(`${API_BASE}/document-master/list/`, {
      headers,
    });
    const data = await res.json();
    setDocuments(data);
  } catch (err) {
    console.error(err);
  }
};

const calculateStatus = (endDate) => {
  if (!endDate) return "Active";

  const today = new Date();
  const end = new Date(endDate);

  const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));

  if (diff < 0) return "Expired";
  if (diff <= 7) return "Expiring Soon";
  return "Active";
};

const fetchVendors = async () => {
  try {
    const res = await fetch(`${API_BASE}/vendor/mapping/list/`, {
      headers,
    });
    const data = await res.json();

    console.log("API DATA:", data);   // 👈 ADD THIS

    setVendors(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
};

  // ✅ EXPORT EXCEL (UNCHANGED)
  const exportToExcel = () => {
    if (!filteredVendors.length) {
      alert("No data to export");
      return;
    }

    const exportData = filteredVendors.map((v) => ({
      "Vendor Short Name": v.vendor_short_name,
      "Vendor Name": v.vendor_name,
      State: v.state,
      Branch: v.branch,
      "Agreement Start Date": formatDate(v.start_date),
      "Agreement End Date": formatDate(v.end_date),
      "Audit Rule": v.audit_rule,
      "Audit Frequency": v.audit_frequency,
      "Assigned Auditor": v.auditor_name,
      "Vendor SPOC Email": v.vendor_email,
      "SPOC Mobile": v.vendor_mobile,
      "Nature of Services": v.nature_of_services,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Vendors");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const file = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(file, `Vendor_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const parseCustomDate = (dateStr) => {
    if (!dateStr) return null;
    if (dateStr.includes("-")) return new Date(dateStr);

    const parts = dateStr.split("/");
    if (parts.length !== 3) return null;

    let [day, month, year] = parts.map(Number);
    if (year < 100) year += year > 50 ? 1900 : 2000;

    return new Date(year, month - 1, day);
  };

  const formatDate = (dateStr) => {
    const d = parseCustomDate(dateStr);
    if (!d) return "-";

    return `${String(d.getDate()).padStart(2, "0")}/${String(
      d.getMonth() + 1
    ).padStart(2, "0")}/${String(d.getFullYear()).slice(-2)}`;
  };

  const parseDate = (value: string) => {
  const regex = /^\d{2}\/\d{2}\/\d{4}$/;
  if (!regex.test(value)) return null;

  const [day, month, year] = value.split("/").map(Number);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) return null;

  return date;
};

const formatForAPI = (date: Date | null) => {
  if (!date) return null;
  return date.toISOString().split("T")[0];
};

const getUniqueValues = (key) => {

  return [...new Set(

    vendors
      .map((v) => v[key])
      .filter(Boolean)

  )]

  .sort((a, b) =>

    String(a).localeCompare(
      String(b),
      undefined,
      { sensitivity: "base" }
    )
  );
};

  // ✅ OPEN MODAL
const handleEdit = (vendor) => {
  setEditingRowId(vendor.id);

  const start = parseCustomDate(vendor.start_date);
  const end = parseCustomDate(vendor.end_date);

  setDateRange([start, end]);
  setEffectiveDate(new Date());

  setStartInput(start ? start.toLocaleDateString("en-GB") : "");
  setEndInput(end ? end.toLocaleDateString("en-GB") : "");

  setEditData({
    start_date: vendor.start_date || "",
    end_date: vendor.end_date || "",
    audit_rule: vendor.rule || "",
    audit_frequency: vendor.frequency || "",
    auditor_id: vendor.auditor_id || "",
  });

  setSelectedDocuments(
    (vendor.documents || []).map((doc) => {
      // already object
      if (doc?.id) return doc;

      // convert ID → object
      const found = documents.find((d) => d.id === doc);
      return found || { id: doc, name: `Doc ${doc}` };
    })
  );
  setSelectedDoc(""); // ✅ reset dropdown

  setIsDirty(false); // ✅ NEW
  setOpen(true);
};

const handleCancel = () => {
  if (isDirty && !window.confirm("Unsaved changes will be lost. Continue?")) return;

  setOpen(false);
  setSelectedDocuments([]);
  setIsDirty(false);
};

const getLiveStatus = () => {
  if (!endDate) return null;

  const today = new Date();
  const diff = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

  if (diff < 0) return "Expired";
  if (diff <= 7) return "Expiring Soon";
  return "Active";
};

const handleSave = async () => {
  setSaving(true);

  // ✅ VALIDATION (runs only on click)
  if (!startDate || !endDate) {
    alert("Please select both Start Date and End Date");
    setSaving(false);
    return;
  }

  if (endDate <= startDate) {
    alert("End Date must be after Start Date");
    setSaving(false);
    return;
  }

  try {
    const payload = {
      ...editData,

      rule: editData.audit_rule,
      frequency: editData.audit_frequency,
      auditor: editData.auditor_id || null,

      start_date: formatForAPI(startDate),
      end_date: formatForAPI(endDate),
      effective_date: formatForAPI(effectiveDate || new Date()),

      // ✅ ADD THIS LINE
      documents: selectedDocuments.map((d) => d.id),
      document_ids: selectedDocuments.map((d) => d.id),
    };

    console.log("🚀 FINAL PAYLOAD:", payload);

    const res = await fetch(
      `${API_BASE}/vendor/vendor-mapping/${editingRowId}/`,
      {
        method: "PATCH",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error("🚨 BACKEND ERROR:", errorData);
      alert(JSON.stringify(errorData));
      throw new Error("Update failed");
    }

    // ✅ refresh data
    fetchVendors();
    setOpen(false);

  } catch (err) {
    console.error(err);
    alert("Failed to update");
  } finally {
    setSaving(false);
  }
};

const handleChange = (field, value) => {
  setIsDirty(true);
  setEditData((prev) => ({ ...prev, [field]: value }));
};

  // ✅ FILTER LOGIC (UNCHANGED)
  const filteredVendors = useMemo(() => {
    let result = [...vendors];

    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter((v) =>
        Object.values(v)
  .map(val => (typeof val === "object" ? JSON.stringify(val) : val))
  .join(" ").toLowerCase().includes(query)
      );
    }

    Object.keys(filters).forEach((key) => {
      if (filters[key]) {
        result = result.filter((v) => v[key] === filters[key]);
      }
    });

    if (dateFrom || dateTo) {
      const from = dateFrom ? new Date(dateFrom) : null;
      const to = dateTo ? new Date(dateTo) : null;

      result = result.filter((v) => {
        const start = parseCustomDate(v.start_date);
        const end = parseCustomDate(v.end_date);
        if (!start || !end) return false;

        if (from && !to) return end >= from;
        if (!from && to) return start <= to;
        return start <= to && end >= from;
      });
    }

    return result.sort((a, b) => {

      // Active first
      if (a.status !== b.status) {

        return a.status === "Active"
          ? -1
          : 1;
      }

      // Then alphabetical
      return (a.vendor_short_name || "")
        .localeCompare(

          b.vendor_short_name || "",

          undefined,

          { sensitivity: "base" }
        );
    });

  }, [vendors, search, filters, dateFrom, dateTo]);

  return (
    <div>
      <PageMeta title="Manage Vendors | HR Compliance" />
      <PageBreadcrumb pageTitle="Manage Vendors" />

      <ComponentCard title="Vendor Mapping Overview">

        {/* ✅ TOP BAR (RESTORED) */}
        <div className="mb-4 flex items-center gap-4">
          <input
            type="text"
            placeholder="Search vendors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 px-4 py-2 border rounded-lg text-sm"
          />

          <div className="ml-auto flex gap-2">
            <button onClick={exportToExcel} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg">
              Export Excel
            </button>

            <button
              onClick={() => {
                setFilters({
                  vendor_short_name: "",
                  vendor_name: "",
                  state: "",
                  branch: "",
                  audit_rule: "",
                  audit_frequency: "",
                  auditor_name: "",
                  nature_of_services: "",
                });
                setSearch("");
                setDateFrom("");
                setDateTo("");
              }}
              className="px-4 py-2 text-sm bg-gray-100 rounded-lg"
            >
              Reset
            </button>
          </div>
        </div>

        {/* ✅ TABLE */}
        <div className="overflow-x-auto border rounded-xl">
          <table className="min-w-[1300px] w-full text-sm">

      <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                {[
                "Status","Vendor Short Name","Vendor Name","State","Branch",
                "Agreement Start Date","Agreement End Date",
                "Audit Rule","Audit Frequency","Assigned Auditor",
                "Mapped Documents",   // 👈 ADD THIS
                "Vendor SPOC Email ID","SPOC Mobile Number","Nature of Services",
                "Actions"
              ].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs text-left">{h}</th>
                ))}
              </tr>

              {/* FILTER ROW */}
              <tr>
                {[
                  null,"vendor_short_name","vendor_name","state","branch",
                  "start_date","end_date",
                  "audit_rule","audit_frequency","auditor_name",
                  null,null,"nature_of_services",
                  null
                ].map((key, i) => (
                  <th key={i} className="px-2 py-2">

                    {key === "start_date" && (
                      <input type="date" value={dateFrom}
                        onChange={(e)=>setDateFrom(e.target.value)}
                        className="w-full border rounded px-2 py-1 text-xs" />
                    )}

                    {key === "end_date" && (
                      <input type="date" value={dateTo}
                        onChange={(e)=>setDateTo(e.target.value)}
                        className="w-full border rounded px-2 py-1 text-xs" />
                    )}

                    {key && key !== "start_date" && key !== "end_date" && (
                      <select
                        value={filters[key]}
                        onChange={(e)=>setFilters({...filters,[key]:e.target.value})}
                        className="w-full border rounded px-2 py-1 text-xs"
                      >
                        <option value="">All</option>
                        {getUniqueValues(key).map((val)=>(
                          <option key={val} value={val}>{val}</option>
                        ))}
                      </select>
                    )}

                  </th>
                ))}
              </tr>

            </thead>

            <tbody>
              {filteredVendors.map((v) => (
<tr
  key={v.id}
className={`border-t hover:bg-gray-50 transition ${
  v.status === "Inactive"
    ? "bg-red-50"
    : calculateStatus(v.end_date) === "Expiring Soon"
    ? "bg-yellow-50"
    : ""
}`}
>
  <td className="px-4 py-3">
    <span className={`px-2 py-1 rounded text-xs font-semibold ${
      v.status === "Active"
        ? "bg-green-100 text-green-700"
        : "bg-red-100 text-red-700"
    }`}>
      {v.status}
    </span>
  </td>

  <td className="px-4 py-3 font-medium">{v.vendor_short_name || "-"}</td>
  <td className="px-4 py-3">{v.vendor_name || "-"}</td>
  <td className="px-4 py-3">{v.state || "-"}</td>
  <td className="px-4 py-3">{v.branch_name || "-"}</td>

  <td className="px-4 py-3">{formatDate(v.start_date)}</td>
  <td className="px-4 py-3">{formatDate(v.end_date)}</td>

  <td className="px-4 py-3">{v.rule || "-"}</td>
  <td className="px-4 py-3">{v.frequency || "-"}</td>
  <td className="px-4 py-3">{v.auditor_name || "-"}</td>

{/* ✅ DOCUMENTS */}
<td className="px-4 py-3 max-w-[250px]">
  <div className="flex flex-wrap gap-1">
    {Array.isArray(v.documents) && v.documents.length > 0 ? (
      v.documents.map((doc) => {
        // ✅ CASE 1: already object with name
        if (doc && typeof doc === "object" && doc.name) {
          return (
            <span
              key={doc.id}
              className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded truncate max-w-[120px]"
              title={doc.name}
            >
              {doc.name}
            </span>
          );
        }

        // ✅ CASE 2: only ID → find from master documents
        const foundDoc = documents.find((d) => d.id === doc);

        return (
          <span
            key={doc}
            className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded truncate max-w-[120px]"
            title={foundDoc?.name || `Doc ${doc}`}
          >
            {foundDoc?.name || `Doc ${doc}`}
          </span>
        );
      })
    ) : (
      "-"
    )}
  </div>
</td>

  <td className="px-4 py-3">{v.vendor_email || "-"}</td>
  <td className="px-4 py-3">{v.vendor_mobile || "-"}</td>
  <td className="px-4 py-3">{v.nature_of_services || "-"}</td>

  <td className="px-4 py-3">
    <Button type="primary" size="small" onClick={() => handleEdit(v)}>
      Edit
    </Button>
  </td>

</tr>
              ))}
            </tbody>

          </table>
        </div>
      </ComponentCard>

      {/* ✅ ANT MODAL */}
<Modal
  open={open}
  onCancel={handleCancel}
  footer={null}
  width={750}
  centered
  style={{ borderRadius: "16px" }}
  bodyStyle={{
    padding: "20px",
    maxHeight: "80vh",
    overflowY: "auto",
    borderRadius: "16px",
  }}
>
  <div className="bg-white rounded-2xl space-y-5 text-sm">

    {/* 🔹 HEADER */}
    <div className="flex justify-between items-center">
      <h2 className="font-semibold text-lg tracking-tight">
        Edit Vendor Mapping
      </h2>

      <span
        className={`px-3 py-1 rounded-full text-xs font-medium shadow-sm ${
          getLiveStatus() === "Expired"
            ? "bg-red-100 text-red-700"
            : getLiveStatus() === "Expiring Soon"
            ? "bg-yellow-100 text-yellow-700"
            : "bg-green-100 text-green-700"
        }`}
      >
        {getLiveStatus() || "Active"}
      </span>
    </div>

    {/* 🔹 DATES */}
    <div className="grid grid-cols-2 gap-3">
      <DatePicker
        selected={startDate}
        onChange={(date) => {
          if (date) {
            setDateRange([date, endDate]);
            handleChange("start_date", formatForAPI(date));
          }
        }}
        className="w-full h-10 border border-gray-200 rounded-lg px-3 text-sm 
        focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
        placeholderText="Start Date"
      />

<DatePicker
  selected={endDate}
  onChange={(date) => {
    if (date) {
      setDateRange([startDate, date]);
      handleChange("end_date", formatForAPI(date));
    }
  }}
  className="w-full h-10 border border-gray-200 rounded-lg px-3 text-sm 
  focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
  placeholderText="End Date"
/>
    </div>

    {/* 🔹 AUDIT */}
    <div className="grid grid-cols-3 gap-3">

    <select
  value={editData.audit_rule || ""}
  onChange={(e) => handleChange("audit_rule", e.target.value)}
    className="h-10 border border-gray-200 rounded-lg px-3 text-sm 
        focus:ring-2 focus:ring-blue-500 outline-none hover:border-gray-300"
>
  <option value="">Rule</option>
  {getUniqueValues("rule").map((val) => (
    <option key={val}>{val}</option>
  ))}
</select>

<select
  value={editData.audit_frequency || ""}
  onChange={(e) => handleChange("audit_frequency", e.target.value)}
    className="h-10 border border-gray-200 rounded-lg px-3 text-sm 
        focus:ring-2 focus:ring-blue-500 outline-none hover:border-gray-300"
>
  <option value="">Frequency</option>
  {getUniqueValues("frequency").map((val) => (
    <option key={val}>{val}</option>
  ))}
</select>

    <select
      value={editData.auditor_id || ""}
      onChange={(e) => handleChange("auditor_id", e.target.value)}
      className="h-10 border border-gray-200 rounded-lg px-3 text-sm 
      focus:ring-2 focus:ring-blue-500 outline-none hover:border-gray-300"
    >
      <option value="">Select Auditor</option>

    {[...auditors]

      .sort((a, b) =>

        a.name.localeCompare(
          b.name,
          undefined,
          { sensitivity: "base" }
        )
      )

      .map((auditor) => (
            <option key={auditor.id} value={auditor.id}>
          {auditor.name}
        </option>
      ))}
    </select>

    </div>

    {/* 🔹 DOCUMENTS */}
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedDocuments.length > 0 ? (
          [...selectedDocuments]
          .sort((a, b) =>

            a.name.localeCompare(
              b.name,
              undefined,
              { sensitivity: "base" }
            )
          )

          .map((doc) => (
            <span
              key={doc.id}
              className="bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-full border border-blue-200 flex items-center gap-1"
            >
              {doc.name}
              <button
                onClick={() =>
                  setSelectedDocuments(
                    selectedDocuments.filter((d) => d.id !== doc.id)
                  )
                }
                className="text-red-500"
              >
                ✕
              </button>
            </span>
          ))
        ) : (
          <span className="text-xs text-gray-400">No documents</span>
        )}
      </div>

      <div className="flex gap-2">
        <select
          value={selectedDoc}
          onChange={(e) => setSelectedDoc(e.target.value)}
          className="flex-1 h-10 border border-gray-200 rounded-lg px-3 text-sm 
          focus:ring-2 focus:ring-blue-500 outline-none hover:border-gray-300"
        >
          <option value="">Add Document</option>
          {[...documents]

            .sort((a, b) =>

              a.name.localeCompare(
                b.name,
                undefined,
                { sensitivity: "base" }
              )
            )

            .map((doc) => (
                <option key={doc.id} value={doc.id}>
              {doc.name}
            </option>
          ))}
        </select>

        <button
          onClick={() => {
            const doc = documents.find((d) => d.id == selectedDoc);
            if (doc && !selectedDocuments.some((d) => d.id === doc.id)) {
              setSelectedDocuments([...selectedDocuments, doc]);
              setSelectedDoc("");
            }
          }}
          className="px-4 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition"
        >
          +
        </button>
      </div>
    </div>

    {/* 🔹 FOOTER */}
    <div className="flex justify-between items-center pt-3 border-t">

      <DatePicker
        selected={effectiveDate}
        onChange={(date) => setEffectiveDate(date)}
        className="h-10 border border-gray-200 rounded-lg px-3 text-sm 
        focus:ring-2 focus:ring-blue-500 outline-none"
      />

      <div className="flex gap-2">
        <button
          onClick={handleCancel}
          className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
        >
          Cancel
        </button>

        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition"
        >
          Save
        </button>
      </div>

    </div>

  </div>
</Modal>
    </div>
  );
}