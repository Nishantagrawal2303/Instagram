import { useEffect } from "react";
import ProfileHeader from "../components/Profile/ProfileHeader";
import ProfilePostsGrid from "../components/Profile/ProfilePostsGrid";
import ProfileTabs from "../components/Profile/ProfileTabs";
import { useGetProfileQuery } from "../services/authApi";
import { useGetMyPostsQuery } from "../services/postApi";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { FiUser } from "react-icons/fi";

const ProfilePage = () => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const navigate = useNavigate();

  const { data: profile, isLoading: profileLoading } = useGetProfileQuery(undefined, {
    skip: !isAuthenticated,
  });

  const { data: posts = [] } = useGetMyPostsQuery(undefined, {
    skip: !isAuthenticated,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      openAuthModal("Log in to view your profile");
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 text-gray-500">
          <FiUser size={36} />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Your Instagram Profile</h2>
        <p className="mt-2 text-sm text-gray-500 max-w-sm">
          Log in or sign up to view your profile, manage your photos, and edit your bio.
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

  if (profileLoading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-8 animate-pulse">
        <div className="flex items-center gap-8 mb-8 border-b pb-8">
          <div className="h-32 w-32 rounded-full bg-gray-200" />
          <div className="space-y-4 flex-1">
            <div className="h-5 w-40 rounded bg-gray-200" />
            <div className="h-4 w-60 rounded bg-gray-100" />
            <div className="h-8 w-28 rounded bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        {profile && <ProfileHeader profile={profile} />}
        <ProfileTabs />
        <ProfilePostsGrid posts={posts} />
      </div>
    </div>
  );
};

export default ProfilePage;
