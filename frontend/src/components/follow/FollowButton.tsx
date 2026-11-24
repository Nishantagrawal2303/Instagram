import { useFollowUserMutation, useUnfollowUserMutation } from "../../services/followApi";
import { useAuth } from "../../context/AuthContext";

interface FollowButtonProps {
  userId: string;
  isFollowing: boolean;
}

const FollowButton = ({
  userId,
  isFollowing,
}: FollowButtonProps) => {
  const { requireAuth } = useAuth();
  const [followUser, { isLoading: followLoading }] = useFollowUserMutation();
  const [unfollowUser, { isLoading: unfollowLoading }] = useUnfollowUserMutation();

  const loading = followLoading || unfollowLoading;

  const handleFollow = () => {
    requireAuth(async () => {
      try {
        if (isFollowing) {
          await unfollowUser(userId).unwrap();
        } else {
          await followUser(userId).unwrap();
        }
      } catch (error) {
        console.error("Follow error:", error);
      }
    }, "Log in to follow accounts");
  };

  return (
    <button
      onClick={handleFollow}
      disabled={loading}
      className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition active:scale-95 ${
        isFollowing
          ? "bg-gray-100 text-gray-800 hover:bg-gray-200"
          : "bg-[#0095F6] text-white hover:bg-blue-600 shadow-2xs"
      }`}
    >
      {loading ? "..." : isFollowing ? "Following" : "Follow"}
    </button>
  );
};

export default FollowButton;
