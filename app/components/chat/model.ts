export interface Chat {
  /** chatId из Green-API; для локально созданных чатов "phone:<цифры>" */
  id: string;
  name?: string;
  type?: string;
  /** Только если номер известен (в API 0 означает "скрыт") */
  phoneNumber?: number;
  unreadCount?: number;
}

export interface Message {
  id: string;
  text: string;
  outgoing: boolean;
}

/** "+7 (999) 123-45-67" -> "79991234567" */
export function normalizePhone(input: string): string {
  return input.replace(/\D/g, "");
}

/** "79991234567" -> "+7 999 123 45 67". Остальные длины: просто "+цифры" */
export function formatPhone(digits: string): string {
  if (digits.length === 11) {
    return `+${digits[0]} ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9)}`;
  }
  return `+${digits}`;
}

export function chatTitle(chat: Chat): string {
  if (chat.name) return chat.name;
  if (chat.phoneNumber) return formatPhone(String(chat.phoneNumber));
  return chat.id;
}

const TYPE_LABELS: Record<string, string> = {
  user: "Контакт",
  bot: "Бот",
  group: "Группа",
  supergroup: "Супергруппа",
  channel: "Канал",
};

export function chatSubtitle(chat: Chat): string {
  if (!chat.type) return "Новый чат";
  return TYPE_LABELS[chat.type] ?? chat.type;
}

export function localChatFromPhone(digits: string): Chat {
  return { id: `phone:${digits}`, phoneNumber: Number(digits) };
}