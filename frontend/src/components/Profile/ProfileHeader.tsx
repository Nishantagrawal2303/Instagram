import ProfileStats from "./ProfileStats";
import ProfileBio from "./ProfileBio";
import { useNavigate } from "react-router-dom";
import { useCreateConversationMutation } from "../../services/conversationApi";
import FollowButton from "../follow/FollowButton";
import { useAuth } from "../../context/AuthContext";

type Profile = {
  id: string;
  name: string;
  username: string;
  bio: string | null;
  profilePicture: string | null;

  posts: number;
  followers: number;
  following: number;

  isOwner: boolean;
  isFollowing: boolean;
};

type Props = {
  profile: Profile;
};

const ProfileHeader = ({ profile }: Props) => {
  const navigate = useNavigate();
  const { requireAuth } = useAuth();
  const [createConversation, { isLoading }] = useCreateConversationMutation();

  const handleMessage = () => {
    requireAuth(async () => {
      try {
        await createConversation({
          receiverId: profile.id,
        }).unwrap();

        navigate(`/messages/${profile.id}`);
      } catch (error) {
        console.error("Message error:", error);
      }
    }, "Log in to send messages");
  };

  return (
    <div className="mb-8 border-b border-gray-200 pb-8">
      <div className="flex flex-col gap-8 md:flex-row md:items-center">
        {/* Avatar */}
        <div className="flex justify-center md:justify-start">
          {profile.profilePicture ? (
            <img
              src={profile.profilePicture}
              alt={profile.name}
              className="h-32 w-32 rounded-full object-cover border border-gray-200"
            />
          ) : (
            <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-tr from-amber-200 via-rose-200 to-purple-200 text-4xl font-semibold text-gray-700">
              {profile.name?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-5">
          <ProfileBio profile={profile} />

          <ProfileStats
            posts={profile.posts}
            followers={profile.followers}
            following={profile.following}
          />

          <div>
            {profile.isOwner ? (
              <button
                onClick={() => navigate("/edit-profile")}
                className="rounded-lg bg-gray-100 px-6 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-200 transition"
              >
                Edit Profile
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <FollowButton
                  userId={profile.id}
                  isFollowing={profile.isFollowing}
                />

                <button
                  onClick={handleMessage}
                  disabled={isLoading}
                  className="rounded-lg bg-gray-100 px-5 py-1.5 text-xs font-semibold text-gray-800 transition hover:bg-gray-200 active:scale-95 disabled:opacity-50"
                >
                  {isLoading ? "Opening..." : "Message"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
