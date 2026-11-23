
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
    <div>
      {isAuthenticated ? (
        <>
          <Link
            to="/profile"
            onClick={onClose}
            className="flex items-center gap-3 rounded-lg p-3 hover:bg-gray-100"
          >
            <FiSettings />
            Settings
          </Link>

          <button
            onClick={handleLogout}
            disabled={isLoading}
            className="flex w-full items-center gap-3 rounded-lg p-3 hover:bg-gray-100"
          >
            <FiLogOut />
            {isLoading ? "Logging out..." : "Logout"}
          </button>
        </>
      ) : (
        <>
          <Link
            to="/login"
            onClick={onClose}
            className="flex items-center gap-3 rounded-lg p-3 hover:bg-gray-100"
          >
            <FiLogIn />
            Login
          </Link>

          <Link
            to="/register"
            onClick={onClose}
            className="flex items-center gap-3 rounded-lg p-3 hover:bg-gray-100"
          >
            <FiUserPlus />
            Sign Up
          </Link>
        </>
      )}
    </div>
  );
};

export default MoreMenu;

