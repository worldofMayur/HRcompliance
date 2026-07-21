import { Link } from "react-router-dom";

import { ThemeToggleButton } from "../common/ThemeToggleButton";
import UserDropdown from "./UserDropdown";

// Props Interface
interface HeaderProps {
  onClick?: () => void;
  onToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({
  onClick,
  onToggle,
}) => {
  return (
    <header
      className="
        sticky top-0 z-99999 flex w-full
        border-b border-gray-200/50
        bg-white/75
        shadow-[0_1px_2px_rgba(15,23,42,0.03)]
        backdrop-blur-2xl
        dark:border-white/[0.04]
        dark:bg-gray-900/75
      "
    >
      <div
        className="
          flex items-center justify-between
          w-full
          px-3 py-2.5
          lg:px-5
          xl:px-6
        "
      >
        {/* LEFT SECTION */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* MOBILE SIDEBAR TOGGLE */}
          <button
            type="button"
            onClick={onToggle}
            aria-label="Toggle Sidebar"
            className="
              flex lg:hidden
              items-center justify-center
              h-10 w-10
              rounded-2xl
              text-gray-600
              transition-all duration-200
              hover:bg-blue-50
              hover:text-blue-600
              dark:text-gray-400
              dark:hover:bg-white/[0.05]
            "
          >
            <svg
              width="16"
              height="12"
              viewBox="0 0 16 12"
              fill="none"
              xmlns="https://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z"
                fill="currentColor"
              />
            </svg>
          </button>

          {/* DESKTOP SIDEBAR TOGGLE */}
          <button
            type="button"
            onClick={onClick}
            aria-label="Collapse Sidebar"
            className="
              hidden lg:flex
              items-center justify-center
              h-10 w-10
              rounded-2xl
              border border-gray-200/70
              bg-white/70
              text-gray-500
              shadow-sm
              transition-all duration-200
              hover:-translate-y-[1px]
              hover:border-blue-200
              hover:bg-blue-50/60
              hover:text-blue-600
              dark:border-white/[0.05]
              dark:bg-white/[0.03]
              dark:text-gray-400
              dark:hover:bg-white/[0.05]
            "
          >
            <svg
              className="fill-current"
              width="16"
              height="12"
              viewBox="0 0 16 12"
              fill="none"
              xmlns="https://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z"
                fill="currentColor"
              />
            </svg>
          </button>

          {/* MOBILE LOGO */}
          <Link to="/" className="lg:hidden">
            <img
              className="dark:hidden"
              src={`${import.meta.env.BASE_URL}images/logo/logo.svg`}
              alt="Logo"
            />
            <img
              className="hidden dark:block"
              src={`${import.meta.env.BASE_URL}images/logo/logo-dark.svg`}
              alt="Logo"
            />
          </Link>
        </div>

        {/* RIGHT SECTION */}
        <div className="flex items-center gap-2 2xsm:gap-3">
          <ThemeToggleButton />
          <UserDropdown />
        </div>
      </div>
    </header>
  );
};

export default Header;