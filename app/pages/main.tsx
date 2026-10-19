import { useEffect, useMemo, useState } from "react";
import { message } from "antd";
import { Navigate, useNavigate } from "react-router";
import {
  clearCredentials,
  loadCredentials,
  type Credentials,
} from "../storage/credentials";
import { checkAccount } from "../api/checkAccount";
import { getChats } from "../api/getChats";
import { sendMessage } from "../api/sendMessage";
import { useAvatars } from "../hooks/useAvatars";
import { useChatHistory } from "../hooks/useChatHistory";
import { ChatSidebar } from "../components/chat/ChatSidebar";
import { ChatWindow } from "../components/chat/ChatWindow";
import { NewChatForm } from "../components/chat/NewChatForm";
import type { Chat, Message } from "../components/chat/model";

export default function Main() {
  // Хуки должны вызываться до любого раннего return
  const navigate = useNavigate();
  const [chats, setChats] = useState<Chat[]>([]);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});

  // undefined = ещё не проверяли (так на сервере и при первом рендере на клиенте),
  // null = данных нет. sessionStorage читаем только в браузере, после монтирования.
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

  // Загрузка существующих чатов при открытии страницы
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

        // Локально созданные чаты, которых нет в ответе сервера, не теряем
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
    return null; // совпадает с серверным HTML, поэтому гидрация проходит
  }

  if (credentials === null) {
    return <Navigate to="/" replace />;
  }

  const activeChat = chats.find((c) => c.id === activeChatId) ?? null;
  const historyState = activeChat ? history.getState(activeChat.id) : null;

  // Отправленные из этого окна сообщения, которые уже пришли в истории, не дублируем
  const historyIds = new Set((historyState?.messages ?? []).map((m) => m.id));
  const localMessages = activeChat
    ? (messages[activeChat.id] ?? []).filter(
        (m) => !(m.serverId && historyIds.has(m.serverId))
      )
    : [];

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

  // Метода "создать чат" в API нет: chatId по номеру телефона возвращает CheckAccount,
  // после чего чат добавляется в список локально.
  const handleCreateChat = async (phone: string): Promise<boolean> => {
    if (!idInstance || !apiTokenInstance) return false;
    const phoneNumber = Number(phone);

    // Чат с этим номером уже есть в списке: открываем без запроса к API
    const known = chats.find((c) => c.phoneNumber === phoneNumber);
    if (known) {
      handleSelectChat(known.id);
      return true;
    }

    const result = await checkAccount(idInstance, apiTokenInstance, phoneNumber);
    if (!result.success) {
      message.error(result.error);
      return false;
    }
    if (!result.chatId) {
      message.warning("На этом номере не найден аккаунт");
      return false;
    }

    const chatId = result.chatId;
    setChats((prev) =>
      prev.some((c) => c.id === chatId)
        ? prev
        : [{ id: chatId, type: "user", phoneNumber }, ...prev]
    );
    handleSelectChat(chatId);
    return true;
  };

  const updateLocalMessage = (
    chatId: string,
    localId: string,
    patch: Partial<Message>
  ) => {
    setMessages((prev) => ({
      ...prev,
      [chatId]: (prev[chatId] ?? []).map((m) =>
        m.id === localId ? { ...m, ...patch } : m
      ),
    }));
  };

  const deliver = async (chatId: string, localId: string, text: string) => {
    if (!idInstance || !apiTokenInstance) return;

    const result = await sendMessage(idInstance, apiTokenInstance, chatId, text);
    if (result.success) {
      updateLocalMessage(chatId, localId, {
        status: "sent",
        serverId: result.idMessage ?? undefined,
      });
    } else {
      updateLocalMessage(chatId, localId, { status: "failed" });
      message.error(`Не удалось отправить сообщение: ${result.error}`);
    }
  };

  // Сообщение сразу появляется в окне со статусом "sending", затем уходит в API
  const handleSend = (chatId: string, text: string) => {
    const localId = `local-${Date.now()}-${(messages[chatId] ?? []).length}`;
    setMessages((prev) => ({
      ...prev,
      [chatId]: [
        ...(prev[chatId] ?? []),
        {
          id: localId,
          text,
          outgoing: true,
          timestamp: Math.floor(Date.now() / 1000),
          status: "sending",
        },
      ],
    }));
    void deliver(chatId, localId, text);
  };

  const handleRetry = (chatId: string, localId: string) => {
    const failed = (messages[chatId] ?? []).find((m) => m.id === localId);
    if (!failed) return;
    updateLocalMessage(chatId, localId, { status: "sending" });
    void deliver(chatId, localId, failed.text);
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
              messages={[...(historyState?.messages ?? []), ...localMessages]}
              loadingHistory={historyState?.loading ?? false}
              hasMore={historyState?.hasMore ?? false}
              historyError={historyState?.error ?? null}
              onLoadOlder={() => history.loadMore(activeChat.id)}
              onSend={(text) => handleSend(activeChat.id, text)}
              onRetry={(id) => handleRetry(activeChat.id, id)}
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
