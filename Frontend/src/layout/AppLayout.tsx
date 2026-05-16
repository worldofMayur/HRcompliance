import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { Outlet } from "react-router";

import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";

import Footer from "../components/footer/Footer";

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  return (
    <div
      className="
        min-h-screen
        xl:flex
        bg-gradient-to-br
        from-gray-50
        via-white
        to-blue-50/30
        dark:from-gray-950
        dark:via-gray-900
        dark:to-gray-950
        text-gray-900
        dark:text-gray-100
        selection:bg-brand-500/20
      "
    >
      {/* SIDEBAR */}
      <div>
        <AppSidebar />
        <Backdrop />
      </div>

      {/* MAIN CONTENT */}
      <div
        className={`
          flex
          min-h-screen
          flex-1
          flex-col
          transition-all
          duration-300
          ease-in-out
          ${
            isExpanded || isHovered
              ? "lg:ml-[290px]"
              : "lg:ml-[90px]"
          }
          ${isMobileOpen ? "ml-0" : ""}
        `}
      >
        {/* HEADER */}
        <AppHeader />

        {/* PAGE CONTENT */}
        <main
          className="
            flex-1
            p-4
            md:p-6
          "
        >
          <div
            className="
              mx-auto
              w-full
              max-w-screen-2xl
              animate-[fadeIn_.25s_ease]
            "
          >
            <Outlet />
          </div>
        </main>

        {/* FOOTER */}
        {/* <Footer /> */}
      </div>
    </div>
  );
};

const AppLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default AppLayout;