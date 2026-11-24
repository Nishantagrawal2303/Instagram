import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import ConversationList from "../components/message/ConversationList";
import ChatWindow from "../components/message/ChatWindow";

import type { Conversation } from "../Types/conversation";

import { connectSocket } from "../socket/socket";
import { useGetConversationsQuery } from "../services/conversationApi";
import { useAuth } from "../context/AuthContext";
import { FiMessageCircle } from "react-icons/fi";

const MessagePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, openAuthModal } = useAuth();

  // Fetch all conversations
  const { data: conversations } = useGetConversationsQuery(undefined, {
    skip: !isAuthenticated,
  });

  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      openAuthModal("Log in to view messages");
    }
  }, [isAuthenticated]);

  // Connect socket
  useEffect(() => {
    if (!isAuthenticated) return;
    let activeSocket: any;

    const connect = () => {
      const accessToken = document.cookie
        .split("; ")
        .find((cookie) => cookie.startsWith("accessToken="))
        ?.split("=")[1];

      if (!accessToken) {
        return;
      }

      activeSocket = connectSocket(decodeURIComponent(accessToken));
    };

    connect();

    return () => {
      activeSocket?.disconnect();
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!userId || !conversations) return;

    const conversation = conversations.find(
      (conv) => conv.user.id === userId
    );

    if (conversation) {
      setSelectedConversation(conversation);
    }
  }, [userId, conversations]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-[#0095F6]">
          <FiMessageCircle size={36} />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Your Messages</h2>
        <p className="mt-2 text-sm text-gray-500 max-w-sm">
          Send private photos and messages to a friend or group. Log in to start chatting.
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
    <div className="flex h-screen bg-white">
      {/* Left Sidebar */}
      <div className="w-[360px] border-r border-gray-200">
        <ConversationList
          selectedConversation={selectedConversation}
          onSelectConversation={(conversation) => {
            setSelectedConversation(conversation);
            navigate(`/messages/${conversation.user.id}`);
          }}
        />
      </div>

      {/* Right Chat Area */}
      <div className="flex-1">
        <ChatWindow selectedConversation={selectedConversation} />
      </div>
    </div>
  );
};

export default MessagePage;
