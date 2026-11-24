import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import MobileFooter from "./MobileFooter";
import MobileTopBar from "./MobileTopBar";

const Layout = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Top Bar */}
      <MobileTopBar />

      {/* Desktop Sidebar + Main Content */}
      <div className="hidden md:flex">
        <Sidebar />

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Main Content + Bottom Nav */}
      <div className="md:hidden">
        <main className="pb-20">
          <Outlet />
        </main>

        <MobileFooter />
      </div>
    </div>
  );
};

export default Layout;
