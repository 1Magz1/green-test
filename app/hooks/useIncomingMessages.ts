import { useEffect, useRef } from "react";
import { message } from "antd";
import { deleteNotification } from "../api/deleteNotification";
import {
  receiveNotification,
  type NotificationBody,
} from "../api/receiveNotification";
import { placeholderText, type Chat, type Message } from "../components/chat/model";

/** Сколько секунд сервер держит запрос открытым, ожидая уведомление (допустимо 5-60) */
const RECEIVE_TIMEOUT_S = 30;
/** Небольшая пауза между запросами: у методов есть лимит запросов в секунду */
const PAUSE_MS = 333;
const RETRY_DELAY_MS = 3000;

// Уведомления об этих типах сообщений не являются новыми сообщениями.
// Названия предположительные (по названиям разделов документации).
const SKIPPED_TYPES = new Set(["reactionMessage", "editedMessage", "deletedMessage"]);

export interface IncomingMessage {
  chat: Chat;
  message: Message;
}

/** Превращает уведомление incomingMessageReceived в сообщение; для прочих типов null */
export function parseIncomingMessage(body: NotificationBody): IncomingMessage | null {
  if (body.typeWebhook !== "incomingMessageReceived") return null;

  const sender = body.senderData;
  const chatId = sender?.chatId;
  const idMessage = body.idMessage;
  if (!chatId || !idMessage) return null;

  const typeMessage = body.messageData?.typeMessage;
  if (typeMessage && SKIPPED_TYPES.has(typeMessage)) return null;

  const text =
    body.messageData?.textMessageData?.textMessage ||
    body.messageData?.extendedTextMessageData?.text ||
    placeholderText(typeMessage);

  return {
    chat: {
      id: chatId,
      name: sender?.chatName || undefined,
      type: sender?.chatType,
      // В групповом чате senderPhoneNumber это номер автора, а не чата
      phoneNumber:
        sender?.chatType === "user" ? sender.senderPhoneNumber || undefined : undefined,
    },
    message: {
      id: `in-${idMessage}`,
      serverId: idMessage,
      text,
      outgoing: false,
      timestamp: body.timestamp,
    },
  };
}

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true }
    );
  });

/**
 * Получает входящие сообщения через ReceiveNotification (длинный опрос очереди).
 * Каждое обработанное уведомление удаляется через DeleteNotification.
 */
export function useIncomingMessages(
  idInstance: string | undefined,
  apiTokenInstance: string | undefined,
  onIncoming: (incoming: IncomingMessage) => void
) {
  // Всегда вызываем актуальную версию обработчика, не перезапуская опрос
  const handlerRef = useRef(onIncoming);
  useEffect(() => {
    handlerRef.current = onIncoming;
  });

  useEffect(() => {
    if (!idInstance || !apiTokenInstance) return;

    const controller = new AbortController();
    const { signal } = controller;

    const run = async () => {
      while (!signal.aborted) {
        const result = await receiveNotification(
          idInstance,
          apiTokenInstance,
          RECEIVE_TIMEOUT_S,
          signal
        );
        if (signal.aborted) return;

        if (import.meta.env.DEV) {
          console.debug(
            "[notifications]",
            result.success ? (result.notification ?? "очередь пуста") : result
          );
        }

        if (!result.success) {
          message.error({
            key: "receive-error",
            content: `Не удалось получать сообщения: ${result.error}`,
          });
          if (result.fatal) return;
          await sleep(RETRY_DELAY_MS, signal);
          continue;
        }

        if (result.notification) {
          const { receiptId, body } = result.notification;
          const incoming = parseIncomingMessage(body);
          if (incoming) {
            handlerRef.current(incoming);
          } else if (import.meta.env.DEV) {
            console.debug("[notifications] пропущено (не входящее сообщение):", body.typeWebhook);
          }

          // Без signal: удаление должно завершиться, даже если страницу уже закрывают
          await deleteNotification(idInstance, apiTokenInstance, receiptId);
        }

        await sleep(PAUSE_MS, signal);
      }
    };

    void run();
    return () => controller.abort();
  }, [idInstance, apiTokenInstance]);
}