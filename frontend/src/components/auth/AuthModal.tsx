import { useNavigate } from "react-router-dom";
import { FiX, FiHeart, FiMessageCircle, FiUserPlus, FiPlusSquare, FiSend, FiLock } from "react-icons/fi";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt?: string;
}

const getActionDetails = (prompt?: string) => {
  const p = (prompt || "").toLowerCase();
  if (p.includes("like")) {
    return {
      title: "Log in to like this post",
      desc: "Sign in to like photos, leave comments, and connect with the creator.",
      icon: <FiHeart size={28} className="text-[#ED4956]" />,
      bg: "bg-red-50",
    };
  }
  if (p.includes("comment")) {
    return {
      title: "Log in to comment",
      desc: "Join the conversation! Log in or create an account to share your thoughts.",
      icon: <FiMessageCircle size={28} className="text-[#0095F6]" />,
      bg: "bg-blue-50",
    };
  }
  if (p.includes("follow")) {
    return {
      title: "Log in to follow accounts",
      desc: "Stay updated with photos and stories by following this account.",
      icon: <FiUserPlus size={28} className="text-purple-600" />,
      bg: "bg-purple-50",
    };
  }
  if (p.includes("message")) {
    return {
      title: "Log in to send messages",
      desc: "Direct messaging requires an Instagram account. Connect with friends in private chat.",
      icon: <FiSend size={28} className="text-[#0095F6]" />,
      bg: "bg-blue-50",
    };
  }
  if (p.includes("create") || p.includes("post")) {
    return {
      title: "Log in to create a post",
      desc: "Share your favorite moments and photos with friends and followers.",
      icon: <FiPlusSquare size={28} className="text-[#0095F6]" />,
      bg: "bg-blue-50",
    };
  }

  return {
    title: prompt || "Log in to continue",
    desc: "Experience the full community. Follow accounts, like posts, and chat with friends.",
    icon: <FiLock size={28} className="text-gray-800" />,
    bg: "bg-gray-100",
  };
};

const AuthModal = ({ isOpen, onClose, prompt }: AuthModalProps) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const { title, desc, icon, bg } = getActionDetails(prompt);

  const handleLogin = () => {
    onClose();
    navigate("/login");
  };

  const handleRegister = () => {
    onClose();
    navigate("/register");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs transition-opacity animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl bg-white p-7 text-center shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
          aria-label="Close"
        >
          <FiX size={20} />
        </button>

        {/* Action Icon */}
        <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${bg}`}>
          {icon}
        </div>

        {/* Instagram Script / Brand Title */}
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {title}
        </h2>

        {/* Description */}
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          {desc}
        </p>

        {/* Buttons */}
        <div className="space-y-2.5">
          <button
            onClick={handleLogin}
            className="w-full rounded-lg bg-[#0095F6] py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-600 active:scale-[0.99]"
          >
            Log In
          </button>

          <button
            onClick={handleRegister}
            className="w-full rounded-lg border border-gray-300 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 active:scale-[0.99]"
          >
            Sign Up
          </button>
        </div>

        {/* Dismiss / Continue browsing */}
        <button
          onClick={onClose}
          className="mt-4 text-xs font-medium text-gray-400 hover:text-gray-600 transition"
        >
          Continue browsing as guest
        </button>
      </div>
    </div>
  );
};

export default AuthModal;
