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

  // FILTERS
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("latest");

  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("access_token");

      const res = await fetch(
        "http://127.0.0.1:8000/api/auditor/vendor/notifications/",
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
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      const token = localStorage.getItem("access_token");

      await fetch(
        `http://127.0.0.1:8000/api/auditor/vendor/notifications/${id}/read/`,
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

  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.is_read);

    await Promise.all(
      unread.map(async (n) => {
        try {
          const token = localStorage.getItem("access_token");

          await fetch(
            `http://127.0.0.1:8000/api/auditor/vendor/notifications/${n.id}/read/`,
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

  const getStatusStyles = (status: string) => {
    if (status === "Not Complied") {
      return "bg-red-100 text-red-700";
    }

    return "bg-yellow-100 text-yellow-700";
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

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const actionRequiredCount = notifications.filter((n) => {
    const d = n.data || {};

    const entries =
      d.entries?.filter(
        (e: any) =>
          ![
            "Complied",
            "Exceptional Approval - Delayed Complied",
            "Not Applicable For Audit Period",
          ].includes(e.status)
      ) || [];

    return entries.length > 0;
  }).length;

  return (
    <ComponentCard title="Notifications">

      {/* HEADER TOOLBAR */}
      <div className="mb-4 rounded-xl border border-gray-200 bg-white p-3">

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">

          {/* LEFT */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center flex-1">

            {/* SEARCH */}
            <div className="relative w-full lg:w-72">

              <input
                type="text"
                placeholder="Search notifications..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="
                  w-full rounded-lg border border-gray-200
                  bg-gray-50
                  py-2 pl-9 pr-3
                  text-sm
                  outline-none
                  transition
                  focus:border-blue-400
                  focus:bg-white
                  focus:ring-2 focus:ring-blue-100
                "
              />

              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
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
            <div className="flex flex-wrap gap-2">

              {[
                { key: "all", label: "All" },
                { key: "unread", label: "Unread" },
                { key: "action-required", label: "Action" },
                { key: "complied", label: "Complied" },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setFilter(item.key)}
                  className={`
                    rounded-md px-3 py-2 text-xs font-medium transition
                    ${
                      filter === item.key
                        ? "bg-blue-600 text-white"
                        : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }
                  `}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center justify-between gap-2 flex-wrap">

            {/* STATS */}
            <div className="flex items-center gap-2 flex-wrap">

              <div className="rounded-md bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-700">
                Total: {notifications.length}
              </div>

              <div className="rounded-md bg-blue-100 px-2.5 py-1.5 text-xs font-medium text-blue-700">
                Unread: {unreadCount}
              </div>

              <div className="rounded-md bg-red-100 px-2.5 py-1.5 text-xs font-medium text-red-700">
                Action: {actionRequiredCount}
              </div>
            </div>

            {/* SORT */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="
                rounded-md border border-gray-200
                bg-white
                px-2 py-2
                text-xs
                outline-none
                focus:border-blue-400
              "
            >
              <option value="latest">Latest</option>
              <option value="oldest">Oldest</option>
              <option value="unread">Unread</option>
            </select>

            {/* MARK ALL */}
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="
                  rounded-md
                  bg-blue-600
                  px-3 py-2
                  text-xs font-medium
                  text-white
                  hover:bg-blue-700
                  transition
                  whitespace-nowrap
                "
              >
                Mark all
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
            <p className="text-sm text-gray-500">
              No notifications found
            </p>
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
                    "Not Applicable For Audit Period",
                  ].includes(e.status)
              ) || [];

            return (
              <div
                key={n.id}
                onClick={() => {
                  if (d.entries) {
                  navigate("/vendor-compliance", {
                    state: {
                      prefill: {
                        pe_id: d.pe_id,
                        state: d.state,
                        branch_id: d.branch_id,
                        selected_period: d.audit_period,
                        notification_id: n.id,

                        // ✅ ONLY FAILED DOCS
                        entries: filteredEntries || [],

                        compliance_id: d.compliance_id,
                        reupload_mode: true,
                      },
                    },
                  });
                  }
                }}
                className={`
                  relative rounded-lg border
                  px-4 py-3
                  cursor-pointer
                  transition-all duration-200
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
                      {new Date(n.created_at).toLocaleDateString()}
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