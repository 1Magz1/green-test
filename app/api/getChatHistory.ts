export interface HistoryMessage {
  id: string;
  text: string;
  outgoing: boolean;
  timestamp: number;
}

export type GetChatHistoryResult =
  | {
      success: true;
      messages: HistoryMessage[];
      total: number;
    }
  | { success: false; error: string };

const TYPE_LABELS: Record<string, string> = {
  imageMessage: "Фото",
  videoMessage: "Видео",
  documentMessage: "Документ",
  audioMessage: "Аудио",
  pollMessage: "Опрос",
  locationMessage: "Геопозиция",
};

function toHistoryMessage(raw: Record<string, unknown>): HistoryMessage | null {
  if (typeof raw.idMessage !== "string" || raw.idMessage === "") return null;

  const text =
    typeof raw.textMessage === "string" && raw.textMessage !== ""
      ? raw.textMessage
      : `[${TYPE_LABELS[String(raw.typeMessage)] ?? "Сообщение"}]`;

  return {
    id: raw.idMessage,
    text,
    outgoing: raw.type === "outgoing",
    timestamp: typeof raw.timestamp === "number" ? raw.timestamp : 0,
  };
}

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
    if (!Array.isArray(data)) {
      throw new Error("Неожиданный формат ответа getChatHistory");
    }

    const seen = new Set<string>();
    const messages = data
      .map((item, index) => ({
        index,
        message: toHistoryMessage(item as Record<string, unknown>),
      }))
      .filter(
        (x): x is { index: number; message: HistoryMessage } => x.message !== null
      )
      .filter(({ message }) => {
        if (seen.has(message.id)) return false;
        seen.add(message.id);
        return true;
      })
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
