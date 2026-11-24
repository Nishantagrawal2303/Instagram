import { useState } from "react";
import {
  FiHome,
  FiMessageCircle,
  FiPlusSquare,
  FiUser,
  FiMenu,
  FiLogIn,
} from "react-icons/fi";
import { NavLink, useNavigate } from "react-router-dom";
import MoreMenu from "./MoreMenu";
import { useAuth } from "../../context/AuthContext";

const Sidebar = () => {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, requireAuth } = useAuth();
  const navigate = useNavigate();

  const handleRestrictedClick = (e: React.MouseEvent, path: string, prompt: string) => {
    e.preventDefault();
    requireAuth(() => {
      navigate(path);
    }, prompt);
  };

  return (
    <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-gray-200 bg-white px-4 py-8 md:flex">
      {/* Brand Wordmark */}
      <NavLink to="/" className="mb-10 px-3">
        <h1 className="text-3xl font-bold tracking-tight italic font-serif">
          Instagram
        </h1>
      </NavLink>

      {/* Navigation */}
      <nav className="flex flex-col gap-1.5">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center gap-4 rounded-xl px-3 py-3 text-base transition ${
              isActive
                ? "bg-gray-100 font-semibold text-black"
                : "text-gray-700 hover:bg-gray-100"
            }`
          }
        >
          <FiHome size={24} />
          <span>Home</span>
        </NavLink>

        <a
          href="/messages"
          onClick={(e) => handleRestrictedClick(e, "/messages", "Log in to view messages")}
          className="flex items-center gap-4 rounded-xl px-3 py-3 text-base text-gray-700 transition hover:bg-gray-100 cursor-pointer"
        >
          <FiMessageCircle size={24} />
          <span>Messages</span>
        </a>

        <a
          href="/create"
          onClick={(e) => handleRestrictedClick(e, "/create", "Log in to create a post")}
          className="flex items-center gap-4 rounded-xl px-3 py-3 text-base text-gray-700 transition hover:bg-gray-100 cursor-pointer"
        >
          <FiPlusSquare size={24} />
          <span>Create</span>
        </a>

        <a
          href="/profile"
          onClick={(e) => handleRestrictedClick(e, "/profile", "Log in to view your profile")}
          className="flex items-center gap-4 rounded-xl px-3 py-3 text-base text-gray-700 transition hover:bg-gray-100 cursor-pointer"
        >
          <FiUser size={24} />
          <span>Profile</span>
        </a>
      </nav>

      {/* Bottom Area: User Menu if Logged In, or Login / Sign Up buttons if Logged Out */}
      <div className="relative mt-auto pt-4">
        {isAuthenticated ? (
          <div>
            <button
              onClick={() => setOpen(!open)}
              className="flex w-full items-center gap-4 rounded-xl px-3 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 transition"
            >
              <FiMenu size={24} />
              <span>More</span>
            </button>

            {open && <MoreMenu onClose={() => setOpen(false)} />}
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 space-y-2.5">
            <p className="text-xs text-gray-500 font-medium">
              Join Instagram to interact, follow creators, and share photos.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#0095F6] py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-blue-600 active:scale-98"
            >
              <FiLogIn size={16} />
              <span>Log In</span>
            </button>
            <button
              onClick={() => navigate("/register")}
              className="w-full rounded-lg border border-gray-300 py-2 text-sm font-semibold text-gray-700 transition hover:bg-white active:scale-98"
            >
              Sign Up
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
