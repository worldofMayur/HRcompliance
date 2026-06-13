import { useCallback, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router";
import LoadingBar from "react-top-loading-bar";

import {
  ListIcon,
  TableIcon,
  BoxCubeIcon,
  PlugInIcon,
  HorizontaLDots,
} from "../icons";

import { useSidebar } from "../context/SidebarContext";

const AppSidebar: React.FC = () => {
  const {
    isExpanded,
    isMobileOpen,
    isHovered,
    setIsHovered,
  } = useSidebar();

  const location = useLocation();

  // ROLE (IMPORTANT)
  const role = localStorage.getItem("role");

  const loadingBarRef = useRef<any>(null);

  const isActive = useCallback(
    (path: string) => location.pathname.includes(path),
    [location.pathname]
  );

  useEffect(() => {
    loadingBarRef.current?.complete();
  }, [location.pathname]);

  const handleNavigation = () => {
    loadingBarRef.current?.continuousStart(30);
  };

  // COMMON MENU STYLE
  const menuClass = (path: string) =>
    `menu-item group relative flex items-center gap-3 overflow-hidden rounded-2xl px-4 py-3 transition-all duration-300 ease-out hover:translate-x-[2px]
    ${
      isActive(path)
        ? `
          border border-brand-100
          bg-gradient-to-r
          from-brand-50
          to-blue-50
          text-brand-700
          shadow-sm
          dark:border-white/[0.06]
          dark:bg-white/[0.08]
          dark:text-white

          border border-brand-100
          bg-gradient-to-r
          from-brand-50
          to-blue-50
          text-brand-700
          shadow-sm
          dark:border-white/[0.06]
          dark:bg-white/[0.08]
          dark:text-white
        `
        : `
          text-gray-700
          hover:border
          hover:border-gray-200
          hover:bg-white
          hover:shadow-sm
          dark:text-gray-300
          dark:hover:border-white/[0.04]
          dark:hover:bg-white/[0.04]
        `
    }`;

  return (
    <>
      {/* TOP LOADING BAR */}
      <LoadingBar
        color="#2563eb"
        height={2}
        shadow="0 0 10px rgba(37,99,235,0.35)"
        ref={loadingBarRef}
        waitingTime={300}
      />

      {/* SIDEBAR */}
      <aside
        className={`
          fixed
          top-0
          left-0
          z-50
          mt-16
          h-screen
          overflow-hidden
          border-r
          border-gray-200/60
          bg-white/85
          px-4
          shadow-[4px_0_24px_rgba(15,23,42,0.05)]
          backdrop-blur-xl
          transition-all
          duration-300
          ease-out
          hover:translate-x-[2px]

          before:absolute
          before:right-0
          before:top-0
          before:h-full
          before:w-px
          before:bg-gradient-to-b
          before:from-transparent
          before:via-gray-200/60
          before:to-transparent

          dark:border-gray-800
          dark:bg-gray-900/95
          lg:mt-0

          ${
            isExpanded || isMobileOpen || isHovered
              ? "w-[290px]"
              : "w-[90px]"
          }

          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}

          lg:translate-x-0
        `}
        onMouseEnter={() => !isExpanded && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* BACKGROUND GLOW */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="
              absolute
              right-[-60px]
              top-[120px]
              h-[180px]
              w-[180px]
              rounded-full
              bg-brand-50/70
              blur-3xl
            "
          />

          <div
            className="
              absolute
              bottom-[-40px]
              left-[-40px]
              h-[140px]
              w-[140px]
              rounded-full
              bg-indigo-500/10
              blur-3xl
            "
          />
        </div>

        {/* LOGO SECTION */}
        <div
          className={`
            relative
            z-10
            flex
            pt-2
            pb-3
            ${
              !isExpanded && !isHovered
                ? "lg:justify-center"
                : "justify-center"
            }
          `}
        >
          <Link
            to="/TailAdmin/"
            onClick={handleNavigation}
              className="
              group/logo
              flex
              flex-col
              items-center
              gap-0
              rounded-2xl
              px-2
              py-1
              transition-all
              duration-300
              hover:translate-x-[2px]
            "
          >
            {/* LOGO ICON */}
            <div className="flex items-center justify-center">
            <img
              src="/Kekul-Logo.png"
              alt="KEKUL"
              style={{
                width: "120px",
                display: "block",
                marginBottom: "12px",
                marginTop: "12px",
              }}
            />
            </div>

            {/* LOGO TEXT */}
            {(isExpanded || isHovered || isMobileOpen) && (
<div className="flex flex-col items-center text-center leading-tight mt-4">
                  <span
                  className="
                    text-[18px]
                    font-bold
                    tracking-[0.01em]
                    text-gray-800
                    dark:text-gray-100
                  "
                >
                  Vendor Compliance
                </span>

                <span className="text-xs text-gray-400 dark:text-gray-500">
                 Audit Management Platform
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* NAVIGATION */}
        <nav
          className="
            relative
            z-10
            mt-3
            h-[calc(100vh-140px)]
            overflow-y-auto
            px-1
            pb-24
          "
        >
          {/* SECTION TITLE */}
          <h2
            className={`
              mb-4
              flex
              px-3
              text-[11px]
              font-semibold
              uppercase
              tracking-[0.16em]
              text-gray-400
              ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "justify-start"
              }
            `}
          >
            {isExpanded || isHovered || isMobileOpen ? (
              "Compliance Modules"
            ) : (
              <HorizontaLDots className="size-6" />
            )}
          </h2>

          {/* MENU LIST */}
          <ul className="flex flex-col gap-3">

            {/* ================= SUPERADMIN MENU ================= */}
            {role === "SUPERADMIN" && (
              <>
                <li>
                  <Link
                    to="principle-employee"
                    onClick={handleNavigation}
                    className={menuClass("/principle-employee")}
                  >
                    <span className="menu-item-icon-size shrink-0">
                      <ListIcon />
                    </span>

                    {(isExpanded || isHovered || isMobileOpen) && (
                      <span className="menu-item-text font-medium">
                        Manage Principal Employer
                      </span>
                    )}
                  </Link>
                </li>

                <li>
                  <Link
                    to="vendor"
                    onClick={handleNavigation}
                    className={menuClass("/vendor")}
                  >
                    <span className="menu-item-icon-size shrink-0">
                      <BoxCubeIcon />
                    </span>

                    {(isExpanded || isHovered || isMobileOpen) && (
                      <span className="menu-item-text font-medium">
                        Manage Vendor
                      </span>
                    )}
                  </Link>
                </li>

                <li>
                  <Link
                    to="auditor"
                    onClick={handleNavigation}
                    className={menuClass("/auditor")}
                  >
                    <span className="menu-item-icon-size shrink-0">
                      <PlugInIcon />
                    </span>

                    {(isExpanded || isHovered || isMobileOpen) && (
                      <span className="menu-item-text font-medium">
                        Manage Auditor
                      </span>
                    )}
                  </Link>
                </li>

                <li>
                  <Link
                    to="audit-checklist"
                    onClick={handleNavigation}
                    className={menuClass("/audit-checklist")}
                  >
                    <span className="menu-item-icon-size shrink-0">
                      <TableIcon />
                    </span>

                    {(isExpanded || isHovered || isMobileOpen) && (
                      <span className="menu-item-text font-medium">
                        Manage Audit Checklist
                      </span>
                    )}
                  </Link>
                </li>

                <li>
                  <Link
                    to="documents"
                    onClick={handleNavigation}
                    className={menuClass("/documents")}
                  >
                    <span className="menu-item-icon-size shrink-0">
                      <BoxCubeIcon />
                    </span>

                    {(isExpanded || isHovered || isMobileOpen) && (
                      <span className="menu-item-text font-medium">
                        Manage Documents
                      </span>
                    )}
                  </Link>
                </li>
              </>
            )}

            {/* ================= PE MENU ================= */}
            {role === "PE" && (
              <>
                <li>
                  <Link
                    to="vendor-mapping"
                    onClick={handleNavigation}
                    className={menuClass("/vendor-mapping")}
                  >
                    <span className="menu-item-icon-size shrink-0">
                      <BoxCubeIcon />
                    </span>

                    {(isExpanded || isHovered || isMobileOpen) && (
                      <span className="menu-item-text font-medium">
                        Vendor Mapping
                      </span>
                    )}
                  </Link>
                </li>

                <li>
                  <Link
                    to="manage-vendor"
                    onClick={handleNavigation}
                    className={menuClass("/manage-vendor")}
                  >
                    <span className="menu-item-icon-size shrink-0">
                      <BoxCubeIcon />
                    </span>

                    {(isExpanded || isHovered || isMobileOpen) && (
                      <span className="menu-item-text font-medium">
                        Manage Vendor
                      </span>
                    )}
                  </Link>
                </li>

                <li>
                  <Link
                    to="freeze-audit-reports"
                    onClick={handleNavigation}
                    className={menuClass("/freeze-audit-reports")}
                  >
                    <span className="menu-item-icon-size shrink-0">
                      <TableIcon />
                    </span>

                    {(isExpanded || isHovered || isMobileOpen) && (
                      <span className="menu-item-text font-medium">
                        Frozen Audit Reports
                      </span>
                    )}
                  </Link>
                </li>

                <li>
                  <Link
                    to="pe-notifications"
                    onClick={handleNavigation}
                    className={menuClass("/vendor-notifications")}
                  >
                    <span className="menu-item-icon-size shrink-0">
                      <ListIcon />
                    </span>

                    {(isExpanded || isHovered || isMobileOpen) && (
                      <span className="menu-item-text font-medium">
                        Notifications
                      </span>
                    )}
                  </Link>
                </li>
              </>
            )}

            {/* ================= VENDOR MENU ================= */}
            {role === "VENDOR" && (
              <>
                <li>
                  <Link
                    to="vendor-compliance"
                    onClick={handleNavigation}
                    className={menuClass("/vendor-compliance")}
                  >
                    <span className="menu-item-icon-size shrink-0">
                      <TableIcon />
                    </span>

                    {(isExpanded || isHovered || isMobileOpen) && (
                      <span className="menu-item-text font-medium">
                        Submit Compliance Records
                      </span>
                    )}
                  </Link>
                </li>

                <li>
                  <Link
                    to="manage-cc-emails"
                    onClick={handleNavigation}
                    className={menuClass("/manage-cc-emails")}
                  >
                    <span className="menu-item-icon-size shrink-0">
                      <ListIcon />
                    </span>

                    {(isExpanded || isHovered || isMobileOpen) && (
                      <span className="menu-item-text font-medium">
                        Manage CC Emails
                      </span>
                    )}
                  </Link>
                </li>

                <li>
                  <Link
                    to="vendor-notifications"
                    onClick={handleNavigation}
                    className={menuClass("/vendor-notifications")}
                  >
                    <span className="menu-item-icon-size shrink-0">
                      <ListIcon />
                    </span>

                    {(isExpanded || isHovered || isMobileOpen) && (
                      <span className="menu-item-text font-medium">
                        Notifications
                      </span>
                    )}
                  </Link>
                </li>
              </>
            )}

            {/* ================= AUDITOR MENU ================= */}
            {role === "AUDITOR" && (
              <>
                <li>
                  <Link
                    to="auditor-dashboard"
                    onClick={handleNavigation}
                    className={menuClass("/auditor-dashboard")}
                  >
                    <span className="menu-item-icon-size shrink-0">
                      <TableIcon />
                    </span>

                    {(isExpanded || isHovered || isMobileOpen) && (
                      <span className="menu-item-text font-medium">
                        Audit Dashboard
                      </span>
                    )}
                  </Link>
                </li>

                <li>
                  <Link
                    to="freeze-audit-reports"
                    onClick={handleNavigation}
                    className={menuClass("/freeze-audit-reports")}
                  >
                    <span className="menu-item-icon-size shrink-0">
                      <ListIcon />
                    </span>

                    {(isExpanded || isHovered || isMobileOpen) && (
                      <span className="menu-item-text font-medium">
                        Freeze Audit Reports
                      </span>
                    )}
                  </Link>
                </li>

                <li>
                  <Link
                    to="auditor-notifications"
                    onClick={handleNavigation}
                    className={menuClass("/auditor-notifications")}
                  >
                    <span className="menu-item-icon-size shrink-0">
                      <ListIcon />
                    </span>

                    {(isExpanded || isHovered || isMobileOpen) && (
                      <span className="menu-item-text font-medium">
                        Notifications
                      </span>
                    )}
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default AppSidebar;