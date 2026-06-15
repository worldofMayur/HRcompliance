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
        <div className="flex w-full items-center justify-center px-6 py-4 lg:w-1/2 lg:px-12">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>

        {/* RIGHT - CLEAN BRANDING */}
        <div className="relative hidden lg:flex lg:w-1/2 bg-[#071A12]">
          
          {/* very subtle gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.18),transparent_35%)]" />

          {/* content */}
          <div className="relative z-10 flex h-full w-full flex-col justify-center px-12 xl:px-20">
            
            {/* logo */}
              <div className="mb-8 flex items-center gap-4">
            <div className="mb-8 flex items-center gap-5">
              <img
                src="/Kekul.png"
                alt="KEKUL"
                className="h-20 w-auto object-contain"
              />

              <div>
                <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white">
                  Vendor Compliance Audit
                </h1>

                <p className="mt-1 text-xs tracking-[0.2em] text-slate-400 uppercase">
                  Vendor Compliance Management System
                </p>
              </div>
            </div>
            </div>

            {/* heading */}
            <div className="max-w-xl">
              <h2 className="text-4xl xl:text-5xl font-semibold leading-[1.1] tracking-[-0.05em] text-white">
                Modern compliance
                <span className="block text-emerald-400">
                  built for enterprises.
                </span>
              </h2>

              <p className="mt-5 max-w-lg text-base leading-7 text-slate-400">
                Streamline audits, manage vendors, monitor compliance,
                and maintain governance workflows from one secure platform.
              </p>
            </div>

            {/* minimal features */}
            <div className="mt-8 space-y-3">
              
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