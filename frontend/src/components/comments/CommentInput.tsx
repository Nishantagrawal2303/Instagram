import { useState } from "react";
import { useCreateCommentMutation } from "../../services/commentApi";
import { useAuth } from "../../context/AuthContext";

type Props = {
  postId: string;
  parentCommentId?: string;
  replyingTo?: string;
  onCancel?: () => void;
};

const CommentInput = ({ postId, parentCommentId, replyingTo, onCancel }: Props) => {
  const [text, setText] = useState("");
  const { isAuthenticated, requireAuth } = useAuth();
  const [createComment, { isLoading }] = useCreateCommentMutation();

  const handleSubmit = () => {
    requireAuth(async () => {
      if (!text.trim()) return;

      try {
        await createComment({
          postId,
          text,
          parentCommentId,
        }).unwrap();

        setText("");
        onCancel?.();
      } catch (error) {
        console.error("Comment failed:", error);
      }
    }, "Log in to comment");
  };

  const handleInputFocus = () => {
    if (!isAuthenticated) {
      requireAuth(() => {}, "Log in to comment");
    }
  };

  return (
    <>
      {replyingTo && (
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Replying to <span className="font-semibold text-gray-800">@{replyingTo}</span>
          </p>

          <button
            onClick={onCancel}
            className="text-xs font-semibold text-gray-400 hover:text-red-500 transition"
          >
            Cancel
          </button>
        </div>
      )}

      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder={isAuthenticated ? "Add a comment..." : "Log in to add a comment..."}
          value={text}
          onFocus={handleInputFocus}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm outline-none transition focus:border-blue-500"
        />

        <button
          onClick={handleSubmit}
          disabled={isLoading || !text.trim()}
          className="text-sm font-semibold text-[#0095F6] hover:text-blue-700 transition disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLoading ? "Posting..." : "Post"}
        </button>
      </div>
    </>
  );
};

export default CommentInput;
