import { useEffect } from "react";
import CreatePostModal from "../components/createPost/CreatePostModal";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { FiPlusSquare } from "react-icons/fi";

const CreatePostPage = () => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      openAuthModal("Log in to create a post");
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-[#0095F6]">
          <FiPlusSquare size={36} />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Create a New Post</h2>
        <p className="mt-2 text-sm text-gray-500 max-w-sm">
          You need to be logged in to upload photos and share posts with the Instagram community.
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <CreatePostModal />
    </div>
  );
};

export default CreatePostPage;
