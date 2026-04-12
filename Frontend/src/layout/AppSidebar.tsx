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
        className={`fixed top-0 left-0 z-50 mt-16 h-screen border-r border-gray-200 bg-white px-4 transition-all duration-300 dark:border-gray-800 dark:bg-gray-900 lg:mt-0
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
          className={`py-8 flex ${
            !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
          }`}
        >
          <Link
            to="/TailAdmin/"
            onClick={handleNavigation}
            className="flex items-center gap-3"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L4 5V11C4 16.25 7.4 21.05 12 22C16.6 21.05 20 16.25 20 11V5L12 2Z"
                  fill="currentColor"
                />
              </svg>
            </div>

            {(isExpanded || isHovered || isMobileOpen) && (
              <div className="flex flex-col leading-tight">
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  HR Compliance
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Enterprise Portal
                </span>
              </div>
            )}
          </Link>
        </div>

        <nav className="mb-6">
          <h2
            className={`mb-5 text-xs font-semibold uppercase tracking-wide text-gray-400 flex ${
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
                    className={`menu-item group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all
                      ${
                        isActive("/principle-employee")
                          ? "bg-brand-50 text-brand-600 dark:bg-white/[0.08]"
                          : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/[0.05]"
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
                    className={`menu-item group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all
                      ${
                        isActive("/vendor")
                          ? "bg-brand-50 text-brand-600 dark:bg-white/[0.08]"
                          : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/[0.05]"
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
                    className={`menu-item group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all
                      ${
                        isActive("/auditor")
                          ? "bg-brand-50 text-brand-600 dark:bg-white/[0.08]"
                          : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/[0.05]"
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
                    className={`menu-item group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all
                      ${
                        isActive("/audit-checklist")
                          ? "bg-brand-50 text-brand-600 dark:bg-white/[0.08]"
                          : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/[0.05]"
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
                    className={`menu-item group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all
                      ${
                        isActive("/documents")
                          ? "bg-brand-50 text-brand-600 dark:bg-white/[0.08]"
                          : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/[0.05]"
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
              <li>
                <Link
                  to="vendor-mapping"
                  onClick={handleNavigation}
                  className={`menu-item group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all
                    ${
                      isActive("/vendor-mapping")
                        ? "bg-brand-50 text-brand-600 dark:bg-white/[0.08]"
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/[0.05]"
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
            )}

            {/* ================= VENDOR MENU ================= */}
            {role === "VENDOR" && (
              <li>
                <Link
                  to="vendor-compliance"
                  onClick={handleNavigation}
                  className={`menu-item group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all
                    ${
                      isActive("/vendor-compliance")
                        ? "bg-brand-50 text-brand-600 dark:bg-white/[0.08]"
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/[0.05]"
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
            )}


            {/* ================= AUDITOR MENU ================= */}
{role === "AUDITOR" && (
  <>
    <li>
      <Link
        to="auditor-dashboard"
        onClick={handleNavigation}
        className={`menu-item group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all
          ${
            isActive("/auditor-dashboard")
              ? "bg-brand-50 text-brand-600 dark:bg-white/[0.08]"
              : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/[0.05]"
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
        className={`menu-item group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all
          ${
            isActive("/audit-history")
              ? "bg-brand-50 text-brand-600 dark:bg-white/[0.08]"
              : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/[0.05]"
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