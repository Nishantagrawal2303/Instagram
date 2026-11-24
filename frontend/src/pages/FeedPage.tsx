import { useGetPostsQuery } from "../services/postApi";
import PostCard from "../components/feed/PostCard";
import type { PostInterface } from "../Types/post";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { FiCamera } from "react-icons/fi";

const PostSkeleton = () => (
  <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 animate-pulse">
    <div className="flex items-center gap-3 mb-4">
      <div className="h-10 w-10 rounded-full bg-gray-200" />
      <div className="space-y-1.5 flex-1">
        <div className="h-3 w-28 rounded bg-gray-200" />
        <div className="h-2.5 w-20 rounded bg-gray-100" />
      </div>
    </div>
    <div className="w-full aspect-square bg-gray-200 rounded-md mb-3" />
    <div className="flex gap-3 mb-3">
      <div className="h-6 w-6 rounded bg-gray-200" />
      <div className="h-6 w-6 rounded bg-gray-200" />
    </div>
    <div className="h-3 w-20 rounded bg-gray-200 mb-2" />
    <div className="h-3 w-3/4 rounded bg-gray-100" />
  </div>
);

const FeedPage = () => {
  const { data: posts, isLoading, isError, refetch } = useGetPostsQuery(undefined);
  const { isAuthenticated, openAuthModal } = useAuth();

  return (
    <div className="mx-auto max-w-xl px-2 py-4 sm:px-0 sm:py-8">
      {/* Logged out welcome / CTA banner */}
      {!isAuthenticated && (
        <div className="mb-6 rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 via-indigo-50/50 to-pink-50/40 p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Welcome to Instagram
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">
                Log in to follow friends, like photos, and join the conversation.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                to="/login"
                className="rounded-lg bg-[#0095F6] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-600"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-6">
          <PostSkeleton />
          <PostSkeleton />
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="rounded-xl border border-red-100 bg-red-50/50 p-8 text-center">
          <p className="text-sm text-gray-700 font-medium mb-3">
            Unable to load the feed right now.
          </p>
          <button
            onClick={() => refetch()}
            className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-black"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Posts Stream */}
      {!isLoading && !isError && posts && posts.length > 0 && (
        <div className="space-y-6">
          {posts.map((post: PostInterface) => (
            <PostCard key={post.post_id} post={post} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && posts && posts.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-500">
            <FiCamera size={30} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No Posts Yet</h3>
          <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
            {isAuthenticated
              ? "Follow other accounts or create your first post to see photos and videos here."
              : "Be the first to share photos and moments with the community."}
          </p>
          {!isAuthenticated && (
            <button
              onClick={() => openAuthModal("Log in to create a post")}
              className="mt-5 rounded-lg bg-[#0095F6] px-5 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-blue-600"
            >
              Log in to Post
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FeedPage;
