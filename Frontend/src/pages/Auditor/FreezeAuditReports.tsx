import { useEffect, useState } from "react";
import axios from "axios";
import { Table, Modal, Button, Spin, Tag, Empty } from "antd";
import {
  DownloadOutlined,
  FileTextOutlined,
CloseOutlined,
CheckCircleOutlined,
SafetyCertificateOutlined,
SearchOutlined,
FileDoneOutlined,
} from "@ant-design/icons";

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

        "https://apii.complianceclearance.com/api/auditor/freeze-audit-reports/",

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

          `https://apii.complianceclearance.com/api/auditor/download-cc-pdf/${id}/`,

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
          View CC
        </Button>
      ),
    },
  ];

  return (

    <div className="space-y-5 p-1 md:p-4">

      {/* HEADER */}

      <div className="mb-1">

        <h1 className="
          text-2xl
          font-semibold
          tracking-tight
          text-gray-900
        ">
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
    grid grid-cols-1
    gap-4
    md:grid-cols-3
  "
>

{/* TOTAL */}

<div
  className="
    rounded-3xl
    border border-gray-100
    bg-gradient-to-br from-white to-gray-50
    p-5
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
    mb-4 flex flex-col
    gap-3 md:flex-row
    md:items-center
    md:justify-between
  "
>

<div className="relative">

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
      h-11 w-full md:w-[360px]
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

  <div className="flex gap-2">

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
          px-4 py-2
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

            dataSource={filteredReports}

            bordered={false}

            size="middle"

            className="freeze-audit-table"

            pagination={{
              pageSize: 5,
              showSizeChanger: false,
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

        onCancel={() =>
          setOpen(false)
        }

        width={1380}

        centered

        destroyOnClose

        closable={false}

        styles={{
          body: {

            padding: 0,

            maxHeight: "88vh",

            overflow: "hidden",

            background:
              "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",

            backdropFilter: "blur(8px)",

            borderRadius: "24px",
          },
        }}
      >

        {selectedReport && (

          <div className="
            flex flex-col
            overflow-hidden
            rounded-3xl
          ">

{/* MODAL HEADER */}

<div
  className="
    sticky top-0 z-20
    border-b border-gray-100
    bg-white/95
    backdrop-blur
  "
>

  <div
    className="
      flex flex-col gap-5
      px-7 py-5
      lg:flex-row
      lg:items-start
      lg:justify-between
    "
  >

    {/* LEFT */}

    <div className="min-w-0">

      {/* TITLE */}

      <div className="flex items-center gap-3">

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
              text-[28px]
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
          mt-4 inline-flex items-center
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

    <div className="flex items-center gap-3">

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
          px-5 py-2.5
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
          flex h-11 w-11
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

            <div className="
              flex-1 overflow-auto
              px-6 py-5
              space-y-4
            ">

              {/* AUDIT SUMMARY */}

              <div className="
                rounded-3xl
                border border-gray-200
                bg-gradient-to-br from-white to-gray-50/70
                p-5
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
                  grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7
                  divide-y md:divide-y-0 md:divide-x
                  divide-gray-100
                  gap-x-8 gap-y-4
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

                    {
                    label: "Compliance Score",

                    value: `${Math.round(

                      (
                        selectedReport.entries?.filter(
                          (e: any) =>

                            e.status === "Complied" ||

                            e.status ===
                            "Exceptional Approval - Delayed Complied" ||

                            e.status ===
                            "Not Applicable For Audit Period"
                        ).length /

                        (selectedReport.entries?.length || 1)

                      ) * 100

                    )}%`,
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

{/* COMPLIANCE TABLE */}

<div
  className="
    overflow-hidden
    rounded-3xl
    border border-gray-200
    bg-white
  "
>

  {/* HEADER */}

  <div className="
    border-b border-gray-100
    px-5 py-4
  ">

    <h3 className="
      text-sm
      font-semibold
      text-gray-900
    ">
      Compliance Entries
    </h3>

    <p className="
      mt-1
      text-xs
      text-gray-500
    ">
      Frozen audit observations and
      recommendations
    </p>

  </div>

  {/* TABLE */}

  <div className="overflow-x-auto">

    <Table
      rowKey={(_, index) =>
        index?.toString() || "row"
      }

      size="middle"

      pagination={false}

      className="compliance-table"

      dataSource={
        selectedReport.entries || []
      }

      locale={{
        emptyText: (
          <Empty
            description="
              No frozen compliance observations available
            "
          />
        ),
      }}

      columns={[

        {
          title: "State",

          width: 140,

          render: () => (

            <span className="
              font-medium text-gray-700
            ">
              {selectedReport.state || "-"}
            </span>
          ),
        },

        {
          title: "Audit Particular",

          dataIndex: "audit_particular",

          render: (text: string) => (

            <div className="
              whitespace-pre-wrap
              text-gray-600
            ">
              {text || "-"}
            </div>
          ),
        },

        {
          title: "Compliance Status",

          dataIndex: "status",

          width: 240,

          render: (status: string) => (

            <span
              className={`
                inline-flex items-center
                rounded-full
                px-4 py-2
                text-xs tracking-wide
                font-medium
                ${getStatusClass(status)}
              `}
            >
              {status ||
                "Not Applicable"}
            </span>
          ),
        },

        {
          title: "Auditor Observation",

          dataIndex: "observation",

          render: (text: string) => (

            <div className="
              whitespace-pre-wrap
              text-gray-600
            ">
              {text || "-"}
            </div>
          ),
        },

        {
          title: "Action Recommendation",

          dataIndex: "recommendation",

          render: (text: string) => (

            <div className="
              whitespace-pre-wrap
              text-gray-600
            ">
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

  .compliance-table .ant-table {
    border-radius: 0 !important;
  }

  .compliance-table .ant-table-container {
    border-inline-start: none !important;
    border-inline-end: none !important;
  }

  .compliance-table .ant-table-thead > tr > th {
    background: #fafafa !important;
    color: #6b7280 !important;
    font-size: 11px !important;
    font-weight: 600 !important;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    border-bottom: 1px solid #f1f5f9 !important;
    padding-top: 14px !important;
    padding-bottom: 14px !important;
    position: sticky !important;
    top: 0;
    z-index: 10;
  }

  .compliance-table .ant-table-tbody > tr > td {
    border-bottom: 1px solid #f3f4f6 !important;
    vertical-align: top;
    padding-top: 14px !important;
    padding-bottom: 14px !important;
    background: white !important;
  }

  .compliance-table .ant-table-tbody > tr:hover > td {
    background: #f5f9ff !important;
  }

  .compliance-table .ant-table-cell {
    border-inline-end: none !important;
  }

`}
      </style>

            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}