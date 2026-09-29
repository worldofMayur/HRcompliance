import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="flex min-h-screen">

        {/* ========================= */}
        {/* LEFT SIDE */}
        {/* ========================= */}
        <div className="flex w-full items-center justify-center px-5 py-8 sm:px-8 md:px-10 lg:w-1/2 lg:px-12 xl:px-16">

          <div className="w-full max-w-md">

            {/* Mobile / Tablet Branding */}
            <div className="mb-10 flex flex-col items-center text-center lg:hidden">

              <img
                src="/Kekul.png"
                alt="KEKUL"
                className="h-32 w-auto object-contain sm:h-36"
              />

              <h1 className="mt-6 text-2xl font-semibold tracking-tight text-slate-900">
                Vendor Compliance Audit
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Vendor Compliance Management System
              </p>
            </div>

            {children}

          </div>

        </div>

        {/* ========================= */}
        {/* RIGHT SIDE */}
        {/* ========================= */}
        <div className="relative hidden lg:flex lg:w-1/2 overflow-hidden bg-[#1e293b]">

          {/* Soft blue glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.15),transparent_35%)]" />

          <div className="relative z-10 flex w-full items-center">

            <div className="mx-auto w-full max-w-2xl px-12 xl:px-16 2xl:px-20">

              {/* Logo + Branding – improved hierarchy */}
              <div className="mb-14 flex items-center gap-7">

                <img
                  src="/Kekul.png"
                  alt="KEKUL"
                  className="h-32 xl:h-36 w-auto object-contain shrink-0"
                />

                <div className="min-w-0">
                  <h1 className="text-3xl xl:text-4xl font-semibold tracking-tight text-white leading-tight">
                    Vendor Compliance Audit
                  </h1>

                  <p className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-400">
                    Vendor Compliance Management System
                  </p>
                </div>
              </div>

              {/* Heading */}
              <h2 className="text-4xl xl:text-5xl font-semibold leading-tight tracking-tight text-white">
                Modern compliance
                <span className="mt-2 block text-blue-400">
                  built for enterprises.
                </span>
              </h2>

              <p className="mt-6 max-w-xl text-base leading-8 text-slate-400">
                Streamline audits, manage vendors, monitor compliance,
                and maintain governance workflows from one secure platform.
              </p>

              {/* Features */}
              <div className="mt-10 space-y-4">
                <div className="flex items-center gap-3 text-slate-300">
                  <div className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="text-sm">
                    Centralized compliance tracking
                  </span>
                </div>

                <div className="flex items-center gap-3 text-slate-300">
                  <div className="h-2 w-2 rounded-full bg-blue-400" />
                  <span className="text-sm">
                    Audit workflow automation
                  </span>
                </div>

                <div className="flex items-center gap-3 text-slate-300">
                  <div className="h-2 w-2 rounded-full bg-violet-400" />
                  <span className="text-sm">
                    Enterprise-grade security
                  </span>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}