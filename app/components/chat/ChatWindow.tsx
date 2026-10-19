import React, {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Button, Input, Spin } from "antd";
import { SendOutlined } from "@ant-design/icons";
import { ChatAvatar } from "./ChatAvatar";
import {
  chatTitle,
  formatMessageDate,
  messageDayKey,
  type Chat,
  type Message,
} from "./model";

const LOAD_THRESHOLD_PX = 40;
const NEAR_BOTTOM_PX = 100;

interface ChatWindowProps {
  chat: Chat;
  avatarUrl?: string | null;
  messages: Message[];
  loadingHistory: boolean;
  hasMore: boolean;
  historyError: string | null;
  onLoadOlder: () => void;
  onSend: (text: string) => void;
  onRetry: (messageId: string) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  chat,
  avatarUrl,
  messages,
  loadingHistory,
  hasMore,
  historyError,
  onLoadOlder,
  onSend,
  onRetry,
}) => {
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevScroll = useRef<{ height: number; top: number } | null>(null);
  const lastMessageId = useRef<string | undefined>(undefined);
  const nearBottom = useRef(true);

  const requestOlder = () => {
    const el = scrollRef.current;
    if (el && messages.length > 0) {
      prevScroll.current = { height: el.scrollHeight, top: el.scrollTop };
    }
    onLoadOlder();
  };

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    if (prevScroll.current && !loadingHistory) {
      el.scrollTop = el.scrollHeight - prevScroll.current.height + prevScroll.current.top;
      prevScroll.current = null;
      return;
    }

    const last = messages[messages.length - 1];
    if (last?.id !== lastMessageId.current) {
      const firstLoad = lastMessageId.current === undefined;
      lastMessageId.current = last?.id;
      if (firstLoad || last?.outgoing || nearBottom.current) {
        el.scrollTop = el.scrollHeight;
      }
    }
  }, [messages.length, loadingHistory]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || loadingHistory || !hasMore || historyError) return;
    if (el.scrollHeight <= el.clientHeight) {
      requestOlder();
    }
  }, [messages.length, loadingHistory, hasMore, historyError]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;

    if (
      e.currentTarget.scrollTop < LOAD_THRESHOLD_PX &&
      hasMore &&
      !loadingHistory &&
      !historyError
    ) {
      requestOlder();
    }
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  };

  const items: React.ReactNode[] = [];
  let prevDay: string | null = null;
  for (const m of messages) {
    const day = m.timestamp ? messageDayKey(m.timestamp) : null;
    if (m.timestamp && day !== prevDay) {
      items.push(
        <li
          key={`date-${m.id}`}
          className="my-2 self-center rounded-full bg-white px-3 py-1 text-xs text-gray-500"
        >
          {formatMessageDate(m.timestamp)}
        </li>
      );
    }
    if (day) prevDay = day;

    items.push(
      <li
        key={m.id}
        className={`max-w-[70%] whitespace-pre-wrap break-words rounded-xl px-3 py-2 text-sm ${
          m.outgoing
            ? "self-end bg-[#d9e7f5] text-gray-900"
            : "self-start bg-white text-gray-900"
        } ${m.status === "sending" ? "opacity-60" : ""}`}
      >
        {m.text}
        {m.status === "failed" && (
          <span className="mt-1 flex items-center gap-2 text-xs text-red-600">
            Не отправлено
            <button
              type="button"
              className="underline"
              onClick={() => onRetry(m.id)}
            >
              Повторить
            </button>
          </span>
        )}
      </li>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-gray-200 bg-white px-5 py-3">
        <ChatAvatar url={avatarUrl} title={chatTitle(chat)} size={40} />
        <span className="text-sm font-medium text-gray-900">
          {chatTitle(chat)}
        </span>
      </header>

      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto px-5 py-4"
        >
          {historyError && (
            <div className="flex flex-col items-center gap-2 py-3 text-sm text-gray-600">
              <span>Не удалось загрузить историю: {historyError}</span>
              <Button size="small" onClick={requestOlder}>
                Повторить
              </Button>
            </div>
          )}

          {!loadingHistory && !historyError && messages.length === 0 && (
            <p className="mt-8 text-center text-sm text-gray-500">
              Сообщений пока нет. Напишите первое.
            </p>
          )}

          {messages.length > 0 && (
            <ul className="flex flex-col gap-2">{items}</ul>
          )}
        </div>

        {/* Индикатор поверх списка, чтобы он не сдвигал сообщения */}
        {loadingHistory && (
          <div className="pointer-events-none absolute inset-x-0 top-2 flex justify-center">
            <span className="rounded-full bg-white px-3 py-1 shadow">
              <Spin size="small" />
            </span>
          </div>
        )}
      </div>

      <div className="flex gap-2 border-t border-gray-200 bg-white px-4 py-3">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onPressEnter={handleSend}
          placeholder="Введите сообщение"
          size="large"
        />
        <Button
          type="primary"
          size="large"
          icon={<SendOutlined />}
          onClick={handleSend}
          disabled={!text.trim()}
          aria-label="Отправить"
        />
      </div>
    </div>
  );
};
