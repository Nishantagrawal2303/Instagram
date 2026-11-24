import { Link, useNavigate } from "react-router-dom";
import { FiLogIn, FiLogOut, FiSettings, FiUserPlus } from "react-icons/fi";
import { useLogoutMutation } from "../../services/authApi";
import { useAuth } from "../../context/AuthContext";

type Props = {
  onClose: () => void;
};

const MoreMenu = ({ onClose }: Props) => {
  const navigate = useNavigate();
  const { isAuthenticated, setIsAuthenticated } = useAuth();
  const [logout, { isLoading }] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logout(undefined).unwrap();
      document.cookie = "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
      setIsAuthenticated(false);
      onClose();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <>
      {/* Backdrop overlay to close on outside click */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div className="absolute bottom-full left-0 mb-2 w-60 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl z-50 animate-in fade-in slide-in-from-bottom-2">
        {isAuthenticated ? (
          <div className="space-y-1">
            <Link
              to="/profile"
              onClick={onClose}
              className="flex items-center gap-3 rounded-xl p-3 text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
            >
              <FiSettings size={18} />
              Settings
            </Link>

            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="flex w-full items-center gap-3 rounded-xl p-3 text-sm font-medium text-red-600 hover:bg-red-50 transition"
            >
              <FiLogOut size={18} />
              {isLoading ? "Logging out..." : "Log out"}
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            <Link
              to="/login"
              onClick={onClose}
              className="flex items-center gap-3 rounded-xl p-3 text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
            >
              <FiLogIn size={18} />
              Log In
            </Link>

            <Link
              to="/register"
              onClick={onClose}
              className="flex items-center gap-3 rounded-xl p-3 text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
            >
              <FiUserPlus size={18} />
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </>
  );
};

export default MoreMenu;
