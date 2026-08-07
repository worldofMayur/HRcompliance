import { useSidebar } from "../context/SidebarContext";

const Backdrop: React.FC = () => {
  const { isMobileOpen, toggleMobileSidebar } = useSidebar();

  return (
    <div
      onClick={toggleMobileSidebar}
      className={`
        fixed inset-0 z-40
        bg-black/40
        backdrop-blur-[2px]
        transition-opacity duration-300
        lg:hidden
        ${
          isMobileOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }
      `}
    />
  );
};

export default Backdrop;