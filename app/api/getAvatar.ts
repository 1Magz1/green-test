export type GetAvatarResult =
  | { success: true; url: string | null }
  | { success: false; error: string };

export async function getAvatar(
  idInstance: string,
  apiTokenInstance: string,
  chatId: string,
  signal?: AbortSignal
): Promise<GetAvatarResult> {
  const url = `/api-green/waInstance${idInstance}/getAvatar/${apiTokenInstance}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`Ошибка при запросе к Green-API: ${response.statusText}`);
    }

    const data: { urlAvatar?: unknown } = await response.json();
    const avatarUrl =
      typeof data.urlAvatar === "string" && /^https?:\/\//.test(data.urlAvatar)
        ? data.urlAvatar
        : null;

    return { success: true, url: avatarUrl };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Ошибка сети",
    };
  }
}
