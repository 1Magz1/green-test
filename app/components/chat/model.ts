export interface Chat {
  /** chatId из Green-API */
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
  /** UNIX-время в секундах, если известно */
  timestamp?: number;
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

/** Что показывать в списке и в шапке чата */
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

/** Подпись под названием чата в списке */
export function chatSubtitle(chat: Chat): string {
  if (!chat.type) return "Новый чат";
  return TYPE_LABELS[chat.type] ?? chat.type;
}

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** UNIX-время в секундах -> "17 октября 2026" (в часовом поясе браузера) */
export function formatMessageDate(timestamp: number): string {
  const parts = dateFormatter.formatToParts(new Date(timestamp * 1000));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return `${get("day")} ${get("month")} ${get("year")}`;
}

/** Ключ календарного дня сообщения (по местному времени), чтобы группировать по дням */
export function messageDayKey(timestamp: number): string {
  const d = new Date(timestamp * 1000);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}