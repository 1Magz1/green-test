import { useEffect, useMemo, useState } from "react";
import { message } from "antd";
import { Navigate, useNavigate } from "react-router";
import {
  clearCredentials,
  loadCredentials,
  type Credentials,
} from "../storage/credentials";
import { getChats } from "../api/getChats";
import { useAvatars } from "../hooks/useAvatars";
import { useChatHistory } from "../hooks/useChatHistory";
import { ChatSidebar } from "../components/chat/ChatSidebar";
import { ChatWindow } from "../components/chat/ChatWindow";
import { NewChatForm } from "../components/chat/NewChatForm";
import {
  localChatFromPhone,
  type Chat,
  type Message,
} from "../components/chat/model";

export default function Main() {
  const navigate = useNavigate();
  const [chats, setChats] = useState<Chat[]>([]);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});

  const [credentials, setCredentials] = useState<Credentials | null | undefined>(
    undefined
  );
  useEffect(() => {
    setCredentials(loadCredentials());
  }, []);

  const idInstance = credentials?.idInstance;
  const apiTokenInstance = credentials?.apiTokenInstance;

  const chatIds = useMemo(() => chats.map((c) => c.id), [chats]);
  const avatars = useAvatars(idInstance, apiTokenInstance, chatIds);
  const history = useChatHistory(idInstance, apiTokenInstance, activeChatId);

  useEffect(() => {
    if (!idInstance || !apiTokenInstance) return;

    const controller = new AbortController();

    getChats(idInstance, apiTokenInstance, controller.signal).then((result) => {
      if (controller.signal.aborted) return;

      if (result.success) {
        const loaded: Chat[] = result.chats.map((c) => ({
          id: c.chatId,
          name: c.name,
          type: c.type,
          phoneNumber: c.phoneNumber || undefined, // 0 = номер скрыт
          unreadCount: c.unreadCount,
        }));

        setChats((prev) => {
          const loadedIds = new Set(loaded.map((c) => c.id));
          const loadedPhones = new Set(
            loaded.map((c) => c.phoneNumber).filter(Boolean)
          );
          const localOnly = prev.filter(
            (c) =>
              !loadedIds.has(c.id) &&
              !(c.phoneNumber && loadedPhones.has(c.phoneNumber))
          );
          return [...localOnly, ...loaded];
        });
      } else {
        message.error(`Не удалось загрузить чаты: ${result.error}`);
      }
      setChatsLoading(false);
    });

    return () => controller.abort();
  }, [idInstance, apiTokenInstance]);

  if (credentials === undefined) {
    return null;
  }

  if (credentials === null) {
    return <Navigate to="/" replace />;
  }

  const activeChat = chats.find((c) => c.id === activeChatId) ?? null;
  const historyState = activeChat ? history.getState(activeChat.id) : null;

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
    const existing = chats.find((c) => c.phoneNumber === Number(phone));
    if (existing) {
      handleSelectChat(existing.id);
      return;
    }

    const chat = localChatFromPhone(phone);
    setChats((prev) => [chat, ...prev]);
    setActiveChatId(chat.id);
    setIsCreating(false);
  };

  const handleSend = (chatId: string, text: string) => {
    // TODO: отправка через Green-API; пока сообщение только добавляется локально
    setMessages((prev) => {
      const list = prev[chatId] ?? [];
      return {
        ...prev,
        [chatId]: [
          ...list,
          {
            id: `${Date.now()}-${list.length}`,
            text,
            outgoing: true,
            timestamp: Math.floor(Date.now() / 1000),
          },
        ],
      };
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#e8f0f8] p-4">
      <div className="flex h-[min(720px,calc(100dvh-2rem))] w-full max-w-[1100px] overflow-hidden rounded-xl bg-white shadow-xl">
        <ChatSidebar
          chats={chats}
          avatars={avatars}
          loading={chatsLoading}
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
              key={activeChat.id}
              chat={activeChat}
              avatarUrl={avatars[activeChat.id]}
              messages={[
                ...(historyState?.messages ?? []),
                ...(messages[activeChat.id] ?? []),
              ]}
              loadingHistory={historyState?.loading ?? false}
              hasMore={historyState?.hasMore ?? false}
              historyError={historyState?.error ?? null}
              onLoadOlder={() => history.loadMore(activeChat.id)}
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
