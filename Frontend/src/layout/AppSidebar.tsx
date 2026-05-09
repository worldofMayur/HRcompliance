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
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
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

  return (
    <>
      <LoadingBar
        color="#2563eb"
        height={3}
        shadow={false}
        ref={loadingBarRef}
        waitingTime={300}
      />

      <aside
        className={`fixed top-0 left-0 z-50 mt-16 h-screen border-r border-gray-200/60 shadow-[4px_0_24px_rgba(15,23,42,0.03)] bg-white/85 backdrop-blur-xl px-4 transition-all duration-200 hover:translate-x-[2px] duration-300 dark:border-gray-800 dark:bg-gray-900 lg:mt-0
          ${
            isExpanded || isMobileOpen || isHovered
              ? "w-[290px]"
              : "w-[90px]"
          }
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0`}
        onMouseEnter={() => !isExpanded && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className={`pt-7 pb-6 flex ${
            !isExpanded && !isHovered
              ? "lg:justify-center"
              : "justify-center"
          }`}
        >
          <Link
            to="/TailAdmin/"
            onClick={handleNavigation}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 hover:translate-x-[2px]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-blue-600 text-white shadow-md">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L4 5V11C4 16.25 7.4 21.05 12 22C16.6 21.05 20 16.25 20 11V5L12 2Z"
                  fill="currentColor"
                />
              </svg>
            </div>

            {(isExpanded || isHovered || isMobileOpen) && (
              <div className="flex flex-col leading-tight justify-center">
                <span className="text-[15px] font-semibold text-gray-800 dark:text-gray-100">
                  HR Compliance
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  Enterprise Portal
                </span>
              </div>
            )}
          </Link>
        </div>

        <nav className="mt-3 px-1">
          <h2
            className={`mb-4 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400 flex ${
              !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
            }`}
          >
            {isExpanded || isHovered || isMobileOpen ? (
              "Compliance Modules"
            ) : (
              <HorizontaLDots className="size-6" />
            )}
          </h2>

          <ul className="flex flex-col gap-3">

            {/* ================= SUPERADMIN MENU ================= */}
            {role === "SUPERADMIN" && (
              <>
                <li>
                  <Link
                    to="principle-employee"
                    onClick={handleNavigation}
                    className={`menu-item group flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200 hover:translate-x-[2px]
                      ${
                        isActive("/principle-employee")
                          ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border border-blue-100 dark:bg-white/85 backdrop-blur-xl/[0.08]"
                          : "text-gray-700 hover:bg-white hover:shadow-sm hover:border hover:border-gray-200 dark:text-gray-300 dark:hover:bg-white/85 backdrop-blur-xl/[0.05]"
                      }`}
                  >
                    <span className="menu-item-icon-size">
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
                    className={`menu-item group flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200 hover:translate-x-[2px]
                      ${
                        isActive("/vendor")
                          ? "bg-brand-50 text-brand-600 dark:bg-white/85 backdrop-blur-xl/[0.08]"
                          : "text-gray-700 hover:bg-white hover:shadow-sm hover:border hover:border-gray-200 dark:text-gray-300 dark:hover:bg-white/85 backdrop-blur-xl/[0.05]"
                      }`}
                  >
                    <span className="menu-item-icon-size">
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
                    className={`menu-item group flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200 hover:translate-x-[2px]
                      ${
                        isActive("/auditor")
                          ? "bg-brand-50 text-brand-600 dark:bg-white/85 backdrop-blur-xl/[0.08]"
                          : "text-gray-700 hover:bg-white hover:shadow-sm hover:border hover:border-gray-200 dark:text-gray-300 dark:hover:bg-white/85 backdrop-blur-xl/[0.05]"
                      }`}
                  >
                    <span className="menu-item-icon-size">
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
                    className={`menu-item group flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200 hover:translate-x-[2px]
                      ${
                        isActive("/audit-checklist")
                          ? "bg-brand-50 text-brand-600 dark:bg-white/85 backdrop-blur-xl/[0.08]"
                          : "text-gray-700 hover:bg-white hover:shadow-sm hover:border hover:border-gray-200 dark:text-gray-300 dark:hover:bg-white/85 backdrop-blur-xl/[0.05]"
                      }`}
                  >
                    <span className="menu-item-icon-size">
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
                    className={`menu-item group flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200 hover:translate-x-[2px]
                      ${
                        isActive("/documents")
                          ? "bg-brand-50 text-brand-600 dark:bg-white/85 backdrop-blur-xl/[0.08]"
                          : "text-gray-700 hover:bg-white hover:shadow-sm hover:border hover:border-gray-200 dark:text-gray-300 dark:hover:bg-white/85 backdrop-blur-xl/[0.05]"
                      }`}
                  >
                    <span className="menu-item-icon-size">
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
                {/* 🔹 Vendor Mapping */}
                <li>
                  <Link
                    to="vendor-mapping"
                    onClick={handleNavigation}
                    className={`menu-item group flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200 hover:translate-x-[2px]
                      ${
                        isActive("/vendor-mapping")
                          ? "bg-brand-50 text-brand-600 dark:bg-white/85 backdrop-blur-xl/[0.08]"
                          : "text-gray-700 hover:bg-white hover:shadow-sm hover:border hover:border-gray-200 dark:text-gray-300 dark:hover:bg-white/85 backdrop-blur-xl/[0.05]"
                      }`}
                  >
                    <span className="menu-item-icon-size">
                      <BoxCubeIcon />
                    </span>
                    {(isExpanded || isHovered || isMobileOpen) && (
                      <span className="menu-item-text font-medium">
                        Vendor Mapping
                      </span>
                    )}
                  </Link>
                </li>

                {/* 🔹 Manage Vendor */}
                <li>
                  <Link
                    to="manage-vendor"
                    onClick={handleNavigation}
                    className={`menu-item group flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200 hover:translate-x-[2px]
                      ${
                        isActive("/manage-vendor")
                          ? "bg-brand-50 text-brand-600 dark:bg-white/85 backdrop-blur-xl/[0.08]"
                          : "text-gray-700 hover:bg-white hover:shadow-sm hover:border hover:border-gray-200 dark:text-gray-300 dark:hover:bg-white/85 backdrop-blur-xl/[0.05]"
                      }`}
                  >
                    <span className="menu-item-icon-size">
                      <BoxCubeIcon />
                    </span>
                    {(isExpanded || isHovered || isMobileOpen) && (
                      <span className="menu-item-text font-medium">
                        Manage Vendor
                      </span>
                    )}
                  </Link>
                </li>

                {/* 🔹 Notifications */}
                <li>
                  <Link
                    to="vendor-notifications"
                    onClick={handleNavigation}
                    className={`menu-item group flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200 hover:translate-x-[2px]
                      ${
                        isActive("/vendor-notifications")
                          ? "bg-brand-50 text-brand-600 dark:bg-white/85 backdrop-blur-xl/[0.08]"
                          : "text-gray-700 hover:bg-white hover:shadow-sm hover:border hover:border-gray-200 dark:text-gray-300 dark:hover:bg-white/85 backdrop-blur-xl/[0.05]"
                      }`}
                  >
                    <span className="menu-item-icon-size">
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
    {/* Submit Compliance */}
    <li>
      <Link
        to="vendor-compliance"
        onClick={handleNavigation}
        className={`menu-item group flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200 hover:translate-x-[2px]
          ${
            isActive("/vendor-compliance")
              ? "bg-brand-50 text-brand-600 dark:bg-white/85 backdrop-blur-xl/[0.08]"
              : "text-gray-700 hover:bg-white hover:shadow-sm hover:border hover:border-gray-200 dark:text-gray-300 dark:hover:bg-white/85 backdrop-blur-xl/[0.05]"
          }`}
      >
        <span className="menu-item-icon-size">
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
    className={`menu-item group flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200 hover:translate-x-[2px]
      ${
        isActive("/manage-cc-emails")
          ? "bg-brand-50 text-brand-600 dark:bg-white/85 backdrop-blur-xl/[0.08]"
          : "text-gray-700 hover:bg-white hover:shadow-sm hover:border hover:border-gray-200 dark:text-gray-300 dark:hover:bg-white/85 backdrop-blur-xl/[0.05]"
      }`}
  >
    <span className="menu-item-icon-size">
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
    className={`menu-item group flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200 hover:translate-x-[2px]
      ${
        isActive("/vendor-notifications")
          ? "bg-brand-50 text-brand-600 dark:bg-white/85 backdrop-blur-xl/[0.08]"
          : "text-gray-700 hover:bg-white hover:shadow-sm hover:border hover:border-gray-200 dark:text-gray-300 dark:hover:bg-white/85 backdrop-blur-xl/[0.05]"
      }`}
  >
    <span className="menu-item-icon-size">
      <ListIcon />
    </span>

    {(isExpanded || isHovered || isMobileOpen) && (
      <span className="menu-item-text font-medium">
        Notifications
      </span>
    )}
  </Link>
</li>

        {/* ✅ NEW: Manage CC Emails */}

      </>
    )}


            {/* ================= AUDITOR MENU ================= */}
{role === "AUDITOR" && (
  <>
    <li>
      <Link
        to="auditor-dashboard"
        onClick={handleNavigation}
        className={`menu-item group flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200 hover:translate-x-[2px]
          ${
            isActive("/auditor-dashboard")
              ? "bg-brand-50 text-brand-600 dark:bg-white/85 backdrop-blur-xl/[0.08]"
              : "text-gray-700 hover:bg-white hover:shadow-sm hover:border hover:border-gray-200 dark:text-gray-300 dark:hover:bg-white/85 backdrop-blur-xl/[0.05]"
          }`}
      >
        <span className="menu-item-icon-size">
          <TableIcon />
        </span>
        {(isExpanded || isHovered || isMobileOpen) && (
          <span className="menu-item-text font-medium">
            Audit Dashboard
          </span>
        )}
      </Link>
    </li>

    {/* OPTIONAL - Future ready */}
    <li>
      <Link
        to="audit-history"
        onClick={handleNavigation}
        className={`menu-item group flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-200 hover:translate-x-[2px]
          ${
            isActive("/audit-history")
              ? "bg-brand-50 text-brand-600 dark:bg-white/85 backdrop-blur-xl/[0.08]"
              : "text-gray-700 hover:bg-white hover:shadow-sm hover:border hover:border-gray-200 dark:text-gray-300 dark:hover:bg-white/85 backdrop-blur-xl/[0.05]"
          }`}
      >
        <span className="menu-item-icon-size">
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