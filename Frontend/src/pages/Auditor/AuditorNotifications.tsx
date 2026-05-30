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
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("latest");
  const [refreshCountdown, setRefreshCountdown] = useState(10);
  const [lastUpdated, setLastUpdated] = useState("");

  const navigate = useNavigate();

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
        localStorage.getItem("access_token");

      const res = await fetch(
        "http://apii.complianceclearance.com/api/auditor/vendor/notifications/",
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

      setLastUpdated(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );

    } catch (err) {

      console.error(
        "Notification fetch failed",
        err
      );

    } finally {

  if (silent) {

    setTimeout(() => {

      setRefreshing(false);

    }, 800);

  } else {

    setLoading(false);
  }
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
        `http://apii.complianceclearance.com/api/auditor/vendor/notifications/${id}/read/`,
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
            `http://apii.complianceclearance.com/api/auditor/vendor/notifications/${n.id}/read/`,
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

        if (filter === "all") {
          return matchesSearch;
        }

        if (
          filter === "unread" &&
          n.is_read
        ) {
          return false;
        }

        // ======================================
        // REUPLOAD FILTER
        // ======================================

        if (
          filter === "reupload" &&
          !n.title
            ?.toLowerCase()
            .includes("reupload")
        ) {
          return false;
        }

        if (
          filter === "frozen" &&
          !(
            n.title?.toLowerCase()
              .includes("frozen") ||

            n.title?.toLowerCase()
              .includes("cc")
          )
        ) {
          return false;
        }

        if (
          filter === "completed" &&
          !n.data?.cc_issued
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

    const actionRequiredNotifications =
  notifications.filter((n) => {

    const title =
      n.title?.toLowerCase() || "";

    return (

      title.includes("reupload") ||

      title.includes("review") ||

      title.includes("pending")
    );
  });


  // ==========================================
  // UI
  // ==========================================

  return (

    <ComponentCard title="Auditor Notifications">

      {/* PAGE TOP BAR */}

<div className="mb-4 flex items-center justify-between">

  {/* LEFT */}
  <div>

    <h2 className="text-lg font-semibold text-gray-900">
      Notifications Center
    </h2>

    <p className="text-xs text-gray-500 mt-1">
      Monitor vendor compliance reuploads & review activity
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
          px-2.5 py-1.5
          text-xs font-medium
          text-blue-700
        "
      >

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

    <span className="mt-1 text-[10px] text-gray-300">
      Auto refresh every 10s
    </span>

  </div>
</div>


{/* ACTION REQUIRED */}
{/* ACTION REQUIRED */}

{actionRequiredNotifications.length > 0 && (

  <div
    className="
      mb-4
      rounded-2xl
      border border-blue-100
      bg-white
      px-4 py-3
      shadow-sm
    "
  >

    <div
      className="
        flex items-center
        justify-between
        gap-4
      "
    >

      {/* LEFT */}

      <div className="flex items-center gap-3">

        {/* ICON */}

        <div
          className="
            flex h-10 w-10 shrink-0
            items-center justify-center
            rounded-xl
            bg-blue-50
            text-blue-600
          "
        >
          <BellOutlined className="text-base" />
        </div>

        {/* TEXT */}

        <div>

          <h3
            className="
              text-sm
              font-semibold
              text-gray-900
            "
          >
            Action Required
          </h3>

          <p
            className="
              text-xs
              text-gray-500
            "
          >
            {
              actionRequiredNotifications.length
            } workflow items pending review
          </p>

        </div>
      </div>

      {/* RIGHT */}

      <div className="flex items-center gap-2">

        <div
          className="
            rounded-xl
            bg-blue-50
            px-3 py-1.5
            text-xs
            font-medium
            text-blue-700
          "
        >
          {
            actionRequiredNotifications.length
          } Pending
        </div>

        <button
          onClick={() =>
            setFilter("reupload")
          }
          className="
            rounded-xl
            bg-blue-600
            px-4 py-2
            text-xs
            font-medium
            text-white
            transition
            hover:bg-blue-700
          "
        >
          Review
        </button>

      </div>
    </div>
  </div>
)}



      {/* TOOLBAR */}

      <div className="mb-4 rounded-2xl border border-gray-200 bg-gradient-to-b from-white to-gray-50/50 px-4 py-3 shadow-sm">

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">

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
                  text-gray-300
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
              {
                key: "reupload",
                label: "Reupload"
              },
              {
                key: "frozen",
                label: "Frozen"
              },
              {
                key: "completed",
                label: "Completed"
              },
            ].map((item) => (

                <button
                  key={item.key}
                  onClick={() =>
                    setFilter(item.key)
                  }
                  className={`
                    h-9 rounded-xl px-4 text-xs font-medium transition

                    ${
                      filter === item.key

                        ? item.key === "reupload"

                          ? "bg-orange-500 text-white"

                          : item.key === "frozen"

                          ? "bg-purple-600 text-white"

                          : item.key === "completed"

                          ? "bg-green-600 text-white"

                          : "bg-blue-600 text-white"

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

            <div className="rounded-lg bg-blue-100 px-2.5 py-1.5 text-xs font-medium text-blue-700">
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
                px-2.5 py-1.5
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

            <div className="rounded-2xl border border-gray-200 bg-gradient-to-b from-white to-gray-50/50 px-6 py-10 text-center">

              <BellOutlined className="text-3xl text-gray-300" />

              <p className="mt-2 text-sm text-gray-500">
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
                  transition-all duration-300 ease-out

                  ${
                    n.is_read
                      ? "border-gray-200 bg-white"
                      : "border-blue-200 bg-blue-50/30 border-l-[3px]"
                  }

                  hover:-translate-y-[1px]
                  hover:border-blue-300
                  hover:shadow-lg
                `}
              >

                <div className="px-4 py-3 space-y-1">

                  <div className="flex items-start gap-3">

                    {/* ICON */}

                    <div
                      className="
                        flex h-8 w-8 shrink-0
                        items-center justify-center
                        rounded-xl
                        bg-grey-50
                        text-grey-600
                      "
                    >
                    </div>

                    {/* CENTER */}

                    <div className="min-w-0 flex-1">

{/* HEADER */}

<div
  className="
    flex flex-wrap items-center
    gap-3
    border-b border-gray-100
    pb-3
  "
>

  {/* TITLE */}
  <div className="flex items-center gap-3">

    {!n.is_read && (
      <span className="h-2 w-2 rounded-full bg-blue-500" />
    )}

    <h3 className="text-[16px] font-semibold text-gray-900">

      {n.title}

    </h3>

  </div>

{n.data?.cc_issued ? (

  <span
    className="
      rounded-full
      border border-green-200
      bg-green-50
      px-3 py-1
      text-[10px]
      font-semibold
      text-green-700
    "
  >
    COMPLETED
  </span>

) : (
n.data?.status === "FROZEN"

||

n.data?.status === "CC_ISSUED"
) ? (

  <span
    className="
      rounded-full
      border border-purple-200
      bg-purple-50
      px-3 py-1
      text-[10px]
      font-semibold
      text-purple-700
    "
  >
    FROZEN
  </span>

) : (

  <span
    className="
      rounded-full
      border border-blue-200
      bg-blue-50
      px-3 py-1
      text-[10px]
      font-semibold
      text-blue-700
    "
  >
    • AWAITING REVIEW
  </span>

)}

  {/* DATE */}
  <div className="flex items-center gap-3 text-gray-300">

    <span className="h-5 w-px bg-gray-200" />

    <span className="text-[11px] text-gray-500 font-medium">
      {new Date(
        n.created_at
      ).toLocaleDateString()}
    </span>

  </div>

  {/* ACTIONS */}
  <div className="ml-auto flex items-center gap-2">

    {!n.is_read && (

      <button
        onClick={(e) => {

          e.stopPropagation();

          markAsRead(n.id);
        }}
        className="
          rounded-lg
          border border-gray-200
          bg-white
          px-2.5 py-1
          text-[10px]
          font-medium
          text-gray-600
          transition
          hover:bg-gray-50
        "
      >
        Mark Read
      </button>
    )}

    <button
      onClick={async () => {

        navigate(
          "/auditor-dashboard",
          {
            state: {
              notificationData: n,
            },
          }
        );

        if (!n.is_read) {

          await markAsRead(n.id);
        }
      }}
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
      Review
    </button>

  </div>

</div>

            

                      {/* REMARKS */}

                      {n.data?.vendor_remark && (

                        <div
                          className="
                            mt-2
                            flex items-center gap-2
                            rounded-lg
                            bg-grey-50
                            px-2.5 py-1.5
                            text-[13px]
                            text-grey-700
                          "
                        >


                          <span className="truncate">
                            {n.data.vendor_remark}
                          </span>

                        </div>
                      )}

                        {/* INFO BAR */}

                        <div
                          className="
                            mt-2
                            flex flex-wrap items-center gap-2
                            rounded-xl
                            border border-gray-200
                            bg-gray-50
                            px-3 py-2
                            text-[13px]
                            text-gray-600
                          "
                        >

                          <span className="font-medium text-gray-800">
                            {n.data?.vendor}
                          </span>

                          <span className="text-gray-300">
                            •
                          </span>

                          <span>
                            {n.data?.branch}
                          </span>

                          <span className="text-gray-300">
                            •
                          </span>

                          <span className="font-medium">
                            {n.data?.audit_period}
                          </span>

                        </div>

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