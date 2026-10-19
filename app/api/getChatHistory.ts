import { placeholderText } from "../components/chat/model";

export interface HistoryMessage {
  id: string;
  text: string;
  outgoing: boolean;
  timestamp: number;
}

export type GetChatHistoryResult =
  | {
      success: true;
      /** Отсортированы по времени (старые сверху), без дублей по idMessage */
      messages: HistoryMessage[];
      /** Сколько элементов вернул сервер (до фильтрации и удаления дублей) */
      total: number;
    }
  | { success: false; error: string };

function toHistoryMessage(
  raw: Record<string, unknown>,
  index: number
): HistoryMessage | null {
  if (raw === null || typeof raw !== "object") return null;

  const timestamp = typeof raw.timestamp === "number" ? raw.timestamp : 0;
  const id =
    typeof raw.idMessage === "string" || typeof raw.idMessage === "number"
      ? String(raw.idMessage)
      : `h-${timestamp}-${index}`;

  const text =
    typeof raw.textMessage === "string" && raw.textMessage !== ""
      ? raw.textMessage
      : placeholderText(raw.typeMessage);

  return {
    id,
    text,
    outgoing: raw.type === "outgoing",
    timestamp,
  };
}

/**
 * Возвращает последние `count` сообщений чата.
 * В документации у метода есть только chatId и count, смещения/курсора нет.
 */
export async function getChatHistory(
  idInstance: string,
  apiTokenInstance: string,
  chatId: string,
  count: number,
  signal?: AbortSignal
): Promise<GetChatHistoryResult> {
  const url = `/api-green/waInstance${idInstance}/getChatHistory/${apiTokenInstance}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId, count }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`Ошибка при запросе к Green-API: ${response.statusText}`);
    }

    const data: unknown = await response.json();
    if (import.meta.env.DEV) {
      console.debug("[getChatHistory]", { chatId, count, response: data });
    }
    if (!Array.isArray(data)) {
      throw new Error("Неожиданный формат ответа getChatHistory");
    }

    const seen = new Set<string>();
    const messages = data
      .map((item, index) => ({
        index,
        message: toHistoryMessage(item as Record<string, unknown>, index),
      }))
      .filter(
        (x): x is { index: number; message: HistoryMessage } => x.message !== null
      )
      .filter(({ message }) => {
        if (seen.has(message.id)) return false;
        seen.add(message.id);
        return true;
      })
      // порядок в ответе не гарантирован документацией, сортируем сами
      .sort(
        (a, b) => a.message.timestamp - b.message.timestamp || a.index - b.index
      )
      .map((x) => x.message);

    return { success: true, messages, total: data.length };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Ошибка сети",
    };
  }
}