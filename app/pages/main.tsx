import { useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { clearCredentials, loadCredentials } from "../storage/credentials";
import { ChatSidebar } from "../components/chat/ChatSidebar";
import { ChatWindow } from "../components/chat/ChatWindow";
import { NewChatForm } from "../components/chat/NewChatForm";
import type { Chat, Message } from "../components/chat/model";

export default function Main() {
  const navigate = useNavigate();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});

  const credentials = loadCredentials();
  if (!credentials) {
    return <Navigate to="/" replace />;
  }

  const activeChat = chats.find((c) => c.id === activeChatId) ?? null;

  const handleLogout = () => {
    clearCredentials();
    navigate("/", { replace: true });
  };

  const handleSelectChat = (id: string) => {
    setActiveChatId(id);
    setIsCreating(false);
  };

  const handleNewChat = () => {
    setActiveChatId(null);
    setIsCreating(true);
  };

  const handleCreateChat = (phone: string) => {
    setChats((prev) =>
      prev.some((c) => c.id === phone) ? prev : [{ id: phone, phone }, ...prev]
    );
    setActiveChatId(phone);
    setIsCreating(false);
  };

  const handleSend = (chatId: string, text: string) => {
    // TODO: сделать отправку сообщений
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#e8f0f8] p-4">
      <div className="flex h-[min(720px,calc(100dvh-2rem))] w-full max-w-[1100px] overflow-hidden rounded-xl bg-white shadow-xl">
        <ChatSidebar
          chats={chats}
          activeChatId={activeChatId}
          onSelect={handleSelectChat}
          onNewChat={handleNewChat}
          onLogout={handleLogout}
        />

        <section className="flex min-w-0 flex-1 flex-col border-l border-gray-200 bg-[#f5f8fb]">
          {isCreating ? (
            <div className="flex flex-1 items-center justify-center p-6">
              <NewChatForm onCreate={handleCreateChat} />
            </div>
          ) : activeChat ? (
            <ChatWindow
              chat={activeChat}
              messages={messages[activeChat.id] ?? []}
              onSend={(text) => handleSend(activeChat.id, text)}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center p-6">
              <p className="text-gray-500">Выберите чат или создайте новый</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
