import { useEffect, useState } from "react";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../../utils/auth";
import api from "../../utils/api";

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");

  const navigate = useNavigate();

  // Load user info
  useEffect(() => {
    const loadUserData = () => {
      setUsername(localStorage.getItem("username") || "");
      setEmail(localStorage.getItem("email") || "");
      setRole(localStorage.getItem("role") || "");
    };

    loadUserData();

    window.addEventListener("storage", loadUserData);

    return () => {
      window.removeEventListener("storage", loadUserData);
    };
  }, []);

  // Toggle dropdown
  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
  };

  // Close dropdown
  const closeDropdown = () => {
    setIsOpen(false);
  };

const handleLogout = async () => {
  try {
    const refresh = localStorage.getItem("refresh_token");
    if (refresh) {
      await api.post("/api/auth/logout/", { refresh });
    }
  } catch (err) {
    console.error("Backend logout failed (non-critical)", err);
  } finally {
    logoutUser(); // clears localStorage
    navigate("/signin", { replace: true });
  }
};

  // Safe display values
  const displayName =
    username ||
    (email ? email.split("@")[0] : "") ||
    "User";

  const displayEmail = email || "No Email";

  // Role color
  const getRoleColor = () => {
    switch (role) {
      case "SUPERADMIN":
        return "text-purple-500";

      case "AUDITOR":
        return "text-blue-500";

      case "PE":
        return "text-green-500";

      case "VENDOR":
        return "text-orange-500";

      default:
        return "text-gray-400";
    }
  };

  // Image fallback
  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    e.currentTarget.src =
      "https://ui-avatars.com/api/?name=User";
  };

  return (
    <div className="relative">
      {/* USER BUTTON */}
      <button
        onClick={toggleDropdown}
        className="flex items-center gap-3 px-3.5 py-2 rounded-2xl border border-gray-200/60 bg-white/70 backdrop-blur-xl hover:bg-white hover:shadow-sm dark:bg-gray-900/70 dark:border-gray-800 transition-all duration-200"        aria-label="User menu"
      >
        {/* AVATAR */}
        <div className="relative">
          <div className="h-10 w-10 rounded-full overflow-hidden ring-2 ring-white dark:ring-gray-800 shadow-sm">
            <img
              src={`${import.meta.env.BASE_URL}images/user/owner.jpg`}
              alt="User"
              onError={handleImageError}
              className="h-full w-full object-cover"
            />
          </div>

          {/* ONLINE DOT */}
          <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></span>
        </div>

        {/* USER INFO */}
        <div className="hidden sm:flex flex-col items-start">
          <span className="text-sm font-semibold text-gray-900 dark:text-white leading-none">
            {displayName}
          </span>

          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-gray-400">
              {displayEmail}
            </span>

            {role && (
              <span
                className={`text-[10px] font-medium uppercase tracking-wide ${getRoleColor()}`}
              >
                {role}
              </span>
            )}
          </div>
        </div>

        {/* ARROW */}
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

      {/* DROPDOWN */}
      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-4 w-[290px] rounded-3xl border border-gray-200/70 bg-white/90 backdrop-blur-2xl dark:bg-gray-900/90 dark:border-gray-800 p-4 shadow-[0_10px_40px_rgba(0,0,0,0.08)]"
      >
        {/* HEADER */}
        <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <div className="h-12 w-12 rounded-full overflow-hidden border shadow-sm">
              <img
                src={`${import.meta.env.BASE_URL}images/user/owner.jpg`}
                alt="User"
                onError={handleImageError}
                className="h-full w-full object-cover"
              />
            </div>

            <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></span>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-white">
              {displayName}
            </p>

            <div className="flex items-center gap-2">
              <p className="text-[11px] text-gray-400">
                {displayEmail}
              </p>

              {role && (
                <>
                  <span className="text-gray-300">•</span>

                  <span
                    className={`text-[10px] uppercase tracking-wide ${getRoleColor()}`}
                  >
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
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition"
          >
            Sign Out
          </button>
        </div>
      </Dropdown>
    </div>
  );
}