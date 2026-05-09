import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="flex min-h-screen">
        
        {/* LEFT - FORM */}
        <div className="flex w-full items-center justify-center px-6 py-10 lg:w-1/2 lg:px-16">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>

        {/* RIGHT - CLEAN BRANDING */}
        <div className="relative hidden lg:flex lg:w-1/2 bg-[#0B1120]">
          
          {/* very subtle gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_30%)]" />

          {/* content */}
          <div className="relative z-10 flex h-full w-full flex-col justify-center px-20">
            
            {/* logo */}
            <div className="mb-14 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M12 2L4 5V11C4 16.25 7.4 21.05 12 22C16.6 21.05 20 16.25 20 11V5L12 2Z"
                    fill="white"
                  />
                </svg>
              </div>

              <div>
                <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white">
                  HR Compliance
                </h1>

                <p className="mt-1 text-xs tracking-[0.2em] text-slate-400 uppercase">
                  Enterprise Governance Platform
                </p>
              </div>
            </div>

            {/* heading */}
            <div className="max-w-xl">
              <h2 className="text-5xl font-semibold leading-[1.1] tracking-[-0.05em] text-white">
                Modern compliance
                <span className="block text-blue-400">
                  built for enterprises.
                </span>
              </h2>

              <p className="mt-8 max-w-lg text-lg leading-8 text-slate-400">
                Streamline audits, manage vendors, monitor compliance,
                and maintain governance workflows from one secure platform.
              </p>
            </div>

            {/* minimal features */}
            <div className="mt-14 space-y-5">
              
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
  );
}