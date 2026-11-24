import { Link, useNavigate } from "react-router-dom";
import { FiHeart, FiMessageCircle } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";

const MobileTopBar = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-gray-200 bg-white/95 px-4 backdrop-blur-md md:hidden">
      {/* Instagram Logo */}
      <Link to="/" className="flex items-center">
        <span className="text-2xl font-bold tracking-tight italic font-serif">
          Instagram
        </span>
      </Link>

      {/* Right Action Icons or Login/Signup buttons */}
      <div className="flex items-center gap-3">
        {isAuthenticated ? (
          <>
            <Link
              to="/notifications"
              className="p-1.5 text-gray-800 transition hover:text-black active:scale-95"
              aria-label="Notifications"
            >
              <FiHeart size={24} />
            </Link>

            <Link
              to="/messages"
              className="p-1.5 text-gray-800 transition hover:text-black active:scale-95"
              aria-label="Messages"
            >
              <FiMessageCircle size={24} />
            </Link>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/login")}
              className="rounded-lg bg-[#0095F6] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-600 active:scale-95"
            >
              Log In
            </button>
            <button
              onClick={() => navigate("/register")}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 active:scale-95"
            >
              Sign Up
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default MobileTopBar;
