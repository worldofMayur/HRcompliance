import { useEffect, useMemo, useState } from "react";
import ComponentCard from "../components/common/ComponentCard";
import { useNavigate } from "react-router-dom";

interface Notification {
  id: number;
  title: string;
  data?: any;
  message?: string;
  created_at: string;
  is_read: boolean;
}

export default function VendorNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // FILTERS
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("latest");

  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications(true);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

const fetchNotifications = async (silent = false) => {

  try {

    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    const token = localStorage.getItem("access_token");

    const res = await fetch(
      "https://apii.complianceclearance.com/api/auditor/vendor/notifications/",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      console.error("API ERROR:", res.status);
      return;
    }

    const data = await res.json();

    setNotifications(data);

  } catch (err) {

    console.error("Error fetching notifications", err);

  } finally {

    if (silent) {

      // makes indicator visible for UX
      setTimeout(() => {
        setRefreshing(false);
      }, 800);

    } else {

      setLoading(false);
    }
  }
};

  const markAsRead = async (id: number) => {
    try {
      const token = localStorage.getItem("access_token");

      await fetch(
        `https://apii.complianceclearance.com/api/auditor/vendor/notifications/${id}/read/`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, is_read: true } : n
        )
      );
    } catch (err) {
      console.error("Error updating notification", err);
    }
  };


const [currentTime, setCurrentTime] = useState(
  new Date().toLocaleTimeString()
);

useEffect(() => {

  const timer = setInterval(() => {
    setCurrentTime(
      new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  }, 1000);

  return () => clearInterval(timer);

}, []);

  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.is_read);

    await Promise.all(
      unread.map(async (n) => {
        try {
          const token = localStorage.getItem("access_token");

          await fetch(
            `https://apii.complianceclearance.com/api/auditor/vendor/notifications/${n.id}/read/`,
            {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
        } catch (err) {
          console.error(err);
        }
      })
    );

    setNotifications((prev) =>
      prev.map((n) => ({
        ...n,
        is_read: true,
      }))
    );
  };

const getStatusStyles = (
  status: string
) => {

  if (
    status === "Not Complied"
  ) {

    return (
      "bg-red-100 text-red-700"
    );
  }

  if (
    status.includes(
      "Exceptional Approval"
    )
  ) {

    return (
      "bg-orange-100 text-orange-700"
    );
  }

  if (
    status ===
    "Complied"
  ) {

    return (
      "bg-green-100 text-green-700"
    );
  }

  return (
    "bg-yellow-100 text-yellow-700"
  );
};

  // FILTERED + SORTED
  const filteredNotifications = useMemo(() => {
    let filtered = notifications.filter((n) => {
      const d = n.data || {};

      const entries =
        d.entries?.filter(
          (e: any) =>
            ![
            "Complied",
            "Exceptional Approval - Delayed Complied",
            "Exceptional Approval - Not Complied",
            "Not Applicable For Audit Period",
          ].includes(e.status)
        ) || [];

      const searchText = `
        ${n.title}
        ${d.vendor || ""}
        ${d.state || ""}
        ${d.branch || ""}
        ${d.audit_period || ""}
      `.toLowerCase();

      const matchesSearch = searchText.includes(search.toLowerCase());

      if (filter === "unread" && n.is_read) {
        return false;
      }

      if (filter === "action-required" && entries.length === 0) {
        return false;
      }

      if (filter === "complied" && entries.length > 0) {
        return false;
      }

      return matchesSearch;
    });

    // SORTING
    if (sortBy === "latest") {
      filtered.sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      );
    }

    if (sortBy === "oldest") {
      filtered.sort(
        (a, b) =>
          new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime()
      );
    }

    if (sortBy === "unread") {
      filtered.sort((a, b) => Number(a.is_read) - Number(b.is_read));
    }

    return filtered;
  }, [notifications, search, filter, sortBy]);

