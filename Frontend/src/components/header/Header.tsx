import { useState } from "react";
import { Link } from "react-router-dom";

import { ThemeToggleButton } from "../common/ThemeToggleButton";
import NotificationDropdown from "./NotificationDropdown";
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
  const [isApplicationMenuOpen, setApplicationMenuOpen] =
    useState(false);

  // Toggle mobile menu
  const toggleApplicationMenu = () => {
    setApplicationMenuOpen((prev) => !prev);
  };

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
          flex flex-col items-center justify-between
          flex-grow
          lg:flex-row
          lg:px-5
          xl:px-6
        "
      >
        {/* LEFT SECTION */}
        <div
          className="
            flex items-center justify-between
            w-full gap-2
            px-3 py-3
            border-b border-gray-200/60
            dark:border-white/[0.04]
            sm:gap-4
            lg:border-b-0
            lg:px-0
            lg:py-4
          "
        >
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
              h-11 w-11
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

          {/* MOBILE MENU TOGGLE */}
          <button
            type="button"
            onClick={toggleApplicationMenu}
            aria-label="Toggle Menu"
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
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5.99902 10.4951C6.82745 10.4951 7.49902 11.1667 7.49902 11.9951V12.0051C7.49902 12.8335 6.82745 13.5051 5.99902 13.5051C5.1706 13.5051 4.49902 12.8335 4.49902 12.0051V11.9951C4.49902 11.1667 5.1706 10.4951 5.99902 10.4951ZM17.999 10.4951C18.8275 10.4951 19.499 11.1667 19.499 11.9951V12.0051C19.499 12.8335 18.8275 13.5051 17.999 13.5051C17.1706 13.5051 16.499 12.8335 16.499 12.0051V11.9951C16.499 11.1667 17.1706 10.4951 17.999 10.4951ZM13.499 11.9951C13.499 11.1667 12.8275 10.4951 11.999 10.4951C11.1706 10.4951 10.499 11.1667 10.499 11.9951V12.0051C10.499 12.8335 11.1706 13.5051 11.999 13.5051C12.8275 13.5051 13.499 12.8335 13.499 12.0051V11.9951Z"
                fill="currentColor"
              />
            </svg>
          </button>

          {/* SEARCH */}
          <div className="hidden lg:block">
            <div className="relative">
              <button
                type="button"
                className="absolute left-4 top-1/2 -translate-y-1/2"
              >
                <svg
                  className="fill-gray-400 dark:fill-gray-500"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z"
                    fill="currentColor"
                  />
                </svg>
              </button>

              <input
                type="text"
                placeholder="Search vendors, branches, audit period..."
                className="
                  h-11
                  xl:w-[340px]
                  rounded-2xl
                  border border-gray-200/70
                  bg-white/80
                  py-2.5
                  pl-12
                  pr-14
                  text-sm
                  text-gray-700
                  shadow-sm
                  transition-all
                  duration-200
                  placeholder:text-gray-400
                  focus:border-blue-300
                  focus:bg-white
                  focus:outline-none
                  focus:ring-4
                  focus:ring-blue-500/10
                  focus:shadow-[0_4px_18px_rgba(59,130,246,0.08)]
                  dark:border-white/[0.05]
                  dark:bg-white/[0.03]
                  dark:text-white
                  dark:placeholder:text-gray-500
                  dark:focus:border-blue-500/30
                "
              />

              <button
                type="button"
                className="
                  absolute right-2.5 top-1/2
                  inline-flex items-center gap-0.5
                  -translate-y-1/2
                  rounded-xl
                  border border-gray-200/70
                  bg-white/80
                  px-[7px]
                  py-[4.5px]
                  text-xs text-gray-500
                  backdrop-blur-sm
                  dark:border-white/[0.05]
                  dark:bg-white/[0.03]
                  dark:text-gray-400
                "
              >
                <span>⌘</span>
                <span>K</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div
          className={`${
            isApplicationMenuOpen ? "flex" : "hidden"
          } items-center justify-between w-full gap-4 px-5 py-4 lg:flex lg:justify-end lg:px-0 lg:py-0`}
        >
          <div className="flex items-center gap-2 2xsm:gap-3">
            <ThemeToggleButton />
            <NotificationDropdown />
          </div>

          <UserDropdown />
        </div>
      </div>
    </header>
  );
};

export default Header;