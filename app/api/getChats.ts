export interface ApiChat {
  chatId: string;
  name?: string;
  type?: string;
  phoneNumber?: number;
  unreadCount?: number;
}

export type GetChatsResult =
  | { success: true; chats: ApiChat[] }
  | { success: false; error: string };

export async function getChats(
  idInstance: string,
  apiTokenInstance: string,
  signal?: AbortSignal
): Promise<GetChatsResult> {
  const url = `/api-green/waInstance${idInstance}/getChats/${apiTokenInstance}`;

  try {
    const response = await fetch(url, { signal });

    if (!response.ok) {
      throw new Error(`Ошибка при запросе к Green-API: ${response.statusText}`);
    }

    const data: unknown = await response.json();
    if (!Array.isArray(data)) {
      throw new Error("Неожиданный формат ответа getChats");
    }

    const chats = data.filter(
      (item): item is ApiChat => typeof item?.chatId === "string"
    );
    return { success: true, chats };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Ошибка сети",
    };
  }
}
