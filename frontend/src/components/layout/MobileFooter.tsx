import {
  FiHome,
  FiMessageCircle,
  FiPlusSquare,
  FiUser,
  FiLogIn,
  FiHeart,
} from "react-icons/fi";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const MobileFooter = () => {
  const { isAuthenticated, requireAuth } = useAuth();
  const navigate = useNavigate();

  const handleRestrictedNav = (path: string, prompt: string) => {
    requireAuth(() => {
      navigate(path);
    }, prompt);
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur-md md:hidden">
      <div className="flex h-14 items-center justify-around px-2">
        {/* Home */}
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center p-2 transition ${
              isActive ? "text-black" : "text-gray-500 hover:text-gray-800"
            }`
          }
          aria-label="Home"
        >
          <FiHome size={24} />
        </NavLink>

        {/* Notifications (logged in) or Create */}
        {isAuthenticated ? (
          <NavLink
            to="/notifications"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center p-2 transition ${
                isActive ? "text-black" : "text-gray-500 hover:text-gray-800"
              }`
            }
            aria-label="Notifications"
          >
            <FiHeart size={24} />
          </NavLink>
        ) : null}

        {/* Create Post */}
        <button
          onClick={() => handleRestrictedNav("/create", "Log in to create a post")}
          className="flex flex-col items-center justify-center p-2 text-gray-500 transition hover:text-gray-800 active:scale-95"
          aria-label="Create Post"
        >
          <FiPlusSquare size={24} />
        </button>

        {/* Messages */}
        <button
          onClick={() => handleRestrictedNav("/messages", "Log in to view messages")}
          className="flex flex-col items-center justify-center p-2 text-gray-500 transition hover:text-gray-800 active:scale-95"
          aria-label="Messages"
        >
          <FiMessageCircle size={24} />
        </button>

        {/* Profile (logged in) OR Log In button (logged out) */}
        {isAuthenticated ? (
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center p-2 transition ${
                isActive ? "text-black" : "text-gray-500 hover:text-gray-800"
              }`
            }
            aria-label="Profile"
          >
            <FiUser size={24} />
          </NavLink>
        ) : (
          <button
            onClick={() => navigate("/login")}
            className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-[#0095F6] transition hover:bg-blue-100 active:scale-95"
            aria-label="Log In"
          >
            <FiLogIn size={16} />
            <span>Log In</span>
          </button>
        )}
      </div>
    </footer>
  );
};

export default MobileFooter;
