const Footer = () => {
  return (
    <footer
      className="
        relative
        mt-4
        overflow-hidden
        border-t border-gray-200/50
        bg-white/80
        backdrop-blur-xl
        dark:border-white/[0.05]
        dark:bg-gray-900/70
      "
    >
      {/* TOP GRADIENT LINE */}
      <div
        className="
          absolute
          inset-x-0
          top-0
          h-px
          bg-gradient-to-r
          from-transparent
          via-blue-400/40
          to-transparent
        "
      />

      <div
        className="
          flex flex-col gap-4
          px-6 py-5
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        {/* LEFT SIDE */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {/* LOGO DOT */}
            <div
              className="
                flex h-8 w-8 items-center justify-center
                rounded-xl
                bg-gradient-to-br
                from-blue-500
                to-indigo-600
                text-white
                shadow-sm
              "
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M12 2L4 5V11C4 16.25 7.4 21.05 12 22C16.6 21.05 20 16.25 20 11V5L12 2Z"
                  fill="currentColor"
                />
              </svg>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
                HR Compliance Portal
              </h3>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Compliance management & audit workflow system
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div
          className="
            flex flex-wrap items-center gap-3
            text-xs
            text-gray-500
            dark:text-gray-400
          "
        >
          {/* STATUS */}
          <div
            className="
              flex items-center gap-2
              rounded-full
              border border-green-100
              bg-green-50
              px-3 py-1.5
              dark:border-green-500/10
              dark:bg-green-500/10
            "
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>

              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
            </span>

            <span className="font-medium text-green-700 dark:text-green-400">
              System Operational
            </span>
          </div>

          {/* VERSION */}
          <div
            className="
              hidden sm:flex
              items-center gap-2
              text-gray-400
            "
          >
            <span>|</span>
            <span>Enterprise Suite</span>
          </div>

          {/* COPYRIGHT */}
          <div
            className="
              hidden sm:flex
              items-center gap-2
              text-gray-400
            "
          >
            <span>|</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;