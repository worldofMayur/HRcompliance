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

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
  };

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
      logoutUser();
      navigate("/signin", { replace: true });
    }
  };

  const displayName =
    username || (email ? email.split("@")[0] : "") || "User";

  const displayEmail = email || "No Email";

  const getRoleColor = () => {
    switch (role) {
      case "SUPERADMIN":
        return "text-purple-600 bg-purple-50 dark:bg-purple-500/10 dark:text-purple-400";
      case "AUDITOR":
        return "text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400";
      case "PE":
        return "text-green-600 bg-green-50 dark:bg-green-500/10 dark:text-green-400";
      case "VENDOR":
        return "text-orange-600 bg-orange-50 dark:bg-orange-500/10 dark:text-orange-400";
      default:
        return "text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    e.currentTarget.src = "https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff";
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={toggleDropdown}
        aria-label="User menu"
        className="
          flex items-center gap-2.5
          pl-2 pr-2.5 py-1.5
          rounded-2xl
          border border-gray-200/70
          bg-white/80
          backdrop-blur-xl
          hover:bg-white
          hover:shadow-sm
          dark:bg-gray-900/70
          dark:border-gray-800
          transition-all duration-200
        "
      >
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="h-9 w-9 rounded-full overflow-hidden ring-2 ring-white dark:ring-gray-800 shadow-sm">
            <img
              src={`${import.meta.env.BASE_URL}images/user/owner.jpg`}
              alt="User"
              onError={handleImageError}
              className="h-full w-full object-cover"
            />
          </div>
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></span>
        </div>

        {/* Name + Role (hidden on very small screens) */}
        <div className="hidden sm:flex flex-col items-start text-left">
          <span className="text-sm font-semibold text-gray-900 dark:text-white leading-none">
            {displayName}
          </span>
          {role && (
            <span className="text-[11px] font-medium text-gray-400 mt-0.5 uppercase tracking-wide">
              {role}
            </span>
          )}
        </div>

        {/* Chevron */}
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          viewBox="0 0 20 20"
          fill="none"
        >
          <path
            d="M5 8L10 13L15 8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Dropdown */}
      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="
          absolute right-0 mt-3
          w-[280px]
          rounded-2xl
          border border-gray-200/70
          bg-white/95
          backdrop-blur-2xl
          dark:bg-gray-900/95
          dark:border-gray-800
          p-3
          shadow-[0_10px_40px_rgba(0,0,0,0.08)]
        "
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-2 py-3 mb-1">
          <div className="relative shrink-0">
            <div className="h-11 w-11 rounded-full overflow-hidden ring-2 ring-gray-100 dark:ring-gray-800">
              <img
                src={`${import.meta.env.BASE_URL}images/user/owner.jpg`}
                alt="User"
                onError={handleImageError}
                className="h-full w-full object-cover"
              />
            </div>
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></span>
          </div>

          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {displayName}
            </p>
            <p className="text-xs text-gray-400 truncate mt-0.5">
              {displayEmail}
            </p>
            {role && (
              <span
                className={`inline-flex mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide ${getRoleColor()}`}
              >
                {role}
              </span>
            )}
          </div>
        </div>

        <div className="h-px bg-gray-100 dark:bg-gray-800 my-1" />

        {/* Menu Items */}
        <ul className="py-1 space-y-0.5">
          <li>
            <DropdownItem
              tag="a"
              to="/TailAdmin/profile"
              className="
                flex items-center gap-2.5
                px-3 py-2.5
                rounded-xl
                text-sm text-gray-700
                hover:bg-gray-50
                dark:text-gray-300
                dark:hover:bg-white/[0.05]
              "
            >
              Edit Profile
            </DropdownItem>
          </li>

          <li>
            <DropdownItem
              tag="a"
              to="/TailAdmin/profile"
              className="
                flex items-center gap-2.5
                px-3 py-2.5
                rounded-xl
                text-sm text-gray-700
                hover:bg-gray-50
                dark:text-gray-300
                dark:hover:bg-white/[0.05]
              "
            >
              Account Settings
            </DropdownItem>
          </li>
        </ul>

        <div className="h-px bg-gray-100 dark:bg-gray-800 my-1" />

        {/* Sign Out */}
        <button
          onClick={handleLogout}
          className="
            w-full flex items-center justify-center
            px-3 py-2.5
            text-sm font-medium text-red-600
            rounded-xl
            hover:bg-red-50
            dark:hover:bg-red-900/20
            transition-colors
          "
        >
          Sign Out
        </button>
      </Dropdown>
    </div>
  );
}