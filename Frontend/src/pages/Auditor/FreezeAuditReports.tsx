import { useEffect, useState } from "react";
import axios from "axios";
import { Table, Modal, Button, Spin, Tag, Empty } from "antd";
import {
  DownloadOutlined,
  FileTextOutlined,
CloseOutlined,
SafetyCertificateOutlined,
SearchOutlined,
FileDoneOutlined,
} from "@ant-design/icons";
const API_BASE = import.meta.env.VITE_API_URL;

export default function FreezeAuditReports() {

  const token =
    localStorage.getItem(
      "access_token"
    );

  const authHeader = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const [loading, setLoading] =
    useState(false);

  const [reports, setReports] =
    useState<any[]>([]);

  const [selectedReport, setSelectedReport] =
    useState<any>(null);

  const [open, setOpen] =
    useState(false);

  const [downloadingId, setDownloadingId] =
    useState<number | null>(null);

  const [search, setSearch] =
  useState("");

  const [statusFilter, setStatusFilter] =
  useState("all");

  useEffect(() => {

    loadReports();

  }, []);

  const loadReports = async () => {

    try {

      setLoading(true);

      const res = await axios.get(
        `${API_BASE}/api/auditor/freeze-audit-reports/`,
        authHeader
      );

      setReports(res.data);

    } catch (err) {

      console.error(err);

    } finally {

      setLoading(false);
    }
  };

  const openReport = (
    record: any
  ) => {

    setSelectedReport(record);

    setOpen(true);
  };

  const downloadPDF = async (
    id: number
  ) => {

    try {

      setDownloadingId(id);

      const response =
        await axios.get(

          `${API_BASE}/api/auditor/download-cc-pdf/${id}/`,

          {
            ...authHeader,

            responseType: "blob",
          }
        );

      const blobUrl =
        window.URL.createObjectURL(

          new Blob([response.data])
        );

      const link =
        document.createElement("a");

      link.href = blobUrl;

      const disposition =
        response.headers[
          "content-disposition"
        ];

      let filename =
        "Compliance_Certificate.pdf";

      if (disposition) {

        const match =
          disposition.match(
            /filename="?([^"]+)"?/
          );

        if (
          match &&
          match[1]
        ) {

          filename = match[1];
        }
      }

      link.setAttribute(
        "download",
        filename
      );

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(
        blobUrl
      );

    } catch (err) {

      console.error(err);

    } finally {

      setDownloadingId(null);
    }
  };

  const getStatusClass = (
    status: string
  ) => {

    if (
      status === "Complied"
    ) {

      return (
        "bg-green-50 text-green-700 border border-green-200"
      );
    }

    if (
      status === "Not Complied"
    ) {

      return (
        "bg-red-50 text-red-700 border border-red-200"
      );
    }

    if (
      status?.includes(
        "Exceptional Approval"
      )
    ) {

      return (
        "bg-green-50 text-green-700 border border-green-200"
      );
    }

    return (
      "bg-yellow-50 text-yellow-700 border border-yellow-200"
    );
  };


