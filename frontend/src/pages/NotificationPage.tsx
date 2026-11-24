import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { FiHeart } from "react-icons/fi";

const NotificationPage = () => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      openAuthModal("Log in to view notifications");
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-[#ED4956]">
          <FiHeart size={36} />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
        <p className="mt-2 text-sm text-gray-500 max-w-sm">
          Activity on your posts and updates from people you follow will appear here. Log in to check your activity.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={() => navigate("/login")}
            className="rounded-lg bg-[#0095F6] px-5 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-blue-600"
          >
            Log In
          </button>
          <button
            onClick={() => navigate("/register")}
            className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Sign Up
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Notifications</h1>
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500 text-sm">
        No new notifications
      </div>
    </div>
  );
};

export default NotificationPage;
