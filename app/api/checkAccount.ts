export type CheckAccountResult =
  | { success: true; chatId: string | null }
  | { success: false; error: string };

/**
 * Проверяет, есть ли аккаунт на номере телефона, и возвращает его chatId.
 * chatId = null, если аккаунта на этом номере нет.
 */
export async function checkAccount(
  idInstance: string,
  apiTokenInstance: string,
  phoneNumber: number,
  signal?: AbortSignal
): Promise<CheckAccountResult> {
  const url = `/api-green/waInstance${idInstance}/checkAccount/${apiTokenInstance}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber }), // в документации номер передаётся числом
      signal,
    });

    if (response.status === 469) {
      return {
        success: false,
        error: "Слишком частые проверки номеров. Повторите через несколько минут",
      };
    }
    if (response.status === 400) {
      return {
        success: false,
        error: "Неверный номер телефона или истекло время проверки номера",
      };
    }
    if (!response.ok) {
      throw new Error(`Ошибка при запросе к Green-API: ${response.statusText}`);
    }

    const data: { chatId?: unknown; exist?: unknown } = await response.json();
    const chatId =
      typeof data.chatId === "string" && data.chatId !== "" && data.exist !== false
        ? data.chatId
        : null;

    return { success: true, chatId };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Ошибка сети",
    };
  }
}
