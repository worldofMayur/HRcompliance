import { useEffect, useState } from "react";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { useNavigate } from "react-router";

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    const storedEmail = localStorage.getItem("email");
    const storedRole = localStorage.getItem("role");

    if (storedUsername) setUsername(storedUsername);
    if (storedEmail) setEmail(storedEmail);
    if (storedRole) setRole(storedRole);
  }, []);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  function handleLogout() {
    localStorage.clear();
    console.log("🚪 Logged out. Session cleared.");
    navigate("/TailAdmin/signin");
  }

  return (
    <div className="relative">
      {/* 🔹 BUTTON */}
      <button
        onClick={toggleDropdown}
        className="flex items-center gap-3 px-2 py-1 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
      >
        {/* Avatar + Online Dot */}
        <div className="relative">
          <div className="h-11 w-11 rounded-full overflow-hidden border border-gray-200 shadow-sm">
            <img
              src="./images/user/owner.jpg"
              alt="User"
              className="h-full w-full object-cover"
            />
          </div>

          {/* 🟢 ONLINE STATUS */}
          <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></span>
        </div>

        {/* User Info */}
        <div className="hidden sm:flex flex-col items-start">
          <span className="text-sm font-semibold text-gray-800 dark:text-white">
            {username || "SuperAdmin"}
          </span>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {email || "admin@system.com"}
            </span>

            {/* 🏷️ ROLE BADGE */}
            {role && (
            <span
              className={`text-[10px] uppercase tracking-wide ${
                role === "SUPERADMIN"
                  ? "text-purple-500"
                  : role === "AUDITOR"
                  ? "text-blue-500"
                  : "text-gray-400"
              }`}
            >
              {role}
            </span>
            )}
          </div>
        </div>

        {/* Arrow */}
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          viewBox="0 0 20 20"
          fill="none"
        >
          <path
            d="M5 8L10 13L15 8"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      </button>

      {/* 🔹 DROPDOWN */}
      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-6 w-[300px] rounded-2xl border border-gray-200 bg-white dark:bg-gray-900 p-4 shadow-xl"
      >
        {/* HEADER */}
        <div className="flex items-center gap-3 pb-4 border-b">
          <div className="relative">
            <div className="h-12 w-12 rounded-full overflow-hidden border shadow-sm">
              <img
                src="./images/user/owner.jpg"
                alt="User"
                className="h-full w-full object-cover"
              />
            </div>

            {/* 🟢 ONLINE DOT */}
            <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></span>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-white">
              {username || "SuperAdmin"}
            </p>

      <div className="flex items-center gap-2">
        <p className="text-xs text-gray-500">
          {email || "admin@system.com"}
        </p>

        {role && (
          <>
            <span className="text-gray-300">•</span>
            <span className="text-[10px] text-gray-400 uppercase tracking-wide">
              {role}
            </span>
          </>
        )}
      </div>
          </div>
        </div>

        {/* MENU */}
        <ul className="py-3 space-y-1">
          <li>
            <DropdownItem
              tag="a"
              to="/TailAdmin/profile"
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Edit Profile
            </DropdownItem>
          </li>

          <li>
            <DropdownItem
              tag="a"
              to="/TailAdmin/profile"
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Account Settings
            </DropdownItem>
          </li>
        </ul>

        {/* LOGOUT */}
        <div className="pt-3 border-t">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition"
          >
            Sign Out
          </button>
        </div>
      </Dropdown>
    </div>
  );
}