const getUniqueEntries = (entries: any[] = []) => {
  const seen = new Set<string>();

  return entries.filter((entry) => {
    const key = JSON.stringify([
      entry.state ?? "",
      entry.act_name ?? "",
      entry.section ?? "",
      entry.form_number ?? "",
      entry.document_name ?? "",
      entry.audit_particular ?? "",
      entry.status ?? "",
      entry.observation ?? "",
      entry.recommendation ?? "",
    ]);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};


  const filteredReports =
  reports.filter((r) => {

    const searchText = `
      ${r.vendor_name}
      ${r.pe_name}
      ${r.branch_name}
      ${r.audit_period}
      ${r.state}
    `.toLowerCase();

    const matchesSearch =
      searchText.includes(
        search.toLowerCase()
      );

    if (!matchesSearch) {
      return false;
    }

    if (
      statusFilter ===
      "exceptional"
    ) {

      return r.entries?.some(
        (e: any) =>
          e.status?.includes(
            "Exceptional Approval"
          )
      );
    }

    return true;
  });

  const columns = [

    {
      title: "Vendor",

      dataIndex: "vendor_name",

      render: (
        text: string
      ) => (

        <div className="font-medium text-gray-800">
          {text || "-"}
        </div>
      ),
    },

    {
      title: "PE",

      dataIndex: "pe_name",

      render: (
        text: string
      ) => (

        <div className="text-gray-700">
          {text || "-"}
        </div>
      ),
    },

    {
      title: "State",

      dataIndex: "state",

      render: (
        text: string
      ) => (

        <Tag
          color="default"
          className="
            rounded-full
            border-gray-200
            bg-gray-50
            px-2.5 py-[1px]
            text-gray-600
          "
        >
          {text || "-"}
        </Tag>
      ),
    },

    {
      title: "Branch",

      dataIndex: "branch_name",

      render: (
        text: string
      ) => (

        <div className="text-gray-700">
          {text || "-"}
        </div>
      ),
    },

    {
      title: "Audit Period",

      dataIndex: "audit_period",

      render: (
        text: string
      ) => (

        <div className="font-medium text-gray-800">
          {text || "-"}
        </div>
      ),
    },

    {
      title: "Frozen On",
      dataIndex: "frozen_at",

      render: (value: string) =>
        value
          ? new Date(value).toLocaleString("en-IN")
          : "-",
    },

    {
  title: "Status",

  width: 180,

  render: (_: any, record: any) => {

    const hasExceptional =
      record.entries?.some(
        (e: any) =>
          e.status?.includes(
            "Exceptional Approval"
          )
      );

return hasExceptional ? (

  <span
    className="
      inline-flex items-center
      gap-1
      rounded-full
      border border-green-200
      bg-green-50
      px-3 py-1
      text-xs
      font-medium
      text-green-700
    "
  >

    <span
      className="
        h-1.5 w-1.5
        rounded-full
        bg-blue-500
      "
    />

    Complied + Exception

  </span>

    ) : (

      <span
        className="
          rounded-full
          border border-green-200
          bg-green-50
          px-3 py-1
          text-xs
          font-medium
          text-green-700
        "
      >
        Complied
      </span>
    );
  },
},

    {
      title: "Action",

      width: 180,

      render: (
        _: any,
        record: any
      ) => (

        <Button
          type="primary"

          icon={
            <FileTextOutlined />
          }

          disabled={
            !record.entries?.length
          }

          onClick={() =>
            openReport(record)
          }

          className="
            rounded-xl
            border-0
            bg-blue-600
            px-4
            font-medium
            shadow-none
            hover:bg-blue-700
          "
        >
          View Audit Report/ CC
        </Button>
      ),
    },
  ];

  return (

    <div className="mx-auto w-full min-w-0 max-w-[1800px] space-y-5 px-3 py-4 sm:px-5 sm:py-6 lg:px-7">

      {/* HEADER */}

     <div
        className="
          mb-2
          flex
          flex-col
          gap-2
        "
      >

        <h1
        className="
        text-xl
        font-semibold
        tracking-tight
        text-gray-900
        sm:text-2xl
        "
        >
          Freeze Audit Reports
        </h1>

        <p className="
          mt-1
          text-sm
          text-gray-500
        ">
          View frozen compliance reports
          and download CC certificates.
        </p>

      </div>

      {/* STATS */}

<div
  className="
  grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 xl:gap-4
  "
>

{/* TOTAL */}

<div
  className="
    rounded-3xl
    border border-gray-100
    bg-gradient-to-br from-white to-gray-50
    p-4 sm:p-5
    shadow-sm
    transition-all duration-300
    hover:-translate-y-[2px]
    hover:shadow-md
  "
>

  <div className="flex items-center justify-between">

    <div>

      <div className="text-sm text-gray-500">
        Total Frozen Reports
      </div>

      <div
        className="
          mt-2
          text-3xl
          font-semibold
          text-gray-900
        "
      >
        {reports.length}
      </div>

    </div>

    <div
      className="
        flex h-12 w-12
        items-center justify-center
        rounded-2xl
        bg-gray-100
        text-gray-700
      "
    >
      <FileDoneOutlined className="text-xl" />
    </div>

  </div>

</div>

  {/* EXCEPTIONAL */}

  <div
    className="
      rounded-3xl
      border border-blue-100
      bg-blue-50
      p-5
    "
  >

    <div className="text-sm text-blue-600">
      Exceptional Approvals
    </div>

    <div
      className="
        mt-2
        text-3xl
        font-semibold
        text-blue-700
      "
    >
      {
        reports.filter((r) =>
          r.entries?.some(
            (e: any) =>
              e.status?.includes(
                "Exceptional Approval"
              )
          )
        ).length
      }
    </div>
  </div>

  {/* COMPLIANCE */}

  <div
    className="
      rounded-3xl
      border border-green-100
      bg-green-50
      p-5
    "
  >

    <div className="text-sm text-green-600">
      Frozen Audits
    </div>

    <div
      className="
        mt-2
        text-3xl
        font-semibold
        text-green-700
      "
    >
      {reports.length}
    </div>
  </div>
</div>

      {/* TABLE CARD */}

      {/* SEARCH + FILTER */}

<div
className="
mb-5
flex
flex-col
gap-4
xl:flex-row
xl:items-center
xl:justify-between
"
>

<div className="relative min-w-0 w-full xl:max-w-[420px]">

  <SearchOutlined
    className="
      absolute left-4 top-1/2
      -translate-y-1/2
      text-gray-400
    "
  />

  <input
    type="text"

    placeholder="
      Search vendor, branch, audit period...
    "

    value={search}

    onChange={(e) =>
      setSearch(e.target.value)
    }

    className="
      h-11
      w-full
      xl:w-full
      rounded-2xl
      border border-gray-200
      bg-gray-50
      pl-11 pr-4
      text-sm
      text-gray-700
      outline-none
      transition-all duration-200
      placeholder:text-gray-400
      focus:border-blue-400
      focus:bg-white
      focus:ring-4
      focus:ring-blue-50
    "
  />
</div>

  {/* FILTERS */}

 <div
  className="
  flex
  flex-wrap
  gap-2
  "
  >

    {[
      {
        key: "all",
        label: "All Reports",
      },

      {
        key: "exceptional",
        label: "Exceptional",
      },
    ].map((item) => (

      <button
        key={item.key}

        onClick={() =>
          setStatusFilter(
            item.key
          )
        }

        className={`
          rounded-xl
          px-4
          py-2.5
          text-sm
          font-medium
          transition

          ${
            statusFilter ===
            item.key

              ? "bg-blue-600 text-white"

              : `
                border border-gray-200
                bg-white
                text-gray-600
                hover:bg-gray-50
              `
          }
        `}
      >

<div className="flex items-center gap-2">

  <span>
    {item.label}
  </span>

  <span
    className="
      rounded-full
      bg-white/20
      px-2 py-[1px]
      text-[10px]
    "
  >

    {
      item.key === "all"

        ? reports.length

        : reports.filter((r) =>
            r.entries?.some(
              (e: any) =>
                e.status?.includes(
                  "Exceptional Approval"
                )
            )
          ).length
    }

  </span>

</div>
      </button>
    ))}
  </div>
</div>

      <div className="
        rounded-3xl
        border border-gray-200
        bg-white
        p-4
        shadow-[0_1px_2px_rgba(0,0,0,0.04)]
      ">

        {loading ? (

          <div className="
            flex justify-center py-20
          ">
            <Spin size="large" />
          </div>

        ) : (

          <Table
            rowKey="id"

            columns={columns}
            scroll={{ x: 1060 }}

            dataSource={filteredReports}

            bordered={false}

            size="middle"
            className="freeze-audit-table"
            style={{ width: "100%" }}

            pagination={{
              pageSize: 5,
              showSizeChanger: false,
              size: "small",
              responsive: true,
              showLessItems: true,
            }}

            locale={{
              emptyText: (

                <Empty
                  description="
                    No Freeze Audit Reports Available
                  "
                />
              ),
            }}
          />
        )}
      </div>

      {/* MODAL */}
      <Modal
        open={open}
        footer={null}
        onCancel={() => setOpen(false)}
        width="calc(100vw - 24px)"
        style={{ maxWidth: 1640, top: 12, paddingBottom: 0 }}
        rootClassName="freeze-report-modal"
        destroyOnClose

        closable={false}

        styles={{
          body: {
            padding: 0,
            height: "calc(100dvh - 24px)",
            maxHeight: "calc(100dvh - 24px)",
            overflow: "hidden",

            background:
              "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",

            backdropFilter: "blur(8px)",

            borderRadius: "16px",
          },
        }}
      >

        {selectedReport && (


        <div
          className="
            flex flex-col
            h-full
            max-h-full
            min-h-0
            overflow-hidden
            rounded-xl
          "
        >


{/* MODAL HEADER */}

<div
  className="
    z-20 shrink-0
    border-b border-gray-100
    bg-white/95
    backdrop-blur
  "
>

  <div
    className="
      flex flex-col gap-3
      px-3 py-3
      sm:px-5 sm:py-4
      lg:flex-row lg:items-center lg:justify-between
    "
  >

    {/* LEFT */}

    <div className="min-w-0">

      {/* TITLE */}

      <div
        className="
        flex
        w-full
        flex-col
        gap-3
        sm:w-auto
        sm:flex-row
        "
        >

        <div
          className="
            flex h-11 w-11
            items-center justify-center
            rounded-2xl
            bg-purple-50
            text-purple-600
          "
        >
          <FileDoneOutlined className="text-lg" />
        </div>

        <div>

          <h2
            className="
              text-lg
              sm:text-xl
              lg:text-2xl
              font-semibold
              tracking-tight
              text-gray-900
            "
          >
            Final Compliance Audit Report
          </h2>

          <p
            className="
              mt-1
              text-sm
              text-gray-500
            "
          >
            Finalized compliance audit certificate
          </p>

        </div>
      </div>

      {/* STATUS CHIP */}

      <div
        className="
          mt-2 inline-flex items-center
          gap-2
          rounded-2xl
          border border-purple-100
          bg-purple-50
          px-4 py-2
          text-xs
          font-semibold
          text-purple-700
        "
      >

        <span
          className="
            h-2 w-2
            rounded-full
            bg-purple-500
          "
        />

        Finalized & Frozen

      </div>
    </div>

    {/* RIGHT */}

    <div
      className="
      flex
      w-full min-w-0
      flex-row flex-wrap
      items-center
      gap-2
      lg:w-auto lg:justify-end
      "
      >

      {/* DOWNLOAD */}

      <button
        onClick={() => {

          if (!selectedReport?.id) {
            return;
          }

          downloadPDF(
            selectedReport.id
          );
        }}
        className="
          inline-flex items-center
          gap-2
          rounded-2xl
          bg-blue-600
          flex-1 sm:flex-none
          justify-center
          px-3 py-2
          sm:px-4
          min-h-10
          text-sm
          font-medium
          text-white
          shadow-sm
          transition-all duration-200
          hover:bg-blue-700
          hover:shadow-md
        "
      >

        <DownloadOutlined />

        Download Compliance Certificate

      </button>

      {/* CLOSE */}

      <button
        onClick={() =>
          setOpen(false)
        }
        className="
          flex h-10
          w-10 shrink-0
          items-center justify-center
          rounded-2xl
          border border-gray-200
          bg-white
          text-gray-500
          transition
          hover:bg-gray-50
        "
      >
        <CloseOutlined />
      </button>
    </div>
  </div>
</div>
            {/* MODAL BODY */}

            {/* MODAL BODY */}

            <div
              className="
                min-h-0
                flex-1
                overflow-y-auto
                overflow-x-hidden
                overscroll-contain
                px-3 py-3
                sm:px-5 sm:py-4
                space-y-4
                custom-scrollbar
              "
            >


              {/* AUDIT SUMMARY */}

              <div className="
                rounded-3xl
                border border-gray-200
                bg-gradient-to-br from-white to-gray-50/70
                p-3 sm:p-5
              ">

                <h3 className="
                  mb-4
                  flex items-center gap-2
                  text-base
                  font-semibold
                  text-gray-900
                ">

                  <span className="
                    inline-block
                    h-2.5 w-2.5
                    rounded-full
                    bg-gray-400
                  "></span>

                  Audit Summary
                </h3>

                <div className="
                  grid
                  grid-cols-2
                  sm:grid-cols-3
                  xl:grid-cols-6
                  gap-x-3 gap-y-3 sm:gap-x-5
                  text-sm leading-relaxed
                ">

                  {[
                    {
                      label: "PE",
                      value: selectedReport.pe_name,
                    },
                    {
                      label: "Vendor",
                      value: selectedReport.vendor_name,
                    },
                    {
                      label: "State",
                      value: selectedReport.state,
                    },
                    {
                      label: "Branch",
                      value: selectedReport.branch_name,
                    },
                    {
                      label: "Audit Period",
                      value: selectedReport.audit_period,
                    },
                    {
                      label: "Frozen On",

                      value: selectedReport.frozen_at
                        ? new Date(
                            selectedReport.frozen_at
                          ).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })
                        : "-",
                    },
                  ].map((item, idx) => (

                    <div key={idx}>

                      <div className="
                        mb-1
                        text-xs
                        font-semibold
                        uppercase
                        tracking-wide
                        text-gray-400
                      ">
                        {item.label}
                      </div>

                      <div className="
                        text-sm
                        font-semibold
                        text-gray-900
                        break-words
                      ">
                        {item.value || "-"}
                      </div>

                    </div>
                  ))}
                </div>
              </div>

{/* PAYROLL SUMMARY */}

<div className="overflow-hidden rounded-3xl border border-blue-200 bg-white">

    <div className="border-b border-blue-100 bg-blue-50 px-3 py-3 sm:px-5 sm:py-4">
    <h3 className="flex items-center gap-2 text-base font-semibold text-blue-900">
      <SafetyCertificateOutlined />
      Payroll Summary
    </h3>
  </div>

  <Table
    rowKey="month"
    pagination={false}
    size="small"
    dataSource={selectedReport.payroll_data || []}
     scroll={{ x: 1050 }}

    columns={[
      {
        title: "Month",
        dataIndex: "month",
      },
      {
        title: "Male",
        dataIndex: "male_employees",
      },
      {
        title: "Female",
        dataIndex: "female_employees",
      },
      {
        title: "Gross Wages",
        dataIndex: "gross_wages",
      },
      {
        title: "Net Wages",
        dataIndex: "net_wages",
      },
      {
        title: "PF Date",
        dataIndex: "pf_remittance_date",
      },

      {
        title: "ESIC Date / Remark",
        render: (_: any, record: any) =>
          record.esic_not_applicable ? (
            <div className="space-y-1">
              <span className="font-medium text-amber-700">
                Not Applicable
              </span>

              {record.esic_not_applicable_reason && (
                <p className="max-w-[260px] whitespace-pre-wrap break-words text-xs text-gray-600">
                  {record.esic_not_applicable_reason}
                </p>
              )}
            </div>
          ) : record.esic_remittance_date || "-",
      },

      {
        title: "RC Date",
        render: (_: any, record: any) =>
          record.pt_rc_not_applicable
            ? "Not Applicable"
            : record.rc_remittance_date || "-",
      },
      {
        title: "LWF Date",
        render: (_: any, record: any) =>
          record.lwf_not_applicable
            ? "Not Applicable"
            : record.lwf_remittance_date || "-",
      },
    ]}
  />

</div>

{/* COMPLIANCE TABLE */}
{/* COMPLIANCE ENTRIES */}
<div className="overflow-hidden rounded-3xl border border-gray-200 bg-white">
  {/* HEADER */}
   <div className="border-b border-gray-100 px-3 py-3 sm:px-5 sm:py-4">
    <h3 className="text-sm font-semibold text-gray-900">
      Compliance Entries
    </h3>
    <p className="mt-1 text-xs text-gray-500">
      Frozen audit observations and recommendations
    </p>
  </div>

  {/* TABLE with reliable vertical scroll */}
   <div className="min-w-0 w-full">
    <Table
      rowKey={(_, index) => index?.toString() || "row"}
      size="middle"
      pagination={false}
      className="compliance-table"
      tableLayout="fixed"
       scroll={{ x: 1560, y: "clamp(220px, 48dvh, 520px)" }}
      dataSource={getUniqueEntries(selectedReport.entries || [])}
      locale={{
        emptyText: (
          <Empty description="No frozen compliance observations available" />
        ),
      }}
      columns={[
        {
          title: "State",
          width: 110,
          align: "center" as const,
          render: () => (
            <span className="font-medium text-gray-700">
              {selectedReport.state || "-"}
            </span>
          ),
        },
        {
          title: "Act",
          dataIndex: "act_name",
          width: 180,
          align: "center" as const,
          render: (text: string) => (
            <div className="text-left text-gray-600 whitespace-pre-wrap">
              {text || "-"}
            </div>
          ),
        },
        {
          title: "Section / Rule",
          dataIndex: "section",
          width: 120,
          align: "center" as const,
          render: (text: string) => (
            <div className="text-gray-600">{text || "-"}</div>
          ),
        },
        {
          title: "Form",
          dataIndex: "form_number",
          width: 90,
          align: "center" as const,
          render: (text: string) => (
            <div className="text-gray-600">{text || "-"}</div>
          ),
        },
        {
          title: "Document",
          dataIndex: "document_name",
          width: 160,
          align: "center" as const,
          render: (text: string) => (
            <div className="text-left text-gray-600 whitespace-pre-wrap">
              {text || "-"}
            </div>
          ),
        },
        {
          title: "Audit Particular",
          dataIndex: "audit_particular",
          width: 220,
          align: "center" as const,
          render: (text: string) => (
            <div className="text-left text-gray-600 whitespace-pre-wrap">
              {text || "-"}
            </div>
          ),
        },
        {
          title: "Compliance Status",
          dataIndex: "status",
          width: 200,
          align: "center" as const,
          render: (status: string) => (
            <span
              className={`
                inline-flex items-center
                rounded-full
                px-3 py-1.5
                text-xs font-medium
                ${getStatusClass(status)}
              `}
            >
              {status || "Not Applicable"}
            </span>
          ),
        },
        {
          title: "Auditor Observation",
          dataIndex: "observation",
          width: 240,
          align: "center" as const,
          render: (text: string) => (
            <div className="text-left text-gray-600 whitespace-pre-wrap">
              {text || "-"}
            </div>
          ),
        },
        {
          title: "Action Recommendation",
          dataIndex: "recommendation",
          width: 240,
          align: "center" as const,
          render: (text: string) => (
            <div className="text-left text-gray-600 whitespace-pre-wrap">
              {text || "-"}
            </div>
          ),
        },
      ]}
    />
  </div>
</div>

{/* CUSTOM STYLES */}

<style>{`

  .compliance-table .ant-table-content::-webkit-scrollbar,
  .compliance-table .ant-table-body::-webkit-scrollbar {
    height: 14px !important;
  }

  .compliance-table .ant-table-content::-webkit-scrollbar-thumb,
  .compliance-table .ant-table-body::-webkit-scrollbar-thumb {
    background: #94a3b8;
    border-radius: 999px;
  }

  /* =====================================
     COMPLIANCE TABLE SCROLLBAR
  ===================================== */

  .compliance-table .ant-table-body {
    overflow-x: auto !important;
    overflow-y: auto !important;
    scrollbar-gutter: stable;
  }

  .compliance-table .ant-table-content {
    overflow-x: auto !important;
  }

  .compliance-table .ant-table-body::-webkit-scrollbar {
    width: 12px;
    height: 12px;
  }

  .compliance-table .ant-table-body::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 999px;
  }

  .compliance-table .ant-table-body::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 999px;
  }

  .compliance-table .ant-table-body::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }

  /* =====================================
     FREEZE AUDIT TABLE
  ===================================== */

  .freeze-audit-table .ant-table {
    border-radius: 20px !important;
  }

  .freeze-audit-table .ant-table-thead > tr > th {
    background: #ffffff !important;
    color: #6b7280 !important;
    font-size: 11px !important;
    font-weight: 600 !important;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    border-bottom: 1px solid #f1f5f9 !important;
    position: sticky !important;
    top: 0;
    z-index: 5;
  }

  .freeze-audit-table .ant-table-tbody > tr > td {
    border-bottom: 1px solid #f8fafc !important;
  }

  .freeze-audit-table .ant-table-tbody > tr:hover > td {
    background: #f5f9ff !important;
  }

  /* =====================================
     COMPLIANCE TABLE
  ===================================== */

  .compliance-table .ant-table {
    border-radius: 0 !important;
  }

  .compliance-table .ant-table-container {
    border-inline-start: none !important;
    border-inline-end: none !important;
  }

.compliance-table .ant-table-thead > tr > th {
  background: #f8fafc !important;
  color: #475569 !important;
  font-size: 11px !important;
  font-weight: 600 !important;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  border-bottom: 1px solid #e2e8f0 !important;
  padding: 12px 10px !important;
}

.compliance-table .ant-table-tbody > tr > td {
  border-bottom: 1px solid #f1f5f9 !important;
  vertical-align: top;
  padding: 12px 10px !important;
  background: white !important;
}

.compliance-table .ant-table-tbody > tr:hover > td {
  background: #f8fafc !important;
}

  .compliance-table .ant-table-cell {
    border-inline-end: none !important;
  }

  /* =====================================
     GENERIC CUSTOM SCROLLBAR
  ===================================== */

  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f8fafc;
    border-radius: 8px;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 8px;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }

  /* Keep Ant Design modal usable on laptops and small screens. */
  .freeze-report-modal .ant-modal-content {
    padding: 0 !important;
    overflow: hidden;
    border-radius: 16px;
  }

  .freeze-report-modal .ant-modal-body {
    min-width: 0;
  }

  .freeze-report-modal .ant-table-wrapper,
  .freeze-report-modal .ant-table-container {
    min-width: 0;
    max-width: 100%;
  }

  .freeze-report-modal .ant-table-cell {
    overflow-wrap: anywhere;
  }

  @media (max-width: 640px) {
    .freeze-report-modal .ant-modal-content {
      border-radius: 12px;
    }
    .freeze-report-modal .compliance-table .ant-table-cell {
      padding: 9px 8px !important;
    }
  }

`}</style>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}