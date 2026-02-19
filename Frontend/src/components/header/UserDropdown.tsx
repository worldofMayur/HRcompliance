import { useEffect, useState } from "react";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { Link, useNavigate } from "react-router";

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    // read user info from localStorage
    const storedUsername = localStorage.getItem("username");
    const storedEmail = localStorage.getItem("email");

    if (storedUsername) setUsername(storedUsername);
    if (storedEmail) setEmail(storedEmail);
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
      <button
        onClick={toggleDropdown}
        className="flex items-center text-gray-700 dropdown-toggle dark:text-gray-400"
      >
        <span className="mr-3 overflow-hidden rounded-full h-11 w-11">
          <img src="./images/user/owner.jpg" alt="User" />
        </span>

        {/* ✅ Username */}
        <span className="block mr-1 font-medium text-theme-sm">
          {username || "SuperAdmin"}
        </span>

        <svg
          className={`stroke-gray-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          width="18"
          height="20"
          viewBox="0 0 18 20"
          fill="none"
        >
          <path
            d="M4.3125 8.65625L9 13.3437L13.6875 8.65625"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-[17px] w-[260px] rounded-2xl border bg-white p-3 shadow-theme-lg"
      >
        <div>
          {/* ✅ Username */}
          <span className="block font-medium text-theme-sm">
            {username}
          </span>

          {/* ✅ Email */}
          <span className="mt-0.5 block text-theme-xs text-gray-500">
            {email}
          </span>
        </div>

        <ul className="pt-4 pb-3 border-b">
          <li>
            <DropdownItem tag="a" to="/TailAdmin/profile">
              Edit profile
            </DropdownItem>
          </li>
          <li>
            <DropdownItem tag="a" to="/TailAdmin/profile">
              Account settings
            </DropdownItem>
          </li>
        </ul>

        {/* ✅ LOGOUT */}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2 mt-3 font-medium text-theme-sm hover:bg-gray-100 rounded-lg"
        >
          Sign out
        </button>
      </Dropdown>
    </div>
  );
}
