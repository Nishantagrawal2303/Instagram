import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import ConversationList from "../components/message/ConversationList";
import ChatWindow from "../components/message/ChatWindow";

import type { Conversation } from "../Types/conversation";

import { connectSocket } from "../socket/socket";
import { useGetConversationsQuery } from "../services/conversationApi";

const MessagePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();

  // Fetch all conversations
  const { data: conversations } = useGetConversationsQuery();

  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);

  // Connect socket
  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (!userId || !conversations) return;

    const conversation = conversations.find(
      (conversation) => conversation.user.id === userId
    );

    if (conversation) {
      setSelectedConversation(conversation);
    }
  }, [userId, conversations]);

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
