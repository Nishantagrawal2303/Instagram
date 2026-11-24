import { useState } from "react";
import {
  FiHeart,
  FiMessageCircle,
} from "react-icons/fi";

import type { PostInterface } from "../../Types/post";
import { useToggleLikeMutation } from "../../services/likeApi";
import CommentModal from "../comments/CommentModal";
import { useAuth } from "../../context/AuthContext";

type Props = {
  post: PostInterface;
};

const PostActions = ({ post }: Props) => {
  const { requireAuth } = useAuth();
  const [toggleLike, { isLoading }] = useToggleLikeMutation();

  const [isCommentOpen, setIsCommentOpen] = useState(false);

  const handleLike = () => {
    requireAuth(async () => {
      try {
        await toggleLike(post.post_id).unwrap();
      } catch (error) {
        console.error("Like failed:", error);
      }
    }, "Log in to like posts");
  };

  return (
    <>
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex gap-4">
          <button
            onClick={handleLike}
            disabled={isLoading}
            className="p-1 transition hover:scale-110 active:scale-95"
            aria-label="Like post"
          >
            <FiHeart
              size={24}
              className={`cursor-pointer ${isLoading ? "opacity-50" : ""}`}
            />
          </button>

          <button
            onClick={() => setIsCommentOpen(true)}
            className="p-1 transition hover:scale-110 active:scale-95"
            aria-label="View comments"
          >
            <FiMessageCircle size={24} className="cursor-pointer" />
          </button>
        </div>
      </div>

      <CommentModal
        postId={post.post_id}
        isOpen={isCommentOpen}
        onClose={() => setIsCommentOpen(false)}
      />
    </>
  );
};

export default PostActions;
