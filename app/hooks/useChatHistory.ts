import { useCallback, useEffect, useRef, useState } from "react";
import { getChatHistory } from "../api/getChatHistory";
import type { Message } from "../components/chat/model";

/** Сколько сообщений добавляется за одну подгрузку */
export const HISTORY_PAGE_SIZE = 10;

export interface HistoryState {
  messages: Message[];
  requested: number;
  hasMore: boolean;
  loading: boolean;
  error: string | null;
}

const INITIAL: HistoryState = {
  messages: [],
  requested: 0,
  hasMore: true,
  loading: true,
  error: null,
};

/**
 * История чатов с подгрузкой "по страницам".
 *
 * У GetChatHistory нет смещения/курсора, только count (последние N сообщений).
 * Поэтому каждая следующая "страница" это запрос с count на 10 больше, а новыми
 * для интерфейса оказываются более старые сообщения. Предыдущие данные при этом
 * запрашиваются заново.
 */
export function useChatHistory(
  idInstance: string | undefined,
  apiTokenInstance: string | undefined,
  activeChatId: string | null
) {
  const [states, setStates] = useState<Record<string, HistoryState>>({});
  const statesRef = useRef(states);
  const inFlight = useRef(new Set<string>());

  useEffect(() => {
    statesRef.current = states;
  }, [states]);

  const loadMore = useCallback(
    async (chatId: string) => {
      if (!idInstance || !apiTokenInstance) return;
      if (inFlight.current.has(chatId)) return;

      const current = statesRef.current[chatId];
      if (current && !current.hasMore) return;

      const count = (current?.requested ?? 0) + HISTORY_PAGE_SIZE;

      inFlight.current.add(chatId);
      setStates((prev) => ({
        ...prev,
        [chatId]: { ...(prev[chatId] ?? INITIAL), loading: true, error: null },
      }));

      const result = await getChatHistory(
        idInstance,
        apiTokenInstance,
        chatId,
        count
      );
      inFlight.current.delete(chatId);

      setStates((prev) => {
        const base = prev[chatId] ?? INITIAL;
        if (!result.success) {
          return {
            ...prev,
            [chatId]: { ...base, loading: false, error: result.error },
          };
        }
        return {
          ...prev,
          [chatId]: {
            messages: result.messages,
            requested: count,
            // сервер вернул меньше, чем просили = дальше сообщений нет
            hasMore: result.total >= count,
            loading: false,
            error: null,
          },
        };
      });
    },
    [idInstance, apiTokenInstance]
  );

  useEffect(() => {
    if (activeChatId && !statesRef.current[activeChatId]) {
      void loadMore(activeChatId);
    }
  }, [activeChatId, loadMore]);

  const getState = useCallback(
    (chatId: string): HistoryState => states[chatId] ?? INITIAL,
    [states]
  );

  return { getState, loadMore };
}