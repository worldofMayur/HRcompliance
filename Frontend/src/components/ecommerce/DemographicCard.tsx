import { useState } from "react";

import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";

import { MoreDotIcon } from "../../icons";

import CountryMap from "./CountryMap";

export default function DemographicCard() {

  const [isOpen, setIsOpen] = useState(false);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  return (

    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">

      {/* ===================================== */}
      {/* HEADER */}
      {/* ===================================== */}

      <div className="flex items-start justify-between">

        <div>

          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Compliance Coverage Overview
          </h3>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Audit distribution and compliance performance across states
          </p>

        </div>

        {/* DROPDOWN */}

        <div className="relative inline-block">

          <button
            className="dropdown-toggle"
            onClick={toggleDropdown}
          >

            <MoreDotIcon className="size-6 text-gray-400 transition hover:text-gray-700 dark:hover:text-gray-300" />

          </button>

          <Dropdown
            isOpen={isOpen}
            onClose={closeDropdown}
            className="w-44 p-2"
          >

            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
            >
              View State Analytics
            </DropdownItem>

            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
            >
              Export Coverage Report
            </DropdownItem>

          </Dropdown>

        </div>

      </div>

      {/* ===================================== */}
      {/* MAP SECTION */}
      {/* ===================================== */}

      <div className="my-6 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 px-4 py-6 dark:border-gray-800 dark:bg-gray-900/40 sm:px-6">

        <div
          id="mapOne"
          className="mapOne map-btn -mx-4 -my-6 h-[220px] w-[252px] 2xsm:w-[307px] xsm:w-[358px] sm:-mx-6 md:w-[668px] lg:w-[634px] xl:w-[393px] 2xl:w-[554px]"
        >

          <CountryMap />

        </div>

      </div>

      {/* ===================================== */}
      {/* TOP STATES */}
      {/* ===================================== */}

      <div className="space-y-5">

        {/* MAHARASHTRA */}

        <div className="rounded-xl border border-gray-100 p-4 transition hover:border-green-200 hover:bg-green-50/40 dark:border-gray-800 dark:hover:border-green-500/20 dark:hover:bg-green-500/5">

          <div className="flex items-center justify-between">

            {/* LEFT */}

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700 dark:bg-green-500/15 dark:text-green-400">

                MH

              </div>

              <div>

                <p className="font-semibold text-gray-800 dark:text-white/90">
                  Maharashtra
                </p>

                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  128 Audits Completed
                </span>

              </div>

            </div>

            {/* RIGHT */}

            <div className="flex w-full max-w-[150px] items-center gap-3">

              <div className="relative block h-2 w-full rounded-full bg-gray-200 dark:bg-gray-800">

                <div className="absolute left-0 top-0 h-full w-[92%] rounded-full bg-green-500"></div>

              </div>

              <p className="min-w-[38px] text-sm font-semibold text-green-600 dark:text-green-400">
                92%
              </p>

            </div>

          </div>

        </div>

        {/* KARNATAKA */}

        <div className="rounded-xl border border-gray-100 p-4 transition hover:border-blue-200 hover:bg-blue-50/40 dark:border-gray-800 dark:hover:border-blue-500/20 dark:hover:bg-blue-500/5">

          <div className="flex items-center justify-between">

            {/* LEFT */}

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700 dark:bg-blue-500/15 dark:text-blue-400">

                KA

              </div>

              <div>

                <p className="font-semibold text-gray-800 dark:text-white/90">
                  Karnataka
                </p>

                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  96 Audits Completed
                </span>

              </div>

            </div>

            {/* RIGHT */}

            <div className="flex w-full max-w-[150px] items-center gap-3">

              <div className="relative block h-2 w-full rounded-full bg-gray-200 dark:bg-gray-800">

                <div className="absolute left-0 top-0 h-full w-[84%] rounded-full bg-blue-500"></div>

              </div>

              <p className="min-w-[38px] text-sm font-semibold text-blue-600 dark:text-blue-400">
                84%
              </p>

            </div>

          </div>

        </div>

        {/* DELHI NCR */}

        <div className="rounded-xl border border-gray-100 p-4 transition hover:border-yellow-200 hover:bg-yellow-50/40 dark:border-gray-800 dark:hover:border-yellow-500/20 dark:hover:bg-yellow-500/5">

          <div className="flex items-center justify-between">

            {/* LEFT */}

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 text-sm font-bold text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400">

                DL

              </div>

              <div>

                <p className="font-semibold text-gray-800 dark:text-white/90">
                  Delhi NCR
                </p>

                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  74 Audits Completed
                </span>

              </div>

            </div>

            {/* RIGHT */}

            <div className="flex w-full max-w-[150px] items-center gap-3">

              <div className="relative block h-2 w-full rounded-full bg-gray-200 dark:bg-gray-800">

                <div className="absolute left-0 top-0 h-full w-[71%] rounded-full bg-yellow-500"></div>

              </div>

              <p className="min-w-[38px] text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                71%
              </p>

            </div>

          </div>

        </div>

      </div>

      {/* ===================================== */}
      {/* FOOTER SUMMARY */}
      {/* ===================================== */}

      <div className="mt-6 grid grid-cols-2 gap-4 border-t border-gray-200 pt-5 dark:border-gray-800">

        {/* CARD */}

        <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-900/40">

          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Total Branches
          </p>

          <h4 className="mt-2 text-2xl font-bold text-gray-800 dark:text-white/90">
            42
          </h4>

        </div>

        {/* CARD */}

        <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-900/40">

          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            States Covered
          </p>

          <h4 className="mt-2 text-2xl font-bold text-gray-800 dark:text-white/90">
            12
          </h4>

        </div>

      </div>

    </div>
  );
}