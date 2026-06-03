import { useMemo, useState } from "react";

import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { Link } from "react-router";

interface NotificationItem {
  id: number;
  role: string;
  title: string;
  subtitle: string;
  time: string;
  unread?: boolean;
}

export default function NotificationDropdown() {

  const [isOpen, setIsOpen] =
    useState(false);

  // ==========================================
  // ROLE
  // ==========================================

  const role =
    (
      localStorage.getItem("role")
      || "PE"
    ).toUpperCase();

  // ==========================================
  // ROLE NOTIFICATIONS
  // ==========================================

  const notifications:
    NotificationItem[] = [

    {
      id: 1,
      role: "PE",
      title:
        "Compliance Certificate Issued",
      subtitle:
        "KeKul Bizserv • Nagpur",
      time: "5 mins ago",
      unread: true,
    },

    {
      id: 2,
      role: "PE",
      title:
        "ZIP Documents Ready",
      subtitle:
        "Delhi Branch • Jan-Mar 2026",
      time: "10 mins ago",
      unread: true,
    },

    {
      id: 3,
      role: "PE",
      title:
        "Audit Pending Review",
      subtitle:
        "2 audit items require review",
      time: "20 mins ago",
    },

    {
      id: 4,
      role: "AUDITOR",
      title:
        "Vendor Documents Missing",
      subtitle:
        "PF challan not uploaded",
      time: "8 mins ago",
      unread: true,
    },

    {
      id: 5,
      role: "VENDOR",
      title:
        "Compliance Rejected",
      subtitle:
        "Please upload revised documents",
      time: "1 hour ago",
      unread: true,
    },
  ];

  // ==========================================
  // FILTER
  // ==========================================

  const filteredNotifications =
    useMemo(() => {

      return notifications.filter(
        (n) =>
          n.role === role
      );

    }, [role]);

  // ==========================================
  // ONLY LATEST 2
  // ==========================================

  const latestNotifications =
    filteredNotifications.slice(0, 2);

  // ==========================================
  // UNREAD COUNT
  // ==========================================

  const unreadCount =
    filteredNotifications.filter(
      (n) => n.unread
    ).length;

  // ==========================================
  // ROUTING
  // ==========================================

  const notificationPagePath =

    role === "PE"

      ? "/pe-notifications"

    : role === "AUDITOR"

      ? "/auditor-notifications"

    : role === "VENDOR"

      ? "/vendor-notifications"

    : "/notifications";

  // ==========================================
  // DROPDOWN
  // ==========================================

  function toggleDropdown() {

    setIsOpen(!isOpen);
  }

  function closeDropdown() {

    setIsOpen(false);
  }

  return (

    <div className="relative">

      {/* BELL BUTTON */}

<button
  onClick={toggleDropdown}
  className="
    relative flex h-11 w-11
    items-center justify-center
    rounded-2xl
    border border-gray-200
    bg-white
    text-gray-500
    transition-all duration-200
    hover:border-blue-200
    hover:bg-blue-50
    hover:text-blue-600
    hover:shadow-sm
  "
>

  {/* COUNT BADGE */}

  {
    unreadCount > 0 && (

      <div
        className="
          absolute -right-1 -top-1
          flex h-5 min-w-[20px]
          items-center justify-center
          rounded-2xl
          bg-blue-500
          px-1
          text-[10px]
          font-semibold
          text-white
          shadow-sm
        "
      >

        {unreadCount}

      </div>
    )
  }

  {/* MODERN ICON */}

  <svg
    xmlns="https://www.w3.org/2000/svg"
    className="
      h-[18px] w-[18px]
      stroke-[2]
    "
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >

    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
    />

  </svg>

</button>

      {/* DROPDOWN */}

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className={`
          absolute right-0 mt-4
          flex w-[360px]
          flex-col
          rounded-2xl
          border border-gray-200
          bg-white
          p-3
          shadow-2xl
          transition-all duration-300

          ${
            isOpen

              ? `
                translate-y-0
                opacity-100
                scale-100
              `

              : `
                pointer-events-none
                -translate-y-2
                opacity-0
                scale-95
              `
          }
        `}
      >

        {/* HEADER */}

        <div
          className="
            mb-3 flex items-center
            justify-between
            border-b border-gray-100
            pb-3
          "
        >

          <div>

            <h5
              className="
                text-base font-semibold
                text-gray-800
              "
            >

              Notifications

            </h5>

            <p
              className="
                mt-0.5 text-xs
                text-gray-500
              "
            >

              {unreadCount} unread notifications

            </p>

          </div>

          <button
            onClick={toggleDropdown}
            className="
              text-gray-400
              transition hover:text-gray-700
            "
          >

            ✕

          </button>

        </div>

        {/* ROLE */}

        <div className="mb-3">

          <span
            className="
              rounded-2xl
              bg-blue-50
              px-3 py-1
              text-[10px]
              font-semibold
              uppercase tracking-wide
              text-blue-700
            "
          >

            {role} Notifications

          </span>

        </div>

        {/* LIST */}

        <ul className="space-y-2">

          {
            latestNotifications.map(
              (item) => (

                <li key={item.id}>

                  <DropdownItem
                    onItemClick={
                      closeDropdown
                    }

                    className={`
                      relative
                      rounded-xl
                      border
                      px-4 py-3
                      transition-all duration-200
                      hover:shadow-sm

                      ${
                        item.unread

                          ? `
                            border-blue-100
                            bg-blue-50/40
                            hover:bg-blue-50/60
                          `

                          : `
                            border-gray-100
                            bg-white
                            hover:bg-gray-50
                          `
                      }
                    `}
                  >

                    {/* TOP */}

                    <div className="flex items-start justify-between gap-3">

                      <div className="min-w-0 flex-1">

                        {/* TITLE */}

                        <div className="flex items-center gap-2">

                          {
                            item.unread && (

                              <span
                                className="
                                  h-2 w-2
                                  rounded-2xl
                                  bg-blue-500
                                  flex-shrink-0
                                "
                              />

                            )
                          }

                          <p
                            className="
                              truncate
                              text-sm
                              font-semibold
                              text-gray-800
                            "
                          >

                            {item.title}

                          </p>

                        </div>

                        {/* SUBTITLE */}

                        <p
                          className="
                            mt-1 pl-4
                            text-xs
                            leading-relaxed
                            text-gray-500
                          "
                        >

                          {item.subtitle}

                        </p>

                      </div>

                      {/* TIME */}

                      <span
                        className="
                          whitespace-nowrap
                          text-[11px]
                          text-gray-400
                        "
                      >

                        {item.time}

                      </span>

                    </div>

                    {/* FOOTER */}

                    <div
                      className="
                        mt-3 flex
                        items-center
                        justify-between
                      "
                    >

                      <span
                        className="
                          rounded-2xl
                          bg-gray-100
                          px-2.5 py-1
                          text-[10px]
                          font-semibold
                          uppercase tracking-wide
                          text-gray-600
                        "
                      >

                        {item.role}

                      </span>

                      {
                        item.unread
                        && (

                          <span
                            className="
                              text-[10px]
                              font-medium
                              text-blue-600
                            "
                          >

                            New

                          </span>

                        )
                      }

                    </div>

                  </DropdownItem>

                </li>
              )
            )
          }

        </ul>

        {/* FOOTER */}

        <Link
          to={notificationPagePath}
          onClick={closeDropdown}
          className="
            mt-4 block
            rounded-xl
            border border-gray-200
            bg-white
            px-4 py-3
            text-center text-sm
            font-semibold
            text-gray-700
            transition-all duration-200
            hover:bg-gray-50
            hover:shadow-sm
          "
        >

          View All Notifications

        </Link>

      </Dropdown>

    </div>
  );
}