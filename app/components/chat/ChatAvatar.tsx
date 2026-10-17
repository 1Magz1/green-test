import React from "react";
import { Avatar } from "antd";

interface ChatAvatarProps {
  url?: string | null;
  title: string;
  size: number;
}

export const ChatAvatar: React.FC<ChatAvatarProps> = ({ url, title, size }) => {
  const initial = title.trim().match(/[\p{L}\p{N}]/u)?.[0]?.toUpperCase() ?? "?";

  return (
    <Avatar
      size={size}
      src={url || undefined}
      className="shrink-0"
      style={{ backgroundColor: "#d1d5db", color: "#4b5563" }}
    >
      {initial}
    </Avatar>
  );
};
