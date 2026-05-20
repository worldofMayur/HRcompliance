import { useEffect, useMemo, useState } from "react";

import {
  BellOutlined,
  ReloadOutlined,
  FilePdfOutlined,
  FileZipOutlined,
  CheckCircleFilled,
} from "@ant-design/icons";

import ComponentCard from "../../components/common/ComponentCard";

interface Notification {
  id: number;
  title: string;
  message?: string;
  created_at: string;
  is_read: boolean;
  data?: any;
}

export default function PENotifications() {

  const [notifications, setNotifications] =
    useState<Notification[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState("all");

  const [downloadingZip, setDownloadingZip] =
    useState<number | null>(null);

  const [downloadingCC, setDownloadingCC] =
    useState<number | null>(null);

  const [downloadedZip, setDownloadedZip] =
    useState<number[]>([]);

  const [downloadedCC, setDownloadedCC] =
    useState<number[]>([]);

  // ==========================================
  // FETCH
  // ==========================================

  useEffect(() => {

    fetchNotifications();

    const interval = setInterval(() => {

      fetchNotifications(true);

    }, 10000);

    return () => clearInterval(interval);

  }, []);

  const fetchNotifications = async (
    silent = false
  ) => {

    try {

      if (silent) {

        setRefreshing(true);

      } else {

        setLoading(true);
      }

      const token =
        localStorage.getItem(
          "access_token"
        );

      const res = await fetch(

        "http://127.0.0.1:8000/api/auditor/vendor/notifications/",

        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        return;
      }

      const data = await res.json();

      const filtered = (data || []).filter(
        (n: any) => {

          const d = n.data || {};

          return (

            d.status === "CC_ISSUED"

            ||

            d.pdf_download_url

            ||

            n?.title
              ?.toLowerCase()
              .includes("cc")

            ||

            n?.message
              ?.toLowerCase()
              .includes("compliance clearance")
          );
        }
      );

      setNotifications(filtered);

    } catch (err) {

      console.error(err);

    } finally {

      if (silent) {

        setTimeout(() => {

          setRefreshing(false);

        }, 700);

      } else {

        setLoading(false);
      }
    }
  };

  // ==========================================
  // FILTERS
  // ==========================================

  const filteredNotifications =
    useMemo(() => {

      let filtered =
        notifications.filter((n) => {

          const d = n.data || {};

          const text = `
            ${n.title}
            ${d.vendor || ""}
            ${d.branch || ""}
            ${d.audit_period || ""}
          `.toLowerCase();

          return text.includes(
            search.toLowerCase()
          );
        });

      if (filter === "today") {

        filtered = filtered.filter((n) => {

          const today =
            new Date().toDateString();

          return (
            new Date(
              n.created_at
            ).toDateString() === today
          );
        });
      }

      return filtered;

    }, [notifications, search, filter]);

  // ==========================================
  // DOWNLOAD CC
  // ==========================================

const downloadCC = async (
  pdfUrl: string,
  notificationId: number
) => {

  try {

    setDownloadingCC(
      notificationId
    );

    const token =
      localStorage.getItem(
        "access_token"
      );

    const response =
      await fetch(
        pdfUrl,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

    if (!response.ok) {

      throw new Error(
        "Failed to download CC"
      );
    }

    const blob =
      await response.blob();

    const url =
      window.URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      "Compliance_Certificate.pdf";

    document.body.appendChild(link);

    link.click();

    link.remove();

    setDownloadedCC((prev) => [
      ...prev,
      notificationId,
    ]);

  } catch (err) {

    console.error(err);

    alert(
      "Failed to download CC"
    );

  } finally {

    setDownloadingCC(null);
  }
};
  // ==========================================
  // DOWNLOAD ZIP
  // ==========================================

  const downloadZip = async (
    branchId: number,
    auditPeriod: string,
    notificationId: number
  ) => {

    try {

      setDownloadingZip(
        notificationId
      );

      const token =
        localStorage.getItem(
          "access_token"
        );

      const response =
        await fetch(

          `http://127.0.0.1:8000/api/auditor/audit/documents-zip/${branchId}/?audit_period=${encodeURIComponent(
            auditPeriod
          )}`,

          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

      const blob =
        await response.blob();

      const url =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;

      link.download =
        "Audit_Documents.zip";

      document.body.appendChild(link);

      link.click();

      link.remove();

      setDownloadedZip((prev) => [
        ...prev,
        notificationId,
      ]);

    } catch (err) {

      console.error(err);

    } finally {

      setDownloadingZip(null);
    }
  };

  // ==========================================
  // TIME
  // ==========================================

  const getRelativeTime = (
    date: string
  ) => {

    const now =
      new Date().getTime();

    const past =
      new Date(date).getTime();

    const diff =
      Math.floor((now - past) / 1000);

    if (diff < 60) {
      return "Just now";
    }

    if (diff < 3600) {
      return `${Math.floor(diff / 60)} mins ago`;
    }

    if (diff < 86400) {
      return `${Math.floor(diff / 3600)} hrs ago`;
    }

    return `${Math.floor(diff / 86400)} days ago`;
  };

  return (

    <ComponentCard>

      {/* HEADER */}

      <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">

        <div>

          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Notifications Center
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Monitor compliance updates, audit actions, and certificate activity.
          </p>

        </div>

        <div className="flex flex-col items-end">

          {refreshing ? (

            <div
              className="
                flex items-center gap-2
                rounded-full
                bg-blue-50
                px-3 py-1.5
                text-xs font-medium
                text-blue-700
              "
            >

              <ReloadOutlined spin />

              Refreshing...

            </div>

          ) : (

            <div className="flex items-center gap-2 text-xs text-green-600">

              <span className="h-2 w-2 rounded-full bg-green-500" />

              Live Updates

            </div>
          )}

          <span className="mt-1 text-[11px] text-gray-400">
            Auto refresh every 10s
          </span>

        </div>

      </div>

      {/* TOOLBAR */}

      <div
        className="
          sticky top-0 z-20
          mb-5
          rounded-2xl
          border border-gray-200
          bg-white/95
          p-4
          shadow-sm
          backdrop-blur
        "
      >

        <div className="flex flex-wrap items-center justify-between gap-4">

          {/* SEARCH */}

          <div className="relative w-full lg:w-[320px]">

            <input
              type="text"
              placeholder="Search vendor, branch, audit period..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="
                w-full rounded-xl
                border border-gray-200
                bg-gray-50
                py-2.5 pl-10 pr-4
                text-sm text-gray-700
                outline-none
                transition
                focus:border-blue-300
                focus:bg-white
                focus:ring-4
                focus:ring-blue-100
              "
            />

            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="
                absolute left-3 top-1/2
                h-4 w-4
                -translate-y-1/2
                text-gray-400
              "
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>

          </div>

          {/* FILTERS */}

          <div className="flex flex-wrap items-center gap-2">

            {[
              { key: "all", label: "All" },
              { key: "today", label: "Today" },
            ].map((item) => (

              <button
                key={item.key}
                onClick={() =>
                  setFilter(item.key)
                }
                className={`
                  rounded-xl
                  px-3 py-2
                  text-xs font-medium
                  transition-all
                  ${
                    filter === item.key
                      ? "bg-blue-600 text-white"
                      : `
                        border border-gray-200
                        bg-white
                        text-gray-600
                        hover:bg-blue-50
                      `
                  }
                `}
              >
                {item.label}
              </button>
            ))}

          </div>

          {/* STATS */}

          <div className="flex items-center gap-2">

            <div
              className="
                rounded-xl
                bg-gray-100
                px-3 py-2
                text-xs font-semibold
                text-gray-700
              "
            >
              {notifications.length} Total
            </div>

            <div
              className="
                rounded-xl
                bg-green-50
                px-3 py-2
                text-xs font-semibold
                text-green-700
              "
            >
              CC Issued
            </div>

          </div>

        </div>

      </div>

      {/* LOADING */}

      {loading && (

        <div className="space-y-3">

          {[1, 2, 3].map((i) => (

            <div
              key={i}
              className="
                animate-pulse
                rounded-xl
                border border-gray-200
                bg-gray-100
                p-5
                h-28
              "
            />

          ))}

        </div>
      )}

      {/* EMPTY */}

      {
        filteredNotifications.length === 0
        &&
        !loading
        && (

          <div className="rounded-xl border border-gray-200 bg-gray-50 py-14 text-center">

            <div className="flex flex-col items-center">

              <div className="mb-3 text-6xl">
                📂
              </div>

              <p className="text-base font-medium text-gray-700">
                No compliance certificates issued yet
              </p>

              <p className="mt-1 text-sm text-gray-400">
                Notifications will appear here once audits are completed.
              </p>

            </div>

          </div>

        )
      }

      {/* LIST */}

      <div className="space-y-3">

        {!loading &&
          filteredNotifications.map((n) => {

            const d = n.data || {};

            return (

              <div
                key={n.id}
                className="
                  group
                  relative
                  rounded-xl
                  border border-blue-200
                  bg-blue-50/20
                  px-4 py-3
                  transition-all duration-200
                  hover:-translate-y-[1px]
                  hover:border-blue-300
                  hover:bg-blue-50/40
                  hover:shadow-md
                "
              >

                <div className="flex items-start justify-between gap-4">

                  {/* LEFT */}

                  <div className="min-w-0 flex-1">

                    {/* TITLE */}

                    <div className="flex items-center gap-2">

                      <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />

                      <h3 className="truncate text-sm font-semibold text-gray-800">

                        {n.title}

                      </h3>

                    </div>

                    {/* META */}

                    <div className="mt-1 flex flex-wrap items-center gap-1 text-[11px]">

                      <span className="text-gray-600">
                        {d.vendor || "-"}
                      </span>

                      <span className="text-gray-400">
                        •
                      </span>

                      <span className="text-gray-500">
                        {d.branch || "-"}
                      </span>

                      <span className="text-gray-400">
                        •
                      </span>

                      <span className="font-medium text-indigo-600">
                        {d.audit_period || "-"}
                      </span>

                    </div>

                    {/* STATUS */}

                    <p className="mt-2 flex items-center gap-1 text-[11px] font-medium text-green-600">

                      <CheckCircleFilled />

                      All audit items complied

                    </p>

                    {/* BUTTONS */}

                    <div className="mt-3 flex flex-wrap items-center gap-2">

                      {/* CC */}

                      <button

                        onClick={() => {

                          console.log("CC DATA:", d);

                          if (d.pdf_download_url) {

                            downloadCC(
                              d.pdf_download_url,
                              n.id
                            );

                          } else {

                            alert("PDF URL missing");
                          }
                        }}

                        className="
                          flex items-center gap-1.5
                          rounded-lg
                          bg-blue-600
                          px-3 py-1.5
                          text-[11px]
                          font-semibold
                          text-white
                          transition-all
                          hover:bg-blue-700
                        "
                      >

                        <FilePdfOutlined />

                        {
                          downloadingCC === n.id
                            ? "Preparing..."
                            : downloadedCC.includes(n.id)
                            ? "Downloaded"
                            : "Download CC"
                        }

                      </button>

                      {/* ZIP */}

                      <button

                        disabled={
                          !d.branch_id ||
                          !d.audit_period
                        }

                        onClick={() => {

                          if (
                            d.branch_id &&
                            d.audit_period
                          ) {

                            downloadZip(
                              d.branch_id,
                              d.audit_period,
                              n.id
                            );
                          }
                        }}

                        className="
                          flex items-center gap-1.5
                          rounded-lg
                          border border-gray-300
                          bg-white
                          px-3 py-1.5
                          text-[11px]
                          font-semibold
                          text-gray-700
                          transition-all
                          hover:bg-gray-50
                          disabled:cursor-not-allowed
                          disabled:opacity-50
                        "
                      >

                        <FileZipOutlined />

                        {
                          downloadingZip === n.id
                            ? "Preparing..."
                            : downloadedZip.includes(n.id)
                            ? "Downloaded"
                            : "Download ZIP"
                        }

                      </button>

                    </div>

                  </div>

                  {/* RIGHT */}

                  <div className="flex flex-col items-end gap-2 flex-shrink-0">

                    <div
                      className="
                        rounded-full
                        bg-green-100
                        px-2.5 py-1
                        text-[10px]
                        font-semibold
                        text-green-700
                      "
                    >

                      ✓ CC ISSUED

                    </div>

                    <span className="text-[10px] text-gray-400">

                      {getRelativeTime(
                        n.created_at
                      )}

                    </span>

                  </div>

                </div>

              </div>
            );
          })
        }

      </div>

    </ComponentCard>
  );
}