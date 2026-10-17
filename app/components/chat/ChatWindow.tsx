import React, { useEffect, useRef, useState } from "react";
import { Button, Input } from "antd";
import { SendOutlined } from "@ant-design/icons";
import { ChatAvatar } from "./ChatAvatar";
import { chatTitle, type Chat, type Message } from "./model";

interface ChatWindowProps {
  chat: Chat;
  avatarUrl?: string | null;
  messages: Message[];
  onSend: (text: string) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  chat,
  avatarUrl,
  messages,
  onSend,
}) => {
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, chat.id]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-gray-200 bg-white px-5 py-3">
        <ChatAvatar url={avatarUrl} title={chatTitle(chat)} size={40} />
        <span className="text-sm font-medium text-gray-900">
          {chatTitle(chat)}
        </span>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {messages.length === 0 ? (
          <p className="mt-8 text-center text-sm text-gray-500">
            Сообщений пока нет.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {messages.map((m) => (
              <li
                key={m.id}
                className={`max-w-[70%] whitespace-pre-wrap break-words rounded-xl px-3 py-2 text-sm ${
                  m.outgoing
                    ? "self-end bg-[#d9e7f5] text-gray-900"
                    : "self-start bg-white text-gray-900"
                }`}
              >
                {m.text}
              </li>
            ))}
          </ul>
        )}
        <div ref={bottomRef} />
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
