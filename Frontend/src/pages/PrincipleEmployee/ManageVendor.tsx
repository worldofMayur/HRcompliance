import { useEffect, useState, useMemo } from "react";
import { Button, Modal } from "antd";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const API_BASE = "http://127.0.0.1:8000/api";

export default function ManageVendor() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [editingRowId, setEditingRowId] = useState(null);
  const [editData, setEditData] = useState({});
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
  }, []);

  const fetchVendors = async () => {
    try {
      const res = await fetch(`${API_BASE}/vendor-mapping/list/`, {
        headers,
      });
      const data = await res.json();
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

  const getUniqueValues = (key) => {
    return [...new Set(vendors.map((v) => v[key]).filter(Boolean))];
  };

  // ✅ OPEN MODAL
  const handleEdit = (vendor) => {
    setEditingRowId(vendor.id);
    setEditData({
      start_date: vendor.start_date || "",
      end_date: vendor.end_date || "",
      audit_rule: vendor.audit_rule || "",
      audit_frequency: vendor.audit_frequency || "",
      auditor_name: vendor.auditor_name || "",
    });
    setOpen(true);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/vendor/vendor-mapping/${editingRowId}/`, {
        method: "PATCH",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editData),
      });

      if (!res.ok) throw new Error("Update failed");

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
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  // ✅ FILTER LOGIC (UNCHANGED)
  const filteredVendors = useMemo(() => {
    let result = [...vendors];

    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter((v) =>
        Object.values(v).join(" ").toLowerCase().includes(query)
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
    if (a.status === b.status) return 0;
    return a.status === "Active" ? -1 : 1;
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

            <thead className="bg-gray-50">
              <tr>
                {[
                  "Status","Vendor Short Name","Vendor Name","State","Branch",
                  "Agreement Start Date","Agreement End Date",
                  "Audit Rule","Audit Frequency","Assigned Auditor",
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
                <tr key={v.id} className="border-t">
                  {/* ✅ STATUS COLUMN */}
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        v.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {v.status}
                    </span>
                  </td>

                  <td className="px-4 py-3">{v.vendor_short_name}</td>
                  <td className="px-4 py-3">{v.vendor_name}</td>
                  <td className="px-4 py-3">{v.state}</td>
                  <td className="px-4 py-3">{v.branch}</td>
                  <td className="px-4 py-3">{formatDate(v.start_date)}</td>
                  <td className="px-4 py-3">{formatDate(v.end_date)}</td>
                  <td className="px-4 py-3">{v.audit_rule}</td>
                  <td className="px-4 py-3">{v.audit_frequency}</td>
                  <td className="px-4 py-3">{v.auditor_name}</td>
                  <td className="px-4 py-3">{v.vendor_email}</td>
                  <td className="px-4 py-3">{v.vendor_mobile}</td>
                  <td className="px-4 py-3">{v.nature_of_services}</td>

                  <td className="px-4 py-3">
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => handleEdit(v)}
                  >
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
  title="Edit Vendor"
  onCancel={handleCancel}
  footer={[
    <Button key="cancel" onClick={handleCancel}>
      Cancel
    </Button>,
    <Button key="save" type="primary" loading={saving} onClick={handleSave}>
      Save
    </Button>,
  ]}
>
  <div className="grid grid-cols-2 gap-4">

    {/* START DATE */}
    <div className="flex flex-col">
      <label className="text-xs mb-1">Agreement Start Date</label>
      <input
        type="date"
        value={editData.start_date || ""}
        onChange={(e) => handleChange("start_date", e.target.value)}
        className="border rounded px-3 py-2 text-sm"
      />
    </div>

    {/* END DATE */}
    <div className="flex flex-col">
      <label className="text-xs mb-1">Agreement End Date</label>
      <input
        type="date"
        value={editData.end_date || ""}
        onChange={(e) => handleChange("end_date", e.target.value)}
        className="border rounded px-3 py-2 text-sm"
      />
    </div>

    {/* AUDIT RULE DROPDOWN */}
    <div className="flex flex-col">
      <label className="text-xs mb-1">Audit Rule</label>
      <select
        value={editData.audit_rule || ""}
        onChange={(e) => handleChange("audit_rule", e.target.value)}
        className="border rounded px-3 py-2 text-sm"
      >
        <option value="">Select</option>
        {getUniqueValues("audit_rule").map((val) => (
          <option key={val} value={val}>{val}</option>
        ))}
      </select>
    </div>

    {/* AUDIT FREQUENCY DROPDOWN */}
    <div className="flex flex-col">
      <label className="text-xs mb-1">Audit Frequency</label>
      <select
        value={editData.audit_frequency || ""}
        onChange={(e) => handleChange("audit_frequency", e.target.value)}
        className="border rounded px-3 py-2 text-sm"
      >
        <option value="">Select</option>
        {getUniqueValues("audit_frequency").map((val) => (
          <option key={val} value={val}>{val}</option>
        ))}
      </select>
    </div>

    {/* AUDITOR DROPDOWN */}
    <div className="flex flex-col col-span-2">
      <label className="text-xs mb-1">Assigned Auditor</label>
      <select
        value={editData.auditor_name || ""}
        onChange={(e) => handleChange("auditor_name", e.target.value)}
        className="border rounded px-3 py-2 text-sm"
      >
        <option value="">Select</option>
        {getUniqueValues("auditor_name").map((val) => (
          <option key={val} value={val}>{val}</option>
        ))}
      </select>
    </div>

  </div>
</Modal>

    </div>
  );
}