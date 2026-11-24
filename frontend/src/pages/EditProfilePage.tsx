import { useEffect } from "react";
import EditProfileForm from "../components/editProfile/EditProfileForm";
import { useGetProfileQuery } from "../services/authApi";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const EditProfilePage = () => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const navigate = useNavigate();

  const { data: profile, isLoading } = useGetProfileQuery(undefined, {
    skip: !isAuthenticated,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      openAuthModal("Log in to edit your profile");
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated || isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold">
          Edit Profile
        </h1>

        <EditProfileForm profile={profile} />
      </div>
    </div>
  );
};

export default EditProfilePage;
