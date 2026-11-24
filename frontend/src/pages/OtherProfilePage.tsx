import { useParams, Link } from "react-router-dom";
import ProfileHeader from "../components/Profile/ProfileHeader";
import ProfilePostsGrid from "../components/Profile/ProfilePostsGrid";
import ProfileTabs from "../components/Profile/ProfileTabs";
import { useGetUserProfileQuery } from "../services/authApi";
import { useGetUserPostsQuery } from "../services/postApi";

const OtherProfilePage = () => {
  const { id } = useParams();

  const { data: profile, isLoading: profileLoading, isError } = useGetUserProfileQuery(id!);
  const { data: posts = [] } = useGetUserPostsQuery(id!);

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

  if (isError || !profile) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <h2 className="text-xl font-bold text-gray-900">User Not Found</h2>
        <p className="mt-2 text-sm text-gray-500">
          The link you followed may be broken, or the account may have been removed.
        </p>
        <Link
          to="/"
          className="mt-5 rounded-lg bg-[#0095F6] px-5 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-blue-600"
        >
          Go back to Instagram
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <ProfileHeader profile={profile} />
        <ProfileTabs />
        <ProfilePostsGrid posts={posts} />
      </div>
    </div>
  );
};

export default OtherProfilePage;
