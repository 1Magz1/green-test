export interface NotificationBody {
  typeWebhook?: string;
  /** UNIX-время в секундах */
  timestamp?: number;
  idMessage?: string;
  senderData?: {
    chatId?: string;
    chatName?: string;
    chatType?: string;
    senderPhoneNumber?: number;
  };
  messageData?: {
    typeMessage?: string;
    textMessageData?: { textMessage?: string };
    extendedTextMessageData?: { text?: string };
  };
}

export interface ApiNotification {
  /** Нужен для DeleteNotification */
  receiptId: number;
  body: NotificationBody;
}

export type ReceiveNotificationResult =
  | { success: true; notification: ApiNotification | null }
  | {
      success: false;
      error: string;
      /** Повторять запрос бессмысленно (HTTP 400: неверные параметры или задан webhookUrl) */
      fatal: boolean;
    };

/**
 * Ждёт одно уведомление из очереди до receiveTimeout секунд (5-60).
 * notification = null, если за это время ничего не пришло.
 */
export async function receiveNotification(
  idInstance: string,
  apiTokenInstance: string,
  receiveTimeout: number,
  signal?: AbortSignal
): Promise<ReceiveNotificationResult> {
  const url = `/api-green/waInstance${idInstance}/receiveNotification/${apiTokenInstance}?receiveTimeout=${receiveTimeout}`;

  try {
    const response = await fetch(url, { signal });

    if (!response.ok) {
      const details = (await response.text().catch(() => "")).trim().slice(0, 300);
      return {
        success: false,
        fatal: response.status === 400,
        error: `${response.statusText || response.status}${details ? ` (${details})` : ""}`,
      };
    }

    // При таймауте ответ пустой (или null)
    const text = (await response.text()).trim();
    if (text === "" || text === "null") {
      return { success: true, notification: null };
    }

    const data = JSON.parse(text) as { receiptId?: unknown; body?: unknown };
    if (typeof data?.receiptId !== "number") {
      return { success: true, notification: null };
    }

    return {
      success: true,
      notification: {
        receiptId: data.receiptId,
        body: (data.body ?? {}) as NotificationBody,
      },
    };
  } catch (error) {
    return {
      success: false,
      fatal: false,
      error: error instanceof Error ? error.message : "Ошибка сети",
    };
  }
}
