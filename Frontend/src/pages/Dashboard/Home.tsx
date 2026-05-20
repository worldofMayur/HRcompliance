import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";
import MonthlySalesChart from "../../components/ecommerce/MonthlySalesChart";
import StatisticsChart from "../../components/ecommerce/StatisticsChart";
import MonthlyTarget from "../../components/ecommerce/MonthlyTarget";
import RecentOrders from "../../components/ecommerce/RecentOrders";
import DemographicCard from "../../components/ecommerce/DemographicCard";
import PageMeta from "../../components/common/PageMeta";

export default function Home() {

  return (

    <>
      <PageMeta
        title="HR Compliance Dashboard"
        description="Enterprise HR Compliance Dashboard"
      />

      {/* ===================================== */}
      {/* MAIN DASHBOARD WRAPPER */}
      {/* ===================================== */}

      <div className="space-y-6">

        {/* ===================================== */}
        {/* TOP SECTION */}
        {/* ===================================== */}

        <div className="grid grid-cols-12 gap-6">

          {/* ===================================== */}
          {/* LEFT SIDE */}
          {/* ===================================== */}

          <div className="col-span-12 space-y-6 2xl:col-span-9">

            {/* ===================================== */}
            {/* METRICS */}
            {/* ===================================== */}


              <EcommerceMetrics />


            {/* ===================================== */}
            {/* MONTHLY AUDITS */}
            {/* ===================================== */}


              <MonthlySalesChart />


          </div>

          {/* ===================================== */}
          {/* RIGHT SIDE */}
          {/* ===================================== */}

          <div className="col-span-12 2xl:col-span-3">


              <MonthlyTarget />


          </div>

        </div>

        {/* ===================================== */}
        {/* ANALYTICS */}
        {/* ===================================== */}

        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition-all dark:border-gray-800 dark:bg-white/[0.03]">

          <StatisticsChart />

        </div>

        {/* ===================================== */}
        {/* BOTTOM SECTION */}
        {/* ===================================== */}

        <div className="grid grid-cols-12 gap-6">

          {/* ===================================== */}
          {/* COMPLIANCE COVERAGE */}
          {/* ===================================== */}

          <div className="col-span-12 xl:col-span-5">


              <DemographicCard />


          </div>

          {/* ===================================== */}
          {/* RECENT AUDITS */}
          {/* ===================================== */}

          <div className="col-span-12 xl:col-span-7">


              <RecentOrders />


          </div>

        </div>

      </div>
    </>
  );
}