export type SendMessageResult =
  | { success: true; idMessage: string | null }
  | { success: false; error: string };

export async function sendMessage(
  idInstance: string,
  apiTokenInstance: string,
  chatId: string,
  message: string,
  signal?: AbortSignal
): Promise<SendMessageResult> {
  const url = `/api-green/waInstance${idInstance}/sendMessage/${apiTokenInstance}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId, message }),
      signal,
    });

    if (!response.ok) {
      const details = (await response.text().catch(() => "")).trim().slice(0, 200);
      throw new Error(
        `Ошибка при запросе к Green-API: ${response.statusText || response.status}${
          details ? ` (${details})` : ""
        }`
      );
    }

    const data: { idMessage?: unknown } = await response.json();
    return {
      success: true,
      idMessage: typeof data.idMessage === "string" ? data.idMessage : null,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Ошибка сети",
    };
  }
}
