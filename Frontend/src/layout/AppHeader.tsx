import { Link } from "react-router";

import { useSidebar } from "../context/SidebarContext";
import UserDropdown from "../components/header/UserDropdown";

const AppHeader: React.FC = () => {
  const {
    toggleSidebar,
    toggleMobileSidebar,
  } = useSidebar();

  // SIDEBAR TOGGLE
  const handleToggle = () => {
    if (window.innerWidth >= 991) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

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
          items-center
          justify-between
          px-3
          py-2.5
          lg:px-6
        "
      >
        {/* LEFT SECTION */}
        <div className="flex items-center gap-3">
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
                h-9
                w-9
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
                width="15"
                height="15"
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
              h-10
              w-10
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
              width="20"
              height="20"
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
        </div>

        {/* RIGHT SECTION */}
        <div className="flex items-center">
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
    </header>
  );
};

export default AppHeader;