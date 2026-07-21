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

  const menuClass = (path: string) =>
    `menu-item group relative flex items-center gap-3 overflow-hidden rounded-xl px-3.5 py-2.5 transition-all duration-200
    ${
      isActive(path)
        ? `bg-brand-50/90 text-brand-700 font-medium dark:bg-white/[0.08] dark:text-white
           before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2
           before:h-5 before:w-[3px] before:rounded-r-full before:bg-brand-500`
        : `text-gray-600 hover:bg-gray-50 hover:text-gray-900
           dark:text-gray-400 dark:hover:bg-white/[0.04] dark:hover:text-gray-200`
    }`;

  return (
    <>
      <LoadingBar
        color="#2563eb"
        height={2}
        shadow="0 0 10px rgba(37,99,235,0.35)"
        ref={loadingBarRef}
        waitingTime={300}
      />

      <aside
        className={`
          fixed top-0 left-0 z-50 mt-16 h-screen overflow-hidden
          border-r border-gray-200/60 bg-white/90 px-3
          shadow-[4px_0_24px_rgba(15,23,42,0.04)]
          backdrop-blur-xl transition-all duration-300 ease-out
          dark:border-gray-800 dark:bg-gray-900/95
          lg:mt-0

          ${isExpanded || isMobileOpen || isHovered ? "w-[290px]" : "w-[90px]"}
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
        onMouseEnter={() => !isExpanded && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute right-[-50px] top-[100px] h-[160px] w-[160px] rounded-full bg-brand-50/60 blur-3xl" />
        </div>

        <div
          className={`
            relative z-10 flex pt-3 pb-2
            ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-center"}
          `}
        >
          <Link
            to="/TailAdmin/"
            onClick={handleNavigation}
            className="group/logo flex flex-col items-center gap-0 rounded-2xl px-2 py-1 transition-all duration-300"
          >
            <img
              src="/Kekul-Logo.png"
              alt="KEKUL"
              className="block"
              style={{
                width: isExpanded || isHovered || isMobileOpen ? "110px" : "42px",
                marginBottom: "6px",
                marginTop: "4px",
                transition: "width 0.25s ease",
              }}
            />

            {(isExpanded || isHovered || isMobileOpen) && (
              <div className="mt-1 flex flex-col items-center text-center leading-tight">
                <span className="text-[15px] font-semibold tracking-tight text-gray-800 dark:text-gray-100">
                  Vendor Compliance
                </span>
                <span className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
                  Audit Management Platform
                </span>
              </div>
            )}
          </Link>
        </div>

        <nav className="relative z-10 mt-2 h-[calc(100vh-130px)] overflow-y-auto px-1 pb-20">
          <h2
            className={`
              mb-3 flex px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400
              ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}
            `}
          >
            {isExpanded || isHovered || isMobileOpen ? (
              "Compliance Modules"
            ) : (
              <HorizontaLDots className="size-5" />
            )}
          </h2>

          <ul className="flex flex-col gap-1.5">
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
                      <span className="menu-item-text">Manage Principal Employer</span>
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
                      <span className="menu-item-text">Manage Vendor</span>
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
                      <span className="menu-item-text">Manage Auditor</span>
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
                      <span className="menu-item-text">Manage Audit Checklist</span>
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
                      <span className="menu-item-text">Manage Documents</span>
                    )}
                  </Link>
                </li>
              </>
            )}

            {role === "PE" && (
              <>
                <li>
                  <Link
                    to="reports-dashboard"
                    onClick={handleNavigation}
                    className={menuClass("/dashboard")}
                  >
                    <span className="menu-item-icon-size shrink-0">
                      <TableIcon />
                    </span>
                    {(isExpanded || isHovered || isMobileOpen) && (
                      <span className="menu-item-text">Reports & Dashboard</span>
                    )}
                  </Link>
                </li>

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
                      <span className="menu-item-text">Vendor Mapping</span>
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
                      <span className="menu-item-text">Manage Vendor</span>
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
                      <span className="menu-item-text">Frozen Audit Reports</span>
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
                      <span className="menu-item-text">Notifications</span>
                    )}
                  </Link>
                </li>
              </>
            )}

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
                      <span className="menu-item-text">Submit Compliance Records</span>
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
                      <span className="menu-item-text">Manage CC Emails</span>
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
                      <span className="menu-item-text">Notifications</span>
                    )}
                  </Link>
                </li>
              </>
            )}

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
                      <span className="menu-item-text">Audit Dashboard</span>
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
                      <span className="menu-item-text">Freeze Audit Reports</span>
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
                      <span className="menu-item-text">Notifications</span>
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