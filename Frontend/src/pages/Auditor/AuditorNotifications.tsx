import { useEffect, useMemo, useState } from "react";
import ComponentCard from "../../components/common/ComponentCard";
import { useNavigate } from "react-router-dom";

import {
  BellOutlined,
  SearchOutlined,
  ReloadOutlined,
  FileSyncOutlined,
} from "@ant-design/icons";

interface Notification {
  id: number;
  title: string;
  data?: any;
  message?: string;
  created_at: string;
  is_read: boolean;
  type?: string;
}

export default function AuditorNotifications() {

  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");

  const [filter, setFilter] = useState("all");

  const [sortBy, setSortBy] = useState("latest");

  const navigate = useNavigate();

  // ==========================================
  // FETCH
  // ==========================================

  useEffect(() => {

    fetchNotifications();

    const interval = setInterval(
      fetchNotifications,
      30000
    );

    return () => clearInterval(interval);

  }, []);

  const fetchNotifications = async () => {

    try {

      setLoading(true);

      const token =
        localStorage.getItem("access_token");

      const res = await fetch(
        "http://127.0.0.1:8000/api/auditor/vendor/notifications/",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {

        console.error(
          "Notification API failed:",
          res.status
        );

        return;
      }

      const data = await res.json();

      console.log(
        "✅ Auditor Notifications:",
        data
      );

      // ✅ BACKEND ALREADY FILTERS
      setNotifications(data || []);

    } catch (err) {

      console.error(
        "Notification fetch failed",
        err
      );

    } finally {

      setLoading(false);
    }
  };

  // ==========================================
  // MARK READ
  // ==========================================

  const markAsRead = async (
    id: number
  ) => {

    try {

      const token =
        localStorage.getItem(
          "access_token"
        );

      // ✅ FIXED URL
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
          n.id === id
            ? { ...n, is_read: true }
            : n
        )
      );

    } catch (err) {

      console.error(err);
    }
  };

  // ==========================================
  // MARK ALL
  // ==========================================

  const markAllAsRead = async () => {

    const unread =
      notifications.filter(
        (n) => !n.is_read
      );

    await Promise.all(
      unread.map(async (n) => {

        try {

          const token =
            localStorage.getItem(
              "access_token"
            );

          // ✅ FIXED URL
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

  // ==========================================
  // FILTER + SORT
  // ==========================================

  const filteredNotifications = useMemo(() => {

    let filtered =
      notifications.filter((n) => {

        const d = n.data || {};

        const searchText = `
          ${n.title}
          ${d.vendor || ""}
          ${d.audit_period || ""}
          ${d.branch || ""}
        `
          .toLowerCase();

        const matchesSearch =
          searchText.includes(
            search.toLowerCase()
          );

        if (
          filter === "unread" &&
          n.is_read
        ) {
          return false;
        }

        return matchesSearch;
      });

    if (sortBy === "latest") {

      filtered.sort(
        (a, b) =>
          new Date(
            b.created_at
          ).getTime() -
          new Date(
            a.created_at
          ).getTime()
      );
    }

    if (sortBy === "oldest") {

      filtered.sort(
        (a, b) =>
          new Date(
            a.created_at
          ).getTime() -
          new Date(
            b.created_at
          ).getTime()
      );
    }

    return filtered;

  }, [
    notifications,
    search,
    filter,
    sortBy,
  ]);

  // ==========================================
  // STATS
  // ==========================================

  const unreadCount =
    notifications.filter(
      (n) => !n.is_read
    ).length;

  // ==========================================
  // UI
  // ==========================================

  return (

    <ComponentCard title="Auditor Notifications">

      {/* TOOLBAR */}

      <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-4">

        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

          {/* LEFT */}

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center flex-1">

            {/* SEARCH */}

            <div className="relative w-full lg:w-80">

              <input
                type="text"
                placeholder="Search notifications..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                className="
                  w-full rounded-xl border border-gray-200
                  bg-gray-50
                  py-2.5 pl-10 pr-4
                  text-sm
                  outline-none
                  transition
                  focus:border-blue-400
                  focus:bg-white
                  focus:ring-2 focus:ring-blue-100
                "
              />

              <SearchOutlined
                className="
                  absolute left-3 top-3
                  text-gray-400
                "
              />
            </div>

            {/* FILTERS */}

            <div className="flex flex-wrap gap-2">

              {[
                {
                  key: "all",
                  label: "All"
                },
                {
                  key: "unread",
                  label: "Unread"
                },
              ].map((item) => (

                <button
                  key={item.key}
                  onClick={() =>
                    setFilter(item.key)
                  }
                  className={`
                    rounded-lg px-4 py-2 text-xs font-medium transition

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

          <div className="flex flex-wrap items-center gap-2">

            <div className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700">
              Total: {notifications.length}
            </div>

            <div className="rounded-lg bg-blue-100 px-3 py-2 text-xs font-medium text-blue-700">
              Unread: {unreadCount}
            </div>

            {/* SORT */}

            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value)
              }
              className="
                rounded-lg border border-gray-200
                bg-white
                px-3 py-2
                text-xs
                outline-none
                focus:border-blue-400
              "
            >
              <option value="latest">
                Latest
              </option>

              <option value="oldest">
                Oldest
              </option>
            </select>

            {/* REFRESH */}

            <button
              onClick={fetchNotifications}
              className="
                rounded-lg border border-gray-200
                bg-white
                p-2.5
                hover:bg-gray-50
                transition
              "
            >
              <ReloadOutlined />
            </button>

            {/* MARK ALL */}

            {unreadCount > 0 && (

              <button
                onClick={markAllAsRead}
                className="
                  rounded-lg
                  bg-blue-600
                  px-4 py-2
                  text-xs font-medium
                  text-white
                  hover:bg-blue-700
                  transition
                "
              >
                Mark all
              </button>
            )}
          </div>
        </div>
      </div>

      {/* LIST */}

      <div className="space-y-3">

        {/* LOADING */}

        {loading && (

          <div className="space-y-3 animate-pulse">

            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 rounded-2xl bg-gray-100"
              />
            ))}
          </div>
        )}

        {/* EMPTY */}

        {!loading &&
          filteredNotifications.length === 0 && (

            <div className="rounded-2xl border border-gray-200 bg-white px-6 py-10 text-center">

              <BellOutlined className="text-3xl text-gray-300" />

              <p className="mt-3 text-sm text-gray-500">
                No notifications available
              </p>
            </div>
          )}

        {/* ITEMS */}

        {!loading &&
          filteredNotifications.map((n) => {

            return (

              <div
                key={n.id}
                onClick={() => {

                  navigate(
                    "/auditor-dashboard",
                    {
                      state: {
                        notificationData: n,
                      },
                    }
                  );
                }}
                className={`
                  cursor-pointer
                  relative overflow-hidden rounded-2xl border
                  transition-all duration-200

                  ${
                    n.is_read
                      ? "border-gray-200 bg-white"
                      : "border-blue-200 bg-blue-50/30"
                  }

                  hover:border-blue-300 hover:shadow-md
                `}
              >

                <div className="px-5 py-4">

                  <div className="flex items-start gap-4">

                    {/* ICON */}

                    <div
                      className="
                        flex h-10 w-10 shrink-0
                        items-center justify-center
                        rounded-xl
                        bg-orange-50
                        text-orange-500
                      "
                    >
                      <FileSyncOutlined className="text-base" />
                    </div>

                    {/* CENTER */}

                    <div className="min-w-0 flex-1">

                      {/* HEADER */}

                      <div className="flex flex-wrap items-center gap-2">

                        <div className="flex items-center gap-2">

                          <span className="h-2 w-2 rounded-full bg-blue-500" />

                          <h3 className="text-[15px] font-semibold text-gray-900">
                            Vendor Reuploaded Compliance Documents
                          </h3>
                        </div>

                        {n.data?.cc_issued ? (

                          <span className="rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-[10px] font-semibold text-green-700">
                            ● COMPLIANCE COMPLETED
                          </span>

                        ) : n.data?.reupload_count > 1 ? (

                          <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[10px] font-semibold text-blue-700">
                            ● RESUBMITTED AGAIN
                          </span>

                        ) : (

                          <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700">
                            ● AWAITING REVIEW
                          </span>
                        )}

                        <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                          {n.data?.reuploaded_documents?.length || 0} document(s)
                        </span>

                        <span className="ml-auto text-[11px] text-gray-400">
                          {new Date(
                            n.created_at
                          ).toLocaleDateString()}
                        </span>
                      </div>

                      {/* MESSAGE */}

                      <p className="mt-2 text-sm leading-relaxed text-gray-600">

                        <span className="font-medium text-gray-800">
                          {n.data?.vendor || "Vendor"}
                        </span>{" "}

                        has reuploaded compliance documents for auditor review.
                      </p>

                      {/* REMARKS */}

                      {n.data?.vendor_remark && (

                        <div className="mt-3 rounded-xl border border-orange-100 bg-orange-50 px-3 py-2.5">

                          <div className="mb-1 flex items-center gap-2">

                            <span className="text-[10px] font-semibold uppercase tracking-wide text-orange-700">
                              Vendor Remarks
                            </span>
                          </div>

                          <p className="line-clamp-2 text-xs text-orange-900">
                            {n.data.vendor_remark}
                          </p>
                        </div>
                      )}

                      {/* META */}

                      <div className="mt-3 flex flex-wrap items-center gap-2">

                        <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-700">
                          {n.data?.vendor}
                        </span>

                        <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-700">
                          {n.data?.branch}
                        </span>

                        <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
                          {n.data?.audit_period}
                        </span>
                      </div>

                      {/* DOC TAGS */}

                      {n.data?.reuploaded_documents?.length > 0 && (

                        <div className="mt-3 flex flex-wrap gap-2">

                          {n.data.reuploaded_documents.map(
                            (doc: string, idx: number) => (

                              <span
                                key={idx}
                                className="
                                  rounded-lg border border-blue-100
                                  bg-blue-50
                                  px-2.5 py-1
                                  text-[11px]
                                  font-medium
                                  text-blue-700
                                "
                              >
                                {doc}
                              </span>
                            )
                          )}
                        </div>
                      )}
                    </div>

                    {/* RIGHT */}

                    <div className="ml-auto flex shrink-0 flex-col items-end gap-2">

                      {!n.is_read && (

                        <button
                          onClick={(e) => {

                            e.stopPropagation();

                            markAsRead(n.id);
                          }}
                          className="
                            rounded-xl
                            bg-gray-100
                            px-3 py-1.5
                            text-[11px]
                            font-medium
                            text-gray-700
                            transition hover:bg-gray-200
                          "
                        >
                          Mark Read
                        </button>
                      )}

                      <button
                        onClick={(e) => {

                          e.stopPropagation();

                          navigate(
                            "/auditor-dashboard",
                            {
                              state: {
                                notificationData: n,
                              },
                            }
                          );
                        }}
                        className="
                          rounded-xl
                          bg-blue-600
                          px-4 py-2
                          text-xs
                          font-semibold
                          text-white
                          transition hover:bg-blue-700
                        "
                      >
                        Review Compliance
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </ComponentCard>
  );
}