const handleDownloadPDF = async (
  url: string
) => {
    console.log("VENDOR NEW BUILD LOADED", url);
  try {

    const token =
      localStorage.getItem("access_token");

      const safeUrl = url.replace(
        "http://apii.complianceclearance.com",
        "https://apii.complianceclearance.com"
      );

      console.log("PDF URL:", safeUrl);

      const response = await fetch(safeUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

    if (!response.ok) {
      throw new Error(
        `Failed to open PDF (${response.status})`
      );
    }

    const blob =
      await response.blob();

    const blobUrl =
      window.URL.createObjectURL(blob);

    window.open(
      blobUrl,
      "_blank",
      "noopener,noreferrer"
    );

  } catch (err) {

    console.error(
      "PDF OPEN ERROR:",
      err
    );

    alert(
      "Unable to open Compliance Certificate."
    );
  }
};

const getRelativeTime = (date: string) => {

  const now = new Date().getTime();

  const past = new Date(date).getTime();

  const diff = Math.floor((now - past) / 1000);

  if (diff < 60) {
    return "Just now";
  }

  if (diff < 3600) {
    return `${Math.floor(diff / 60)}m ago`;
  }

  if (diff < 86400) {
    return `${Math.floor(diff / 3600)}h ago`;
  }

  return `${Math.floor(diff / 86400)}d ago`;
};


  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const actionRequiredCount = notifications.filter((n) => {
    const d = n.data || {};

    if (
      d.status === "CC_ISSUED"
    ) {

      return false;
    }

    const entries =
      d.entries?.filter(
        (e: any) =>
          ![
          "Complied",
          "Exceptional Approval - Delayed Complied",
          "Exceptional Approval - Not Complied",
          "Not Applicable For Audit Period",
        ].includes(e.status)
      ) || [];

    return entries.length > 0;
  }).length;

  return (
      <ComponentCard>

    {/* PAGE HEADER */}
<div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">

  {/* LEFT */}
  <div>

    <h1 className="text-2xl font-bold tracking-tight text-gray-900">
      Notifications Center
    </h1>

    <p className="mt-1 text-sm text-gray-500">
      Monitor compliance updates, audit actions, and certificate activity.
    </p>
  </div>

{/* RIGHT */}
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

      {/* SPINNER */}
      <div
        className="
          h-3 w-3
          rounded-full
          border-2 border-blue-500
          border-t-transparent
          animate-spin
        "
      />

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

{/* HEADER TOOLBAR */}
<div
  className="
    sticky top-0 z-20
    mb-5
    rounded-2xl
    border border-gray-200
    bg-white/90
    p-4
    backdrop-blur-sm
    shadow-sm
  "
>

  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

    {/* LEFT SIDE */}
    <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center">

      {/* SEARCH */}
      <div className="relative w-full lg:w-[320px]">

        <input
          type="text"
          placeholder="Search vendor, branch, audit period..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="
            w-full rounded-xl
            border border-gray-200
            bg-gray-50/80
            py-2.5 pl-10 pr-4
            text-sm text-gray-700
            transition-all duration-200
            outline-none
            placeholder:text-gray-400
            focus:border-blue-300
            focus:bg-white
            focus:ring-4
            focus:ring-blue-100
          "
        />

        <svg
          xmlns="https://www.w3.org/2000/svg"
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

      {/* FILTER PILLS */}
      <div className="flex flex-wrap items-center gap-2">

        {[
          { key: "all", label: "All" },
          { key: "unread", label: "Unread" },
          { key: "action-required", label: "Action Required" },
          { key: "complied", label: "Complied" },
        ].map((item) => (

          <button
            key={item.key}
            onClick={() => setFilter(item.key)}
            className={`
              rounded-xl
              px-4 py-2
              text-xs font-medium
              transition-all duration-200
              ${
                filter === item.key
                  ? "bg-blue-600 text-white shadow-sm"
                  : `
                    border border-gray-200
                    bg-white text-gray-600
                    hover:border-blue-200
                    hover:bg-blue-50
                    hover:text-blue-700
                  `
              }
            `}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>

    {/* RIGHT SIDE */}
    <div className="flex flex-wrap items-center gap-3">

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
            bg-blue-50
            px-3 py-2
            text-xs font-semibold
            text-blue-700
          "
        >
          {unreadCount} Unread
        </div>

        <div
          className="
            rounded-xl
            bg-red-50
            px-3 py-2
            text-xs font-semibold
            text-red-700
          "
        >
          {actionRequiredCount} Action
        </div>
      </div>

      {/* SORT */}
      <div className="relative">

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="
            rounded-xl
            border border-gray-200
            bg-white
            px-3 py-2
            pr-8
            text-xs font-medium
            text-gray-700
            outline-none
            transition
            focus:border-blue-300
            focus:ring-2
            focus:ring-blue-100
          "
        >
          <option value="latest">Latest</option>
          <option value="oldest">Oldest</option>
          <option value="unread">Unread</option>
        </select>
      </div>

      {/* MARK ALL */}
      {unreadCount > 0 && (
        <button
          onClick={markAllAsRead}
          className="
            rounded-xl
            bg-blue-600
            px-4 py-2
            text-xs font-semibold
            text-white
            transition-all duration-200
            hover:bg-blue-700
            hover:shadow-md
          "
        >
          Mark all read
        </button>
      )}
    </div>
  </div>
</div>

      {/* LIST */}
      <div className="space-y-2">

        {/* LOADING */}
        {loading && (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 rounded-lg bg-gray-100"
              />
            ))}
          </div>
        )}

        {/* EMPTY */}
        {!loading && filteredNotifications.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 py-10 text-center">
          <div className="flex flex-col items-center">

            <div className="text-4xl mb-2">
              🔔
            </div>

            <p className="text-sm text-gray-500">
              No notifications found
            </p>

          </div>
          </div>
        )}

        {/* NOTIFICATION ITEMS */}
        {!loading &&
          filteredNotifications.map((n) => {
            const d = n.data || {};

            const filteredEntries =
              d.entries?.filter(
                (e: any) =>
                  ![
                "Complied",
                "Exceptional Approval - Delayed Complied",
                "Exceptional Approval - Not Complied",
                "Not Applicable For Audit Period",
              ].includes(e.status)
              ) || [];

            return (
              <div
                key={n.id}
                onClick={() => {

                  // ======================================
                  // CC PDF DOWNLOAD FLOW
                  // ======================================

                  if (
                    d.status === "CC_ISSUED" &&
                    d.pdf_download_url
                  ) {

                    if (!n.is_read) {

                      markAsRead(n.id);
                    }

                    handleDownloadPDF(
                      d.pdf_download_url
                    );

                    return;
                  }

                  // ======================================
                  // REUPLOAD FLOW
                  // ======================================

                  if (d.entries) {

                    navigate("/vendor-compliance", {

                      state: {

                        prefill: {

                          pe_id: d.pe_id,

                          state: d.state,

                          branch_id: d.branch_id,

                          selected_period: d.audit_period,

                          notification_id: n.id,

                          entries:
                            filteredEntries || [],

                          compliance_id:
                            d.compliance_id,

                          reupload_mode: true,
                        },
                      },
                    });
                  }
                }}
                className={`
                  relative rounded-lg border border-l-4
                  px-4 py-3
                  cursor-pointer
                  transition-all duration-200
                  transition-all duration-200
                  hover:shadow-md hover:-translate-y-[1px]
                  hover:border-blue-300 hover:bg-blue-50/40
                  ${
                    n.is_read
                      ? "bg-white border-gray-200"
                      : "bg-blue-50 border-blue-200"
                  }
                `}
              >
                <div className="flex items-start justify-between gap-3">

                  {/* LEFT */}
                  <div className="flex-1 min-w-0">

                    {/* TITLE */}
                    <div className="flex items-center gap-2">

                      {!n.is_read && (
                        <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                      )}

                      <h3 className="text-sm font-semibold text-gray-800 truncate">
                        {n.title}
                      </h3>
                    </div>

                    {/* META */}
                    <div className="flex flex-wrap items-center gap-2 mt-1">

                      {d.vendor && (
                        <span className="text-[11px] text-gray-600">
                          {d.vendor}
                        </span>
                      )}

                      {d.state && (
                        <span className="text-[11px] text-gray-500">
                          • {d.state}
                        </span>
                      )}

                      {d.branch && (
                        <span className="text-[11px] text-gray-500">
                          • {d.branch}
                        </span>
                      )}

                      {d.audit_period && (
                        <span className="text-[11px] text-indigo-600 font-medium">
                          • {d.audit_period}
                        </span>
                      )}
                    </div>

                    {/* ISSUE TAGS */}
                    {filteredEntries.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mt-2">

                        {filteredEntries.slice(0, 2).map((e: any, i: number) => (
                          <div
                            key={i}
                            className="
                              flex items-center gap-2
                              rounded-md
                              bg-white border border-gray-200
                              px-2 py-1
                              text-[11px]
                              max-w-full
                            "
                          >
                            <span className="truncate max-w-[180px] text-gray-700">
                              {e.audit_particular}
                            </span>

                            <span
                              className={`
                                px-1.5 py-0.5 rounded
                                font-medium whitespace-nowrap
                                ${getStatusStyles(e.status)}
                              `}
                            >
                              {e.status}
                            </span>
                          </div>
                        ))}

                        {filteredEntries.length > 2 && (
                          <span className="text-[11px] text-blue-600 font-medium self-center">
                            +{filteredEntries.length - 2} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-[11px] text-green-600 mt-2 font-medium">
                        All audit items complied
                      </p>
                    )}
                  </div>

                  {/* RIGHT */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">

                    {d.status === "CC_ISSUED" &&
                      d.pdf_download_url && (

                      <button

                        onClick={(e) => {

                          e.stopPropagation();

                          handleDownloadPDF(
                            d.pdf_download_url
                          );
                        }}

                        className="
                          text-[10px]
                          px-2 py-1
                          rounded-md
                          bg-green-100
                          text-green-700
                          hover:bg-green-200
                          transition
                          whitespace-nowrap
                        "
                      >
                        Open CC PDF
                      </button>
                    )}

                    {!n.is_read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(n.id);
                        }}
                        className="
                          text-[10px]
                          px-2 py-1
                          rounded-md
                          bg-blue-100 text-blue-700
                          hover:bg-blue-200
                          transition
                        "
                      >
                        Mark Read
                      </button>
                    )}

                    <span className="text-[10px] text-gray-400 whitespace-nowrap">
                      {getRelativeTime(n.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </ComponentCard>
  );
}