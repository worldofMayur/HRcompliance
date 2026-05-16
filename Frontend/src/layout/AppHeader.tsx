import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";

import { useSidebar } from "../context/SidebarContext";

import NotificationDropdown from "../components/header/NotificationDropdown";
import UserDropdown from "../components/header/UserDropdown";

const AppHeader: React.FC = () => {
  const [isApplicationMenuOpen, setApplicationMenuOpen] =
    useState(false);

  const {
    isMobileOpen,
    toggleSidebar,
    toggleMobileSidebar,
  } = useSidebar();

  const inputRef = useRef<HTMLInputElement>(null);

  // SIDEBAR TOGGLE
  const handleToggle = () => {
    if (window.innerWidth >= 991) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  // MOBILE ACTION MENU
  const toggleApplicationMenu = () => {
    setApplicationMenuOpen(!isApplicationMenuOpen);
  };

  // CMD + K SEARCH FOCUS
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header
      className="
        sticky
        top-0
        z-40
        flex
        w-full
        border-b
        border-gray-200/70
        bg-white/75
        backdrop-blur-2xl
        transition-all
        duration-300
        dark:border-gray-800/80
        dark:bg-gray-900/75
      "
    >
      {/* BACKGROUND GLOW */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="
            absolute
            right-[-80px]
            top-[-80px]
            h-[180px]
            w-[180px]
            rounded-full
            bg-blue-500/10
            blur-3xl
          "
        />

        <div
          className="
            absolute
            left-[20%]
            top-[-100px]
            h-[180px]
            w-[180px]
            rounded-full
            bg-indigo-500/10
            blur-3xl
          "
        />
      </div>

      {/* INNER WRAPPER */}
      <div
        className="
          relative
          flex
          flex-grow
          flex-col
          items-center
          justify-between
          lg:flex-row
          lg:px-6
        "
      >
        {/* LEFT SECTION */}
        <div
          className="
            flex
            w-full
            items-center
            justify-between
            gap-3
            px-3
            py-3
            sm:gap-4
            lg:justify-normal
            lg:px-0
            lg:py-4
          "
        >
          {/* MOBILE LOGO */}
          <Link
            to="/"
            className="
              flex
              items-center
              gap-2
              transition-transform
              duration-300
              hover:scale-[1.02]
              lg:hidden
            "
          >
            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-2xl
                bg-gradient-to-br
                from-brand-500
                to-blue-600
                text-white
                shadow-lg
              "
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M12 2L4 5V11C4 16.25 7.4 21.05 12 22C16.6 21.05 20 16.25 20 11V5L12 2Z"
                  fill="currentColor"
                />
              </svg>
            </div>

            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-gray-800 dark:text-white">
                HR Compliance
              </span>

              <span className="text-[11px] text-gray-400">
                Portal
              </span>
            </div>
          </Link>

          {/* DESKTOP SIDEBAR TOGGLE */}
          <button
            onClick={handleToggle}
            className="
              hidden
              lg:flex
              h-11
              w-11
              items-center
              justify-center
              rounded-2xl
              border
              border-gray-200
              bg-white/70
              text-gray-600
              shadow-sm
              backdrop-blur-xl
              transition-all
              duration-300
              hover:-translate-y-[1px]
              hover:border-brand-200
              hover:bg-brand-50
              hover:text-brand-600
              hover:shadow-md
              dark:border-gray-800
              dark:bg-white/[0.03]
              dark:text-gray-300
              dark:hover:border-white/[0.06]
              dark:hover:bg-white/[0.05]
            "
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M4 6H20"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M4 12H20"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M4 18H14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>

          {/* MOBILE MENU BUTTON */}
          <button
            onClick={toggleApplicationMenu}
            className="
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-2xl
              border
              border-gray-200
              bg-white/70
              text-gray-700
              shadow-sm
              transition-all
              duration-300
              hover:bg-gray-50
              hover:shadow-md
              dark:border-gray-800
              dark:bg-white/[0.03]
              dark:text-gray-300
              dark:hover:bg-white/[0.05]
              lg:hidden
            "
          >
            <svg
              width="22"
              height="22"
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
            <form>
              <div
                className="
                  group
                  relative
                  transition-all
                  duration-300
                "
              >
                {/* SEARCH ICON */}
                <span
                  className="
                    pointer-events-none
                    absolute
                    left-4
                    top-1/2
                    -translate-y-1/2
                  "
                >
                  <svg
                    className="
                      fill-gray-400
                      transition-colors
                      duration-300
                      group-focus-within:fill-brand-500
                      dark:fill-gray-500
                    "
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z"
                      fill=""
                    />
                  </svg>
                </span>

                {/* INPUT */}
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search vendors, branches, audit periods..."
                  className="
                    h-12
                    rounded-2xl
                    border
                    border-gray-200
                    bg-white/70
                    py-2.5
                    pl-12
                    pr-24
                    text-sm
                    text-gray-800
                    shadow-sm
                    backdrop-blur-xl
                    placeholder:text-gray-400
                    transition-all
                    duration-300

                    focus:w-[460px]
                    focus:border-brand-300
                    focus:bg-white
                    focus:outline-none
                    focus:ring-4
                    focus:ring-brand-500/10
                    focus:shadow-lg

                    dark:border-gray-800
                    dark:bg-white/[0.03]
                    dark:text-white/90
                    dark:placeholder:text-white/30

                    xl:w-[390px]
                  "
                />
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div
          className={`
            ${
              isApplicationMenuOpen
                ? "flex"
                : "hidden"
            }

            w-full
            items-center
            justify-between
            gap-4
            px-5
            py-4

            lg:flex
            lg:w-auto
            lg:justify-end
            lg:px-0
            lg:py-0
          `}
        >
          {/* RIGHT ACTIONS */}
          <div className="flex items-center gap-3">
            {/* NOTIFICATIONS */}
            <div
              className="
                transition-all
                duration-300
                hover:-translate-y-[1px]
              "
            >
              <NotificationDropdown />
            </div>

            {/* USER */}
            <div
              className="
                rounded-2xl
                transition-all
                duration-300
                hover:-translate-y-[1px]
                hover:bg-gray-50
                hover:shadow-sm
                dark:hover:bg-white/[0.03]
              "
            >
              <UserDropdown />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;