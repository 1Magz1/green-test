import React from "react";
import { Button, Tooltip } from "antd";
import { EditOutlined, LogoutOutlined } from "@ant-design/icons";
import { formatPhone, type Chat } from "./model";

interface ChatSidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onLogout: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  chats,
  activeChatId,
  onSelect,
  onNewChat,
  onLogout,
}) => (
  <aside className="flex w-80 shrink-0 flex-col bg-white">
    <header className="flex items-center justify-between px-3 py-3 border-b-4">
      <div className="flex items-center gap-2">
        <Tooltip title="Выйти">
          <Button
            type="text"
            shape="circle"
            icon={<LogoutOutlined />}
            onClick={onLogout}
            aria-label="Выйти"
          />
        </Tooltip>
        <span className="text-base font-medium text-gray-800">Чат</span>
      </div>

      <Tooltip title="Новый чат">
        <Button
          type="text"
          shape="circle"
          icon={<EditOutlined />}
          onClick={onNewChat}
          aria-label="Новый чат"
        />
      </Tooltip>
    </header>

    {chats.length === 0 ? (
      <p className="px-4 py-6 text-sm text-gray-500">Чатов пока нет</p>
    ) : (
      <ul className="min-h-0 flex-1 overflow-y-auto">
        {chats.map((chat) => {
          const active = chat.id === activeChatId;
          return (
            <li key={chat.id}>
              <button
                type="button"
                onClick={() => onSelect(chat.id)}
                aria-current={active ? "true" : undefined}
                className={`flex w-full items-center gap-3 border-l-4 px-4 py-3 text-left transition-colors ${
                  active
                    ? "border-[#3d6fa3] bg-[#d9e7f5]"
                    : "border-transparent hover:bg-[#f1f5f9]"
                }`}
              >
                <span className="h-11 w-11 shrink-0 rounded-full bg-gray-300" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-gray-900">
                    {formatPhone(chat.phone)}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    онлайн
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    )}
  </aside>
);
