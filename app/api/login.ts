/**
 * Метод для получения данных авторизации (QR-кода) через Green-API.
 * Использует прокси Vite для обхода CORS.
 * @param idInstance - ID экземпляра
 * @param apiTokenInstance - API токен экземпляра
 */
export interface QrResponse {
  type: "qrCode" | "alreadyLogged" | "error";
  message: string;
}

export type LoginResult =
  | { success: true; data: QrResponse }
  | { success: false; error: string };

export async function login(
  idInstance: string,
  apiTokenInstance: string
): Promise<LoginResult> {
  const url = `/api-green/waInstance${idInstance}/qr/${apiTokenInstance}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Ошибка при запросе к Green-API: ${response.statusText}`);
    }

    const data: QrResponse = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("API Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Ошибка сети",
    };
  }
